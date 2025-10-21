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
import { useAudio } from "@/contexts/audio-context";

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
      .fill(null)
      .map((_, i) => {
        const row = Array(COLUMNS).fill(false);
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
        notes.forEach((note) => {
          if (NOTES[i] === note.note) {
            row[note.col] = true;
          }
        });
        return row;
      }),
  },
  happy: {
    name: "Happy Birthday",
    grid: Array(NOTES.length)
      .fill(null)
      .map((_, i) => {
        const row = Array(COLUMNS).fill(false);
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
        notes.forEach((note) => {
          if (NOTES[i] === note.note) {
            row[note.col] = true;
          }
        });
        return row;
      }),
  },
  mary: {
    name: "Mary Had a Little Lamb",
    grid: Array(NOTES.length)
      .fill(null)
      .map((_, i) => {
        const row = Array(COLUMNS).fill(false);
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
        notes.forEach((note) => {
          if (NOTES[i] === note.note) {
            row[note.col] = true;
          }
        });
        return row;
      }),
  },
};

export function MusicBoxComposer() {
  const {
    context,
    transport,
    startAudio,
    registerPlayer,
    unregisterPlayer,
    stopOtherPlayers,
  } = useAudio();
  const [grid, setGrid] = useState<boolean[][]>(
    Array(NOTES.length)
      .fill(null)
      .map(() => Array(COLUMNS).fill(false))
  );
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentColumn, setCurrentColumn] = useState(0);
  const [tempo, setTempo] = useState(120);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Tone.js refs
  const toneRef = useRef<null | typeof import("tone")>(null);
  const playerRef = useRef<Tone.Sampler | null>(null);
  const loopRef = useRef<Tone.Loop | null>(null);
  const gridRef = useRef<boolean[][]>([]);

  // Load Tone.js and create audio players in one effect
  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    const loadEverything = async () => {
      try {
        // Step 1: Load Tone.js
        const Tone = await import("tone");
        if (cancelled) return;

        // Step 2: Use shared context and transport
        toneRef.current = Tone;
        if (!context || !transport) {
          setError("Audio context not ready");
          setIsLoading(false);
          return;
        }

        // Step 3: Create sampler with context
        const sampler = new Tone.Sampler({
          urls: {
            C4: "music-box-note-c_C_major.wav",
          },
          baseUrl: "/projects/tunebox/sounds/music-box/",
          context: context,
          onload: () => {
            if (cancelled) return;
            setIsLoading(false);
          },
          onerror: () => {
            if (cancelled) return;
            setError("Failed to load music box sample");
            setIsLoading(false);
          },
        });

        // Connect to destination
        try {
          sampler.connect(context.destination);
        } catch {}

        playerRef.current = sampler;
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load audio engine"
          );
          setIsLoading(false);
        }
      }
    };

    loadEverything();

    return () => {
      cancelled = true;
    };
  }, [context, transport]);

  // Sync tempo changes with transport
  useEffect(() => {
    if (transport) {
      transport.bpm.value = tempo;
    }
  }, [tempo, transport]);

  // Keep gridRef in sync with grid state
  useEffect(() => {
    gridRef.current = grid;
  }, [grid]);

  // Register this player and provide stop callback
  useEffect(() => {
    const stopCallback = () => {
      transport?.stop();
      transport?.cancel?.();
      setIsPlaying(false);
      setCurrentColumn(0);
      loopRef.current?.dispose();
      loopRef.current = null;
    };

    registerPlayer("musicBoxComposer", stopCallback);

    return () => {
      unregisterPlayer("musicBoxComposer");
    };
  }, [registerPlayer, unregisterPlayer, transport]);

  // Cleanup function
  useEffect(() => {
    return () => {
      // Dispose Tone resources
      playerRef.current?.dispose();
      loopRef.current?.dispose();

      // Properly stop transport
      try {
        if (transport) {
          transport.stop();
          transport.cancel();
        }
      } catch {}
    };
  }, [transport]);

  const toggleNote = (row: number, col: number) => {
    setGrid((prevGrid) => {
      const newGrid = prevGrid.map((r) => [...r]);
      newGrid[row][col] = !newGrid[row][col];
      return newGrid;
    });
  };

  const playColumn = (column: number, time: number) => {
    // Use gridRef to get the current grid state in real-time
    const player = playerRef.current;
    if (!player) return;

    gridRef.current.forEach((row, rowIndex) => {
      if (row[column]) {
        player.triggerAttackRelease(
          NOTES[rowIndex],
          "8n", // 8th note length
          time,
          0.5
        );
      }
    });
  };

  const togglePlayback = async () => {
    const Tone = toneRef.current;
    const player = playerRef.current;

    if (!Tone || !context || !transport || !player) return;

    if (isPlaying) {
      transport.stop();
      loopRef.current?.dispose();
      loopRef.current = null;
      setIsPlaying(false);
      setCurrentColumn(0);
    } else {
      // Stop other players before starting this one
      stopOtherPlayers("musicBoxComposer");
      // Clear and reset context before playing
      try {
        // Stop any existing transport
        transport.stop();
        transport.cancel();

        // Clear any existing scheduled events
        transport.clear(0);

        // Reset transport position
        transport.seconds = 0;

        // Ensure audio is started by user gesture
        await startAudio();
      } catch (err) {
        console.warn("Context reset failed:", err);
      }

      // Schedule a loop using transport
      loopRef.current = new Tone.Loop((time) => {
        setCurrentColumn((prev) => {
          const nextColumn = (prev + 1) % COLUMNS;
          playColumn(nextColumn, time);
          return nextColumn;
        });
      }, "8n");

      transport.bpm.value = tempo;
      transport.start();
      loopRef.current.start(0);
      setIsPlaying(true);
    }
  };

  const clearGrid = () => {
    setGrid(
      Array(NOTES.length)
        .fill(null)
        .map(() => Array(COLUMNS).fill(false))
    );
    setCurrentColumn(0);
    setIsPlaying(false);

    // Clear context and stop transport
    try {
      transport?.stop();
      transport?.cancel();
      transport?.clear(0);
    } catch {}

    loopRef.current?.dispose();
    loopRef.current = null;
  };

  const loadTemplate = (templateId: string) => {
    const template = TEMPLATES[templateId as keyof typeof TEMPLATES];
    if (template) {
      setGrid(template.grid);
      setCurrentColumn(0);
      setIsPlaying(false);

      // Clear context and stop transport
      try {
        transport?.stop();
        transport?.cancel();
        transport?.clear(0);
      } catch {}

      loopRef.current?.dispose();
      loopRef.current = null;
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black dark:border-white"></div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-2">
          Audio Error
        </h3>
        <p className="text-sm text-muted-foreground">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6" id="music-box">
      <div className="flex items-end justify-between">
        <div className="flex flex-col items-start justify-center">
          <h1 className="text-3xl font-bold sm:text-4xl">Music Box</h1>
          <p className="text-sm text-gray-500">
            Create your own music box compositions ;)
          </p>
        </div>

        <Image
          src="https://storage.googleapis.com/tunebox-stuff/tuney/pointDown.png"
          alt="TuneBox Logo"
          width={100}
          height={100}
          className="object-cover dark:invert"
          priority
        />
      </div>

      <div className="bg-background border">
        <div className="relative">
          <div className="absolute left-0 top-0 z-10 bg-background">
            <div className="w-10 h-6 border-r border-b" />{" "}
            {/* Empty cell for column numbers */}
            {NOTES.map((note, index) => (
              <div
                key={`note-label-${note}`}
                className={`w-10 h-6 flex items-center justify-center text-xs font-medium border-r
                  ${index < NOTES.length - 1 ? "border-b" : ""}`}
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
                    className={`h-6 border-b flex items-center justify-center text-[10px]
                      ${col < COLUMNS - 1 ? "border-r" : ""}
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
                        className={`h-6 transition-colors
                          ${col < COLUMNS - 1 ? "border-r" : ""}
                          ${row < NOTES.length - 1 ? "border-b" : ""}
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
        <div className="flex flex-col md:flex-row gap-2 justify-between">
          <div className="flex items-center gap-2 flex-1">
            <Button
              className={`h-9 w-9 flex-shrink-0 border border-black dark:border-white ${
                isPlaying
                  ? "bg-black text-white hover:bg-black/90 dark:bg-white dark:text-black dark:hover:bg-white/90"
                  : "bg-white text-black hover:bg-black hover:text-white dark:bg-black dark:text-white dark:border-white dark:hover:bg-white dark:hover:text-black"
              }`}
              onClick={togglePlayback}
            >
              {isPlaying ? (
                <Pause className="h-6 w-6" />
              ) : (
                <Play className="h-6 w-6" />
              )}
            </Button>

            <div className="flex items-center gap-3 bg-white dark:bg-black border border-black dark:border-white px-4 py-2 shadow-sm flex-grow min-w-[180px] h-9">
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
                <SelectTrigger className="w-full border-black dark:border-white bg-white dark:bg-black h-9 w-full">
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
                  className="h-9 w-9 sm:w-auto sm:px-4 border-black dark:border-white bg-white dark:bg-black hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black"
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
