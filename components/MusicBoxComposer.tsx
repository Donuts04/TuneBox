"use client";

import React from "react";
import { useState, useEffect, useRef } from "react";
import { Play, Pause, Save, Upload, Trash2, Music } from "lucide-react";
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

// Templates for popular songs
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
  const synthRef = useRef<Tone.PolySynth | null>(null);
  const playbackIntervalRef = useRef<NodeJS.Timeout | undefined>(undefined);

  useEffect(() => {
    // Initialize Tone.js with a more authentic music box sound
    synthRef.current = new Tone.PolySynth(Tone.Synth, {
      oscillator: {
        type: "sine",
        modulationType: "sine",
        modulationIndex: 0.2,
        harmonicity: 1.5,
      },
      envelope: {
        attack: 0.001,
        decay: 0.2,
        sustain: 0.1,
        release: 1.2,
      },
      volume: -8,
    }).toDestination();

    // Add a subtle vibrato for more character
    const vibrato = new Tone.Vibrato({
      frequency: 5,
      depth: 0.1,
      wet: 0.3,
    }).toDestination();
    synthRef.current.connect(vibrato);

    // Add a gentle reverb for natural space
    const reverb = new Tone.Reverb({
      decay: 1.5,
      wet: 0.2,
    }).toDestination();
    synthRef.current.connect(reverb);

    return () => {
      synthRef.current?.dispose();
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
    if (!synthRef.current) return;
    // Add a slight delay between notes for more mechanical feel
    const now = Tone.now();
    synthRef.current.triggerAttackRelease(note, "8n", now);
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
    <div className="p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-2xl font-medium text-center">Music Box</h1>

        <div className="bg-background border rounded-md shadow-sm">
          <div className="relative">
            {/* Fixed note names column */}
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
                      ${currentColumn === col ? "bg-primary/10" : ""}`}
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
                          ${currentColumn === col ? "bg-primary/10" : ""}`}
                        />
                      ))}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center gap-6">
          <Button
            size="lg"
            className="h-12 w-12 rounded-full shadow-sm"
            onClick={togglePlayback}
          >
            {isPlaying ? (
              <Pause className="h-6 w-6" />
            ) : (
              <Play className="h-6 w-6" />
            )}
          </Button>

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Tempo:</span>
            <Slider
              className="w-32"
              value={[tempo]}
              onValueChange={(value) => setTempo(value[0])}
              min={60}
              max={240}
              step={1}
            />
            <span className="text-sm font-mono w-8">{tempo}</span>
          </div>

          <Select onValueChange={loadTemplate}>
            <SelectTrigger className="w-[160px]">
              <Music className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Select a song" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(TEMPLATES).map(([id, template]) => (
                <SelectItem key={id} value={id}>
                  {template.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="ghost"
            size="icon"
            onClick={clearGrid}
            className="hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
