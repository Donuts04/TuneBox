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

  const drawGridLines = useCallback(
    (ctx: CanvasRenderingContext2D, height: number) => {
      // Set grid line properties
      ctx.strokeStyle = "rgba(148, 163, 184, 0.2)";
      ctx.lineWidth = 1;
      ctx.setLineDash([]);

      // Draw vertical grid lines (note columns)
      for (let i = 0; i <= allPitches.length; i++) {
        const x = i * KEY_WIDTH;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }

      // Draw horizontal grid lines (time markers)
      const timeInterval = 0.5; // Every 0.5 seconds
      const pixelsPerSecond = PIXELS_PER_SECOND_FALL;

      for (let time = 0; time <= 10; time += timeInterval) {
        const y = height - time * pixelsPerSecond;
        if (y > 0 && y < height) {
          // Different line styles for different time intervals
          if (time % 2 === 0) {
            // Major grid lines (every 2 seconds)
            ctx.strokeStyle = "rgba(148, 163, 184, 0.3)";
            ctx.lineWidth = 1.5;
            ctx.setLineDash([]);
          } else {
            // Minor grid lines (every 0.5 seconds)
            ctx.strokeStyle = "rgba(148, 163, 184, 0.15)";
            ctx.lineWidth = 1;
            ctx.setLineDash([2, 4]);
          }

          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(allPitches.length * KEY_WIDTH, y);
          ctx.stroke();
        }
      }

      // Reset line dash
      ctx.setLineDash([]);
    },
    [allPitches, KEY_WIDTH, PIXELS_PER_SECOND_FALL]
  );

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
          const opacity = 0.4 + note.velocity * 0.6;
          const isActive = isNoteActive(note);

          ctx.save();

          // Draw rounded note with different colors for active/inactive
          const radius = Math.min(noteWidth / 4, noteHeight / 4, 8);
          if (isActive) {
            ctx.fillStyle = `rgba(59, 130, 246, ${opacity})`; // Blue for active
          } else {
            ctx.fillStyle = `rgba(239, 68, 68, ${opacity})`; // Red for inactive
          }
          ctx.beginPath();
          ctx.roundRect(x, y, noteWidth, noteHeight, radius);
          ctx.fill();

          // Draw border with different colors
          ctx.strokeStyle = isActive ? "#3b82f6" : "#dc2626";
          ctx.lineWidth = 1;
          ctx.stroke();

          // Draw splash effect when note hits the bottom
          if (y + noteHeight >= bottomY - 5) {
            const splashRadius = Math.min(noteWidth * 1.5, 30);
            const splashOpacity = Math.max(
              0,
              1 - (y + noteHeight - bottomY + 5) / 10
            );

            ctx.fillStyle = `rgba(59, 130, 246, ${splashOpacity * 0.3})`;
            ctx.beginPath();
            ctx.arc(x + noteWidth / 2, bottomY, splashRadius, 0, Math.PI * 2);
            ctx.fill();

            // Inner splash
            ctx.fillStyle = `rgba(255, 255, 255, ${splashOpacity * 0.5})`;
            ctx.beginPath();
            ctx.arc(
              x + noteWidth / 2,
              bottomY,
              splashRadius * 0.6,
              0,
              Math.PI * 2
            );
            ctx.fill();
          }

          // Draw note name
          if (noteHeight > 12) {
            ctx.fillStyle = "#ffffff";
            ctx.font =
              "bold 9px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(
              getNoteName(note.midi),
              x + noteWidth / 2,
              y + noteHeight / 2
            );
          }

          ctx.restore();
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

    // Improve text rendering
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    const width = rect.width;
    const height = rect.height;

    // Clear canvas
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);

    // Draw grid lines
    drawGridLines(ctx, height);

    // Draw falling notes
    drawFallingNotes(ctx);
  }, [drawGridLines, drawFallingNotes]);

  useEffect(() => {
    if (!isPlaying) {
      // Only draw once when not playing
      draw();
      return;
    }

    let lastTime = 0;
    const targetFPS = 20; // Further reduced to 20 FPS for better performance
    const frameInterval = 1000 / targetFPS;

    const animate = (currentTime: number) => {
      if (currentTime - lastTime >= frameInterval) {
        draw();
        lastTime = currentTime;
      }
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
      className="relative w-full bg-transparent rounded-md overflow-hidden border border-black/20 dark:border-white/20"
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
