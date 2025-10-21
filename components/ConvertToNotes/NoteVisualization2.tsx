import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import * as Tone from "tone";

interface Note {
  midi: number;
  time: number;
  duration: number;
  velocity: number;
}

interface NoteVisualizationProps {
  allNotes: Note[];
  isPlaying: boolean;
  currentTime: number;
  tempoRatio: number;
}

// Cache note names to avoid repeated calculations
const noteNameCache = new Map<number, string>();
const getNoteName = (pitch: number): string => {
  if (!noteNameCache.has(pitch)) {
    noteNameCache.set(pitch, Tone.Frequency(pitch, "midi").toNote());
  }
  return noteNameCache.get(pitch)!;
};

export function NoteVisualization({
  allNotes,
  isPlaying,
  currentTime,
  tempoRatio,
}: NoteVisualizationProps) {
  const [zoom, setZoom] = useState(1);
  const [containerWidth, setContainerWidth] = useState(800);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | undefined>(undefined);

  // Get the range of notes to display (memoized for performance)
  const { allPitches } = useMemo(() => {
    const unique = [...new Set(allNotes.map((note) => note.midi))].sort(
      (a, b) => a - b
    );
    const min = Math.min(...unique);
    const max = Math.max(...unique);
    const padding = 2;
    const start = Math.max(21, min - padding);
    const end = Math.min(108, max + padding);
    const all = Array.from({ length: end - start + 1 }, (_, i) => start + i);

    return {
      allPitches: all,
    };
  }, [allNotes]);

  // Memoize visible notes to avoid filtering on every frame
  const visibleNotes = useMemo(() => {
    const visibleTimeStart = currentTime - 2;
    const visibleTimeEnd = currentTime + 10;

    return allNotes.filter((note) => {
      const scaledNoteTime = note.time * tempoRatio;
      const scaledNoteDuration = note.duration * tempoRatio;
      return (
        scaledNoteTime <= visibleTimeEnd &&
        scaledNoteTime + scaledNoteDuration >= visibleTimeStart
      );
    });
  }, [allNotes, currentTime, tempoRatio]);

  const isNoteActive = useCallback(
    (note: Note) => {
      const scaledNoteTime = note.time * tempoRatio;
      const scaledNoteDuration = note.duration * tempoRatio;
      return (
        currentTime >= scaledNoteTime &&
        currentTime <= scaledNoteTime + scaledNoteDuration
      );
    },
    [currentTime, tempoRatio]
  );

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey) {
      e.preventDefault();
      const newZoom = Math.max(
        0.5,
        Math.min(3, zoom + (e.deltaY > 0 ? -0.1 : 0.1))
      );
      setZoom(newZoom);
    }
  };

  // Visualization constants
  const FIXED_HEIGHT = 400;
  const PIXELS_PER_SECOND_FALL = FIXED_HEIGHT / 4; // 4 seconds to fall
  const KEY_WIDTH = Math.max(20, containerWidth / allPitches.length); // Dynamic key width based on container

  const drawFallingNotes = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      const bottomY = FIXED_HEIGHT;

      // Use pre-filtered visible notes
      for (let i = 0; i < visibleNotes.length; i++) {
        const note = visibleNotes[i];
        const noteIndex = allPitches.indexOf(note.midi);
        if (noteIndex === -1) continue;

        const x = noteIndex * KEY_WIDTH;
        const noteWidth = KEY_WIDTH;

        // Calculate the vertical position based on time (scaled by tempo)
        const scaledNoteTime = note.time * tempoRatio;
        const scaledNoteDuration = note.duration * tempoRatio;
        const timeUntilNote = scaledNoteTime - currentTime;
        const noteHeight = scaledNoteDuration * PIXELS_PER_SECOND_FALL;
        const y = bottomY - timeUntilNote * PIXELS_PER_SECOND_FALL - noteHeight;

        // Only draw if the note is visible
        if (y + noteHeight > 0 && y < FIXED_HEIGHT) {
          const isActive = isNoteActive(note);

          // Simple rectangular notes
          if (isActive) {
            ctx.fillStyle = "#ef4444"; // Red for active
          } else {
            ctx.fillStyle = "#6b7280"; // Gray for inactive
          }
          ctx.fillRect(x, y, noteWidth, noteHeight);

          // Simple border
          ctx.strokeStyle = isActive ? "#dc2626" : "#4b5563";
          ctx.lineWidth = 1;
          ctx.strokeRect(x, y, noteWidth, noteHeight);

          // Draw splash effect when note hits the bottom (more prominent)
          if (y + noteHeight >= bottomY - 5) {
            const splashRadius = Math.min(noteWidth * 2.0, 40);
            const splashOpacity = Math.max(
              0,
              1 - (y + noteHeight - bottomY + 5) / 20
            );

            if (splashOpacity > 0.05) {
              // Outer splash - larger and more visible
              ctx.fillStyle = `rgba(239, 68, 68, ${splashOpacity * 0.4})`;
              ctx.beginPath();
              ctx.arc(x + noteWidth / 2, bottomY, splashRadius, 0, Math.PI * 2);
              ctx.fill();

              // Middle splash - medium size
              ctx.fillStyle = `rgba(252, 165, 165, ${splashOpacity * 0.6})`;
              ctx.beginPath();
              ctx.arc(
                x + noteWidth / 2,
                bottomY,
                splashRadius * 0.6,
                0,
                Math.PI * 2
              );
              ctx.fill();

              // Inner splash - bright center
              ctx.fillStyle = `rgba(255, 255, 255, ${splashOpacity * 0.8})`;
              ctx.beginPath();
              ctx.arc(
                x + noteWidth / 2,
                bottomY,
                splashRadius * 0.3,
                0,
                Math.PI * 2
              );
              ctx.fill();
            }
          }

          // Draw note name (simplified)
          if (noteHeight > 16) {
            ctx.fillStyle = "#ffffff";
            ctx.font = "10px Arial, sans-serif";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(
              getNoteName(note.midi),
              x + noteWidth / 2,
              y + noteHeight / 2
            );
          }
        }
      }
    },
    [
      visibleNotes,
      allPitches,
      currentTime,
      isNoteActive,
      KEY_WIDTH,
      PIXELS_PER_SECOND_FALL,
      tempoRatio,
    ]
  );

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Get device pixel ratio for crisp rendering
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();

    // Set actual size in memory (scaled to account for extra pixel density)
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    // Scale the drawing context so everything will work at the higher ratio
    ctx.scale(dpr, dpr);

    // Set the display size (css pixels)
    canvas.style.width = rect.width + "px";
    canvas.style.height = rect.height + "px";

    // Optimize rendering for better performance
    ctx.imageSmoothingEnabled = false; // Disable for crisp pixels

    const width = rect.width;
    const height = rect.height;

    // Clear canvas with transparent background
    ctx.clearRect(0, 0, width, height);

    // Draw falling notes
    drawFallingNotes(ctx);
  }, [drawFallingNotes]);

  useEffect(() => {
    if (!isPlaying) {
      // Only draw once when not playing
      draw();
      return;
    }

    const animate = () => {
      draw();
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, draw]);

  // Update container width on resize
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };

    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, []);

  // Redraw on resize to maintain crispness
  useEffect(() => {
    const handleResize = () => {
      draw();
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [draw]);

  const canvasWidth = Math.max(containerWidth, allPitches.length * KEY_WIDTH);

  return (
    <div
      ref={containerRef}
      className="relative w-full bg-transparent overflow-hidden"
    >
      <div
        className="overflow-x-auto overflow-y-hidden"
        onWheel={handleWheel}
        style={{ height: FIXED_HEIGHT }}
      >
        <canvas
          ref={canvasRef}
          width={canvasWidth}
          height={FIXED_HEIGHT}
          className="block"
          style={{ minWidth: canvasWidth }}
        />
      </div>
    </div>
  );
}
