// import React, {
//   useState,
//   useEffect,
//   useRef,
//   useMemo,
//   useCallback,
// } from "react";
// import * as Tone from "tone";

// interface NoteVisualizationProps {
//   allNotes: any[];
//   isPlaying: boolean;
//   currentTime: number;
//   tempoRatio: number;
// }

// // Cache note names to avoid repeated calculations
// const noteNameCache = new Map<number, string>();
// const getNoteName = (pitch: number): string => {
//   if (!noteNameCache.has(pitch)) {
//     noteNameCache.set(pitch, Tone.Frequency(pitch, "midi").toNote());
//   }
//   return noteNameCache.get(pitch)!;
// };

// // Piano key pattern for black keys - precomputed for better performance
// const blackKeyPattern = [0, 1, 0, 1, 0, 0, 1, 0, 1, 0, 1, 0];
// const isBlackKey = (midi: number): boolean => {
//   return blackKeyPattern[midi % 12] === 1;
// };

// export function NoteVisualization({
//   allNotes,
//   isPlaying,
//   currentTime,
//   tempoRatio,
// }: NoteVisualizationProps) {
//   const [zoom, setZoom] = useState(1);
//   const [containerWidth, setContainerWidth] = useState(800);
//   const canvasRef = useRef<HTMLCanvasElement>(null);
//   const containerRef = useRef<HTMLDivElement>(null);
//   const animationRef = useRef<number | undefined>(undefined);

//   // Get the range of notes to display (memoized for performance)
//   const { allPitches } = useMemo(() => {
//     const unique = [...new Set(allNotes.map((note) => note.midi))].sort(
//       (a, b) => a - b
//     );
//     const min = Math.min(...unique);
//     const max = Math.max(...unique);
//     const padding = 2;
//     const start = Math.max(21, min - padding);
//     const end = Math.min(108, max + padding);
//     const all = Array.from({ length: end - start + 1 }, (_, i) => start + i);

//     return {
//       allPitches: all,
//     };
//   }, [allNotes]);

//   // Memoize active notes for performance - only recalculate when currentTime changes
//   const activeNotes = useMemo(() => {
//     if (!isPlaying) return new Set<number>();

//     const active = new Set<number>();
//     for (let i = 0; i < allNotes.length; i++) {
//       const note = allNotes[i];
//       // Scale note timing by tempo ratio for visual display
//       const scaledNoteTime = note.time * tempoRatio;
//       const scaledNoteDuration = note.duration * tempoRatio;
//       if (
//         currentTime >= scaledNoteTime &&
//         currentTime <= scaledNoteTime + scaledNoteDuration
//       ) {
//         active.add(note.midi);
//       }
//     }
//     return active;
//   }, [allNotes, isPlaying, currentTime, tempoRatio]);

//   // Memoize visible notes to avoid filtering on every frame
//   const visibleNotes = useMemo(() => {
//     const visibleTimeStart = currentTime - 2;
//     const visibleTimeEnd = currentTime + 10;

//     return allNotes.filter((note) => {
//       const scaledNoteTime = note.time * tempoRatio;
//       const scaledNoteDuration = note.duration * tempoRatio;
//       return (
//         scaledNoteTime <= visibleTimeEnd &&
//         scaledNoteTime + scaledNoteDuration >= visibleTimeStart
//       );
//     });
//   }, [allNotes, currentTime, tempoRatio]);

//   // Simple lookup functions - O(1) instead of O(n)
//   const isNotePressed = useCallback(
//     (pitch: number) => activeNotes.has(pitch),
//     [activeNotes]
//   );
//   const isNoteActive = useCallback(
//     (pitch: number) => activeNotes.has(pitch),
//     [activeNotes]
//   );

//   const handleWheel = (e: React.WheelEvent) => {
//     if (e.ctrlKey) {
//       e.preventDefault();
//       const newZoom = Math.max(
//         0.5,
//         Math.min(3, zoom + (e.deltaY > 0 ? -0.1 : 0.1))
//       );
//       setZoom(newZoom);
//     }
//   };

