"use client";

import React from "react";
import { useState, useEffect, useRef } from "react";
import { Play, Pause, Music, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import * as Tone from "tone";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import Image from "next/image";
import { useTheme } from "next-themes";

const NOTES = [
  "C4",
  "D4",
  "E4",
  "F4",
  "G4",
  "A4",
  "B4",
  "C5",
  "D5",
  "E5",
  "F5",
  "G5",
  "A5",
  "B5",
  "C6",
  "D6",
  "E6",
  "F6",
];
const COLUMNS = 32;

const TEMPLATES = {
  twinkle: {
    name: "Twinkle Twinkle Little Star",
    grid: Array(NOTES.length)
      .fill(Array(COLUMNS).fill(false))
      .map((row, i) => {
        const notes = [
          { note: "C4", col: 0 },
          { note: "C4", col: 1 },
          { note: "G4", col: 2 },
          { note: "G4", col: 3 },
          { note: "A4", col: 4 },
          { note: "A4", col: 5 },
          { note: "G4", col: 6 },
          { note: "F4", col: 7 },
          { note: "F4", col: 8 },
          { note: "E4", col: 9 },
          { note: "E4", col: 10 },
          { note: "D4", col: 11 },
          { note: "D4", col: 12 },
          { note: "C4", col: 13 },
        ];
        return row.map((_, j) => {
          const note = notes.find((n) => n.col === j);
          return note && NOTES[i] === note.note;
        });
      }),
  },
  happy: {
    name: "Happy Birthday",
    grid: Array(NOTES.length)
      .fill(Array(COLUMNS).fill(false))
      .map((row, i) => {
        const notes = [
          { note: "C4", col: 0 },
          { note: "C4", col: 1 },
          { note: "D4", col: 2 },
          { note: "C4", col: 3 },
          { note: "F4", col: 4 },
          { note: "E4", col: 5 },
          { note: "C4", col: 6 },
          { note: "C4", col: 7 },
          { note: "D4", col: 8 },
          { note: "C4", col: 9 },
          { note: "G4", col: 10 },
          { note: "F4", col: 11 },
        ];
        return row.map((_, j) => {
          const note = notes.find((n) => n.col === j);
          return note && NOTES[i] === note.note;
        });
      }),
  },
  mary: {
    name: "Mary Had a Little Lamb",
    grid: Array(NOTES.length)
      .fill(Array(COLUMNS).fill(false))
      .map((row, i) => {
        const notes = [
          { note: "E4", col: 0 },
          { note: "D4", col: 1 },
          { note: "C4", col: 2 },
          { note: "D4", col: 3 },
          { note: "E4", col: 4 },
          { note: "E4", col: 5 },
          { note: "E4", col: 6 },
          { note: "D4", col: 7 },
          { note: "D4", col: 8 },
          { note: "D4", col: 9 },
          { note: "E4", col: 10 },
          { note: "G4", col: 11 },
          { note: "G4", col: 12 },
        ];
        return row.map((_, j) => {
          const note = notes.find((n) => n.col === j);
          return note && NOTES[i] === note.note;
        });
      }),
  },
};

export function MusicBoxComposer() {
  const [grid, setGrid] = useState<boolean[][]>(
    Array(NOTES.length).fill(Array(COLUMNS).fill(false))
  );
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentColumn, setCurrentColumn] = useState(0);
  const [tempo, setTempo] = useState(120);
  const playerRef = useRef<Tone.Player | null>(null);
  const playbackIntervalRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch by only showing content after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Initialize Tone.js with the music box sample
    const reverb = new Tone.Reverb({
      decay: 0.8,
      wet: 0.2,
    }).toDestination();

    playerRef.current = new Tone.Player({
      url: "/music-box-note-c_C_major.wav",
      volume: 0,
    }).connect(reverb);

    return () => {
      playerRef.current?.dispose();
      reverb.dispose();
    };
  }, []);

  const toggleNote = (row: number, col: number) => {
    setGrid((prevGrid) => {
      const newGrid = prevGrid.map((r) => [...r]);
      newGrid[row][col] = !newGrid[row][col];
      return newGrid;
    });
  };

  const playNote = (note: string) => {
    if (!playerRef.current) return;
    // Add a slight delay between notes for more mechanical feel
    const now = Tone.now();

    // Calculate the playback rate based on the note
    const baseNote = "C4";
    const semitones =
      Tone.Frequency(note).toMidi() - Tone.Frequency(baseNote).toMidi();
    const playbackRate = Math.pow(2, semitones / 12);

    playerRef.current.playbackRate = playbackRate;
    playerRef.current.start(now);
  };

  const playColumn = (column: number) => {
    grid.forEach((row, rowIndex) => {
      if (row[column]) {
        playNote(NOTES[rowIndex]);
      }
    });
  };

  const togglePlayback = async () => {
    if (isPlaying) {
      clearInterval(playbackIntervalRef.current);
      setIsPlaying(false);
      setCurrentColumn(0);
    } else {
      // Start Tone.js context if it hasn't been started yet
      await Tone.start();
      setIsPlaying(true);
      const interval = setInterval(() => {
        setCurrentColumn((prev) => {
          const nextColumn = (prev + 1) % COLUMNS;
          playColumn(nextColumn);
          return nextColumn;
        });
      }, ((60 / tempo) * 1000) / 2);
      playbackIntervalRef.current = interval;
    }
  };

  const clearGrid = () => {
    setGrid(Array(NOTES.length).fill(Array(COLUMNS).fill(false)));
    setCurrentColumn(0);
    setIsPlaying(false);
    clearInterval(playbackIntervalRef.current);
  };

  const saveComposition = () => {
    const data = JSON.stringify(grid);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "music-box-composition.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const loadComposition = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const loadedGrid = JSON.parse(event.target?.result as string);
        setGrid(loadedGrid);
      } catch (error) {
        console.error("Error loading composition:", error);
      }
    };
    reader.readAsText(file);
  };

  const loadTemplate = (templateId: string) => {
    const template = TEMPLATES[templateId as keyof typeof TEMPLATES];
    if (template) {
      setGrid(template.grid);
      setCurrentColumn(0);
      setIsPlaying(false);
      clearInterval(playbackIntervalRef.current);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div className="flex flex-col items-start justify-center">
          <h1 className="text-3xl font-bold sm:text-4xl">Music Box</h1>
          <p className="text-sm text-gray-500">
            Create your own music box compositions ;)
          </p>
        </div>
        {mounted && (
          <Image
            src="/tuney/pointDown.png"
            alt="TuneBox Logo"
            width={100}
            height={100}
            className={`object-cover ${theme === "dark" ? "invert" : ""}`}
            priority
          />
        )}
      </div>

      <div className="bg-background border rounded-md">
        <div className="relative">
          <div className="absolute left-0 top-0 z-10 bg-background">
            <div className="w-10 h-6 border-r border-b" />{" "}
            {/* Empty cell for column numbers */}
            {NOTES.map((note) => (
              <div
                key={`note-label-${note}`}
                className="w-10 h-6 flex items-center justify-center text-xs font-medium border-r border-b"
              >
                {note}
              </div>
            ))}
          </div>

          {/* Scrollable grid */}
          <div className="overflow-x-auto pl-10">
            <div
              className="grid min-w-[800px]"
              style={{ gridTemplateColumns: `repeat(${COLUMNS}, 1fr)` }}
            >
              {/* Column numbers */}
              {Array(COLUMNS)
                .fill(0)
                .map((_, col) => (
                  <div
                    key={col}
                    className={`h-6 border-r border-b flex items-center justify-center text-[10px]
                      ${
                        isPlaying && currentColumn === col
                          ? "bg-primary/10"
                          : ""
                      }`}
                  >
                    {col + 1}
                  </div>
                ))}

              {/* Grid cells */}
              {NOTES.map((note, row) => (
                <React.Fragment key={`note-${note}`}>
                  {Array(COLUMNS)
                    .fill(0)
                    .map((_, col) => (
                      <button
                        key={`${row}-${col}`}
                        onClick={() => toggleNote(row, col)}
                        className={`h-6 border-r border-b transition-colors
                          ${
                            grid[row][col] ? "bg-primary" : "hover:bg-primary/5"
                          }
                          ${
                            isPlaying && currentColumn === col
                              ? "bg-primary/10"
                              : ""
                          }`}
                      />
                    ))}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </div>

      <TooltipProvider>
        <div className="flex flex-col md:flex-row gap-4 justify-between">
          <div className="flex items-center gap-4 flex-1">
            <Button
              className={`h-10 w-10 flex-shrink-0 rounded-full transition-transform hover:scale-105 ${
                isPlaying
                  ? "bg-black text-white hover:bg-black/90 dark:bg-white dark:text-black dark:hover:bg-white/90"
                  : "bg-white text-black border border-black hover:bg-black hover:text-white dark:bg-black dark:text-white dark:border-white dark:hover:bg-white dark:hover:text-black"
              }`}
              onClick={togglePlayback}
            >
              {isPlaying ? (
                <Pause className="h-6 w-6" />
              ) : (
                <Play className="h-6 w-6" />
              )}
            </Button>

            <div className="flex items-center gap-3 bg-white dark:bg-black border border-black dark:border-white rounded-full px-4 py-2 shadow-sm flex-grow min-w-[180px]">
              <span className="text-sm font-medium whitespace-nowrap">
                Tempo:
              </span>
              <Slider
                className="w-full"
                value={[tempo]}
                onValueChange={(value) => setTempo(value[0])}
                min={60}
                max={240}
                step={1}
              />
              <span className="text-sm font-mono w-8">{tempo}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 justify-start sm:justify-end flex-1">
            <div className="w-full">
              <Select onValueChange={loadTemplate}>
                <SelectTrigger className="w-full border-black dark:border-white bg-white dark:bg-black h-10 w-full rounded-full">
                  <Music className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Load template" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(TEMPLATES).map(([id, template]) => (
                    <SelectItem key={id} value={id}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-full h-10 w-10 sm:w-auto sm:px-4 border-black dark:border-white bg-white dark:bg-black hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black"
                  onClick={clearGrid}
                >
                  <RefreshCw className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Clear</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Clear the composition</TooltipContent>
            </Tooltip>
          </div>
        </div>
      </TooltipProvider>
    </div>
  );
}
