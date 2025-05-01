import React, { useState } from "react";
import { Note } from "./audio-converter";
import * as Tone from "tone";

interface NoteVisualizationProps {
  notes: Note[];
  totalDuration: number;
  isPlaying: boolean;
  currentTime: number;
}

const getNoteName = (pitch: number): string => {
  return Tone.Frequency(pitch, "midi").toNote();
};

export function NoteVisualization({
  notes,
  totalDuration,
  isPlaying,
  currentTime,
}: NoteVisualizationProps) {
  const [zoom, setZoom] = useState(1);

  const uniquePitches = [...new Set(notes.map((note) => note.pitch))].sort(
    (a, b) => b - a
  );

  const minPitch = Math.min(...uniquePitches);
  const maxPitch = Math.max(...uniquePitches);
  const padding = 2;
  const startPitch = Math.max(21, minPitch - padding);
  const endPitch = Math.min(108, maxPitch + padding);

  const allPitches = Array.from(
    { length: endPitch - startPitch + 1 },
    (_, i) => startPitch + i
  ).reverse();

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

  const containerWidth = 1000 * zoom;
  const containerHeight = allPitches.length * 32;

  return (
    <div className="relative w-full h-[400px] bg-transparent rounded-md overflow-hidden border border-black/20 dark:border-white/20">
      <div className="absolute inset-0 overflow-auto" onWheel={handleWheel}>
        <div className="flex min-w-full" style={{ height: containerHeight }}>
          {/* Left sidebar with note names */}
          <div className="w-[60px] border-r border-black/20 dark:border-white/20 flex-shrink-0 sticky left-0 bg-white dark:bg-black z-10">
            {allPitches.map((pitch) => {
              const isUsed = uniquePitches.includes(pitch);
              return (
                <div
                  key={pitch}
                  className={`h-8 flex items-center justify-end pr-2 text-xs border-b border-black/10 dark:border-white/10 ${
                    isUsed
                      ? "text-gray-900 dark:text-gray-100"
                      : "text-gray-400 dark:text-gray-600"
                  }`}
                >
                  {getNoteName(pitch)}
                </div>
              );
            })}
          </div>

          {/* Main content area */}
          <div className="relative flex-1" style={{ minWidth: containerWidth }}>
            {/* Grid lines */}
            {allPitches.map((pitch, index) => (
              <div
                key={`line-${pitch}`}
                className="absolute w-full border-b border-gray-200 dark:border-gray-700"
                style={{
                  top: `${index * 32 + 31}px`,
                  height: "1px",
                }}
              />
            ))}

            {/* Notes */}
            {notes.map((note, index) => {
              const left = (note.start / totalDuration) * containerWidth;
              const width =
                ((note.end - note.start) / totalDuration) * containerWidth;

              const rowIndex = allPitches.indexOf(note.pitch);
              const top = rowIndex * 32;

              const opacity = 0.3 + note.velocity * 0.7;

              const isActive =
                isPlaying &&
                currentTime >= note.start &&
                currentTime <= note.end;

              return (
                <div
                  key={index}
                  className={`absolute ${
                    isActive ? "ring-2 ring-primary" : ""
                  }`}
                  style={{
                    left: `${left}px`,
                    top: `${top}px`,
                    width: `${Math.max(0.5, width)}px`,
                    height: "32px",
                    backgroundColor: `rgba(239, 68, 68, ${opacity})`,
                    border: "1px solid rgba(239, 68, 68, 0.3)",
                    transition: "all 0.1s ease-in-out",
                  }}
                />
              );
            })}

            {/* Playback cursor */}
            {currentTime > 0 && (
              <div
                className="absolute top-0 h-full w-0.5 bg-primary z-10"
                style={{
                  left: `${(currentTime / totalDuration) * containerWidth}px`,
                }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