//   // Piano visualization constants
//   const FIXED_HEIGHT = 400;
//   const KEYBOARD_HEIGHT = 80; // Height for piano keys at bottom
//   const FALLING_AREA_HEIGHT = FIXED_HEIGHT - KEYBOARD_HEIGHT;
//   const PIXELS_PER_SECOND_FALL = FALLING_AREA_HEIGHT / 4; // 4 seconds to fall
//   const KEY_WIDTH = Math.max(20, containerWidth / allPitches.length); // Dynamic key width based on container

//   const drawPianoKeys = useCallback(
//     (ctx: CanvasRenderingContext2D, width: number) => {
//       const pianoY = FIXED_HEIGHT - KEYBOARD_HEIGHT;
//       const whiteKeyHeight = KEYBOARD_HEIGHT;
//       const blackKeyHeight = KEYBOARD_HEIGHT * 0.6;

//       // Set common properties once
//       ctx.lineWidth = 1;
//       ctx.lineCap = "square";
//       ctx.lineJoin = "miter";

//       // Draw white keys first
//       for (let i = 0; i < allPitches.length; i++) {
//         const pitch = allPitches[i];
//         if (!isBlackKey(pitch)) {
//           const x = i * KEY_WIDTH;
//           const isPressed = isNotePressed(pitch);

//           ctx.fillStyle = isPressed ? "#d1d5db" : "#ffffff";
//           ctx.strokeStyle = "#000000";
//           ctx.fillRect(x, pianoY, KEY_WIDTH, whiteKeyHeight);
//           ctx.strokeRect(x, pianoY, KEY_WIDTH, whiteKeyHeight);

//           // Draw note name
//           ctx.fillStyle = "#000000";
//           ctx.font =
//             "bold 11px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
//           ctx.textAlign = "center";
//           ctx.textBaseline = "middle";
//           ctx.fillText(
//             getNoteName(pitch),
//             x + KEY_WIDTH / 2,
//             pianoY + whiteKeyHeight / 2
//           );
//         }
//       }

//       // Draw black keys on top
//       for (let i = 0; i < allPitches.length; i++) {
//         const pitch = allPitches[i];
//         if (isBlackKey(pitch)) {
//           const x = i * KEY_WIDTH;
//           const isPressed = isNotePressed(pitch);

//           ctx.fillStyle = isPressed ? "#4b5563" : "#000000";
//           ctx.strokeStyle = "#000000";
//           ctx.fillRect(x, pianoY, KEY_WIDTH, blackKeyHeight);
//           ctx.strokeRect(x, pianoY, KEY_WIDTH, blackKeyHeight);

//           // Draw note name
//           ctx.fillStyle = "#ffffff";
//           ctx.font =
//             "bold 9px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
//           ctx.textAlign = "center";
//           ctx.textBaseline = "middle";
//           ctx.fillText(
//             getNoteName(pitch),
//             x + KEY_WIDTH / 2,
//             pianoY + blackKeyHeight / 2
//           );
//         }
//       }
//     },
//     [allPitches, isNotePressed, KEY_WIDTH, KEYBOARD_HEIGHT]
//   );

//   const drawFallingNotes = useCallback(
//     (ctx: CanvasRenderingContext2D, width: number) => {
//       const pianoY = FIXED_HEIGHT - KEYBOARD_HEIGHT;

//       // Use pre-filtered visible notes
//       for (let i = 0; i < visibleNotes.length; i++) {
//         const note = visibleNotes[i];
//         const noteIndex = allPitches.indexOf(note.midi);
//         if (noteIndex === -1) continue;

//         const x = noteIndex * KEY_WIDTH;
//         const noteWidth = KEY_WIDTH;

//         // Calculate the vertical position based on time (scaled by tempo)
//         const scaledNoteTime = note.time * tempoRatio;
//         const scaledNoteDuration = note.duration * tempoRatio;
//         const timeUntilNote = scaledNoteTime - currentTime;
//         const noteHeight = scaledNoteDuration * PIXELS_PER_SECOND_FALL;
//         const y = pianoY - timeUntilNote * PIXELS_PER_SECOND_FALL - noteHeight;

//         // Only draw if the note is visible
//         if (y + noteHeight > 0 && y < FALLING_AREA_HEIGHT) {
//           const opacity = 0.3 + note.velocity * 0.7;
//           const isActive = isNoteActive(note.midi);

//           // Batch drawing operations
//           ctx.save();
//           ctx.fillStyle = `rgba(239, 68, 68, ${opacity})`;
//           ctx.fillRect(x, y, noteWidth, noteHeight);

