"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Play, Pause, Save, Upload, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"

const NOTES = ["C5", "B4", "A4", "G4", "F4", "E4", "D4", "C4"]
const COLUMNS = 32

export default function ComposePage() {
  const [grid, setGrid] = useState<boolean[][]>(Array(NOTES.length).fill(Array(COLUMNS).fill(false)))
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentColumn, setCurrentColumn] = useState(0)
  const [tempo, setTempo] = useState(120)
  const audioContextRef = useRef<AudioContext | null>(null)
  const oscillatorRef = useRef<OscillatorNode | null>(null)
  const playbackIntervalRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    audioContextRef.current = new AudioContext()
    return () => {
      audioContextRef.current?.close()
    }
  }, [])

  const toggleNote = (row: number, col: number) => {
    setGrid((prevGrid) => {
      const newGrid = prevGrid.map((r) => [...r])
      newGrid[row][col] = !newGrid[row][col]
      return newGrid
    })
  }

  const noteToFrequency = (note: string) => {
    const notes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]
    const octave = Number.parseInt(note.slice(-1))
    const noteIndex = notes.indexOf(note.slice(0, -1))
    return 440 * Math.pow(2, (noteIndex - 9) / 12 + (octave - 4))
  }

  const playNote = (frequency: number) => {
    if (!audioContextRef.current) return

    oscillatorRef.current?.disconnect()
    oscillatorRef.current = audioContextRef.current.createOscillator()
    const gainNode = audioContextRef.current.createGain()

    oscillatorRef.current.connect(gainNode)
    gainNode.connect(audioContextRef.current.destination)

    oscillatorRef.current.frequency.setValueAtTime(frequency, audioContextRef.current.currentTime)
    gainNode.gain.setValueAtTime(0.5, audioContextRef.current.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContextRef.current.currentTime + 0.5)

    oscillatorRef.current.start()
    oscillatorRef.current.stop(audioContextRef.current.currentTime + 0.5)
  }

  const playColumn = (column: number) => {
    grid.forEach((row, rowIndex) => {
      if (row[column]) {
        const frequency = noteToFrequency(NOTES[rowIndex])
        playNote(frequency)
      }
    })
  }

  const togglePlayback = () => {
    if (isPlaying) {
      clearInterval(playbackIntervalRef.current)
      setIsPlaying(false)
      setCurrentColumn(0)
    } else {
      setIsPlaying(true)
      const interval = setInterval(
        () => {
          setCurrentColumn((prev) => {
            const nextColumn = (prev + 1) % COLUMNS
            playColumn(nextColumn)
            return nextColumn
          })
        },
        ((60 / tempo) * 1000) / 2,
      )
      playbackIntervalRef.current = interval
    }
  }

  const clearGrid = () => {
    setGrid(Array(NOTES.length).fill(Array(COLUMNS).fill(false)))
    setCurrentColumn(0)
    setIsPlaying(false)
    clearInterval(playbackIntervalRef.current)
  }

  const saveComposition = () => {
    const data = JSON.stringify(grid)
    const blob = new Blob([data], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "music-box-composition.json"
    a.click()
    URL.revokeObjectURL(url)
  }

  const loadComposition = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const loadedGrid = JSON.parse(event.target?.result as string)
        setGrid(loadedGrid)
      } catch (error) {
        console.error("Error loading composition:", error)
      }
    }
    reader.readAsText(file)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Music Box Composer</h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Tempo:</span>
              <Slider
                className="w-32"
                value={[tempo]}
                onValueChange={(value) => setTempo(value[0])}
                min={60}
                max={240}
                step={1}
              />
              <span className="text-sm font-mono w-12">{tempo}</span>
            </div>
            <Button variant="outline" size="icon" onClick={clearGrid}>
              <Trash2 className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={saveComposition}>
              <Save className="h-4 w-4" />
            </Button>
            <label>
              <input type="file" accept=".json" onChange={loadComposition} className="hidden" />
              <Button variant="outline" size="icon" as="span">
                <Upload className="h-4 w-4" />
              </Button>
            </label>
          </div>
        </div>

        <div className="bg-card rounded-lg p-6 shadow-lg">
          <div className="grid" style={{ gridTemplateColumns: `auto repeat(${COLUMNS}, 1fr)` }}>
            {/* Note labels */}
            <div className="w-12" /> {/* Empty corner */}
            {Array(COLUMNS)
              .fill(0)
              .map((_, col) => (
                <div
                  key={col}
                  className={`h-8 border-r border-border flex items-center justify-center text-xs
                  ${currentColumn === col ? "bg-primary/20" : ""}`}
                >
                  {col + 1}
                </div>
              ))}
            {/* Grid */}
            {NOTES.map((note, row) => (
              <>
                <div
                  key={`label-${note}`}
                  className="w-12 h-8 flex items-center justify-center text-sm font-medium border-r border-border"
                >
                  {note}
                </div>
                {Array(COLUMNS)
                  .fill(0)
                  .map((_, col) => (
                    <button
                      key={`${row}-${col}`}
                      onClick={() => toggleNote(row, col)}
                      className={`h-8 border-r border-b border-border transition-colors
                      ${grid[row][col] ? "bg-primary" : "hover:bg-primary/10"}
                      ${currentColumn === col ? "bg-primary/20" : ""}`}
                    />
                  ))}
              </>
            ))}
          </div>
        </div>

        <div className="flex justify-center">
          <Button size="lg" className="h-16 w-16 rounded-full" onClick={togglePlayback}>
            {isPlaying ? <Pause className="h-8 w-8" /> : <Play className="h-8 w-8" />}
          </Button>
        </div>
      </div>
    </div>
  )
}