//           if (isActive) {
//             ctx.strokeStyle = "#ef4444";
//             ctx.lineWidth = 2;
//             ctx.strokeRect(x, y, noteWidth, noteHeight);
//           }

//           // Draw note name on the note (only for larger notes)
//           if (noteHeight > 15) {
//             ctx.fillStyle = "#ffffff";
//             ctx.font =
//               "bold 10px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
//             ctx.textAlign = "center";
//             ctx.textBaseline = "middle";
//             ctx.fillText(
//               getNoteName(note.midi),
//               x + noteWidth / 2,
//               y + noteHeight / 2
//             );
//           }
//           ctx.restore();
//         }
//       }
//     },
//     [
//       visibleNotes,
//       allPitches,
//       currentTime,
//       isNoteActive,
//       KEY_WIDTH,
//       PIXELS_PER_SECOND_FALL,
//     ]
//   );

//   const draw = useCallback(() => {
//     const canvas = canvasRef.current;
//     if (!canvas) return;

//     const ctx = canvas.getContext("2d");
//     if (!ctx) return;

//     // Get device pixel ratio for crisp rendering
//     const dpr = window.devicePixelRatio || 1;
//     const rect = canvas.getBoundingClientRect();

//     // Set actual size in memory (scaled to account for extra pixel density)
//     canvas.width = rect.width * dpr;
//     canvas.height = rect.height * dpr;

//     // Scale the drawing context so everything will work at the higher ratio
//     ctx.scale(dpr, dpr);

//     // Set the display size (css pixels)
//     canvas.style.width = rect.width + "px";
//     canvas.style.height = rect.height + "px";

//     // Improve text rendering
//     ctx.imageSmoothingEnabled = true;
//     ctx.imageSmoothingQuality = "high";

//     const width = rect.width;
//     const height = rect.height;

//     // Clear canvas
//     ctx.fillStyle = "#ffffff";
//     ctx.fillRect(0, 0, width, height);

//     // Draw falling notes
//     drawFallingNotes(ctx, width);

//     // Draw piano keys
//     drawPianoKeys(ctx, width);
//   }, [drawFallingNotes, drawPianoKeys]);

//   useEffect(() => {
//     if (!isPlaying) {
//       // Only draw once when not playing
//       draw();
//       return;
//     }

//     let lastTime = 0;
//     const targetFPS = 20; // Further reduced to 20 FPS for better performance
//     const frameInterval = 1000 / targetFPS;

//     const animate = (currentTime: number) => {
//       if (currentTime - lastTime >= frameInterval) {
//         draw();
//         lastTime = currentTime;
//       }
//       animationRef.current = requestAnimationFrame(animate);
//     };

//     animationRef.current = requestAnimationFrame(animate);

//     return () => {
//       if (animationRef.current) {
//         cancelAnimationFrame(animationRef.current);
//       }
//     };
//   }, [isPlaying, draw]);

//   // Update container width on resize
//   useEffect(() => {
//     const updateWidth = () => {
//       if (containerRef.current) {
//         setContainerWidth(containerRef.current.offsetWidth);
//       }
//     };

//     updateWidth();
//     window.addEventListener("resize", updateWidth);
//     return () => window.removeEventListener("resize", updateWidth);
//   }, []);

//   // Redraw on resize to maintain crispness
//   useEffect(() => {
//     const handleResize = () => {
//       draw();
//     };

//     window.addEventListener("resize", handleResize);
//     return () => window.removeEventListener("resize", handleResize);
//   }, [draw]);

//   const canvasWidth = Math.max(containerWidth, allPitches.length * KEY_WIDTH);

//   return (
//     <div
//       ref={containerRef}
//       className="relative w-full bg-transparent rounded-md overflow-hidden border border-black/20 dark:border-white/20"
//     >
//       <div
//         className="overflow-x-auto overflow-y-hidden"
//         onWheel={handleWheel}
//         style={{ height: FIXED_HEIGHT }}
//       >
//         <canvas
//           ref={canvasRef}
//           width={canvasWidth}
//           height={FIXED_HEIGHT}
//           className="block"
//           style={{ minWidth: canvasWidth }}
//         />
//       </div>
//     </div>
//   );
// }
