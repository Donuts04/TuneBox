"use client";

import { useState, useEffect, useRef } from "react";
import * as Tone from "tone";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Play, Pause, Square, Volume2 } from "lucide-react";
import { INSTRUMENTS } from "@/lib/instruments";
import { Midi } from "@tonejs/midi";
import { NoteVisualization } from "./NoteVisualization";

export interface Note {
  start: number;
  end: number;
  pitch: number;
  velocity: number;
}

export interface MusicData {
  notes: Note[];
  "X-Processing-Time-Seconds": number;
}

interface TonePlayerProps {
  musicData: MusicData | null;
  midiData?: Midi | null;
  selectedModel: "basic" | "advanced";
  selectedInstrument: string;
}

export default function TonePlayer({
  musicData,
  midiData,
  selectedModel,
  selectedInstrument,
}: TonePlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isInstrumentLoaded, setIsInstrumentLoaded] = useState(false);
  const [playbackTempo, setPlaybackTempo] = useState(120);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  const sampler = useRef<Tone.Sampler | null>(null);
  const notesRef = useRef<Tone.Part | null>(null);
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  // Initialize the selected instrument
  useEffect(() => {
    if (!musicData) return;

    setIsInstrumentLoaded(false);

    const instrumentConfig = INSTRUMENTS.find(
      (inst) => inst.id === selectedInstrument
    );
    if (!instrumentConfig) return;

    if (sampler.current) {
      sampler.current.dispose();
    }

    if (instrumentConfig.type === "sampler") {
      const newSampler = new Tone.Sampler({
        urls: instrumentConfig.urls,
        baseUrl: instrumentConfig.baseUrl,
        onload: () => {
          setIsInstrumentLoaded(true);
        },
        onerror: () => {
          console.error(`Failed to load ${instrumentConfig.name} samples`);
        },
      }).toDestination();
      sampler.current = newSampler;
    } else if (instrumentConfig.type === "synth") {
      const newSynth = new Tone.Synth(instrumentConfig.options).toDestination();
      sampler.current = newSynth as unknown as Tone.Sampler;
      setIsInstrumentLoaded(true);
    } else if (instrumentConfig.type === "amSynth") {
      const newSynth = new Tone.AMSynth(
        instrumentConfig.options
      ).toDestination();
      sampler.current = newSynth as unknown as Tone.Sampler;
      setIsInstrumentLoaded(true);
    } else if (instrumentConfig.type === "fmSynth") {
      const newSynth = new Tone.FMSynth(
        instrumentConfig.options
      ).toDestination();
      sampler.current = newSynth as unknown as Tone.Sampler;
      setIsInstrumentLoaded(true);
    }

    if (sampler.current) {
      sampler.current.volume.value = Tone.gainToDb(volume);
    }

    return () => {
      if (sampler.current) {
        sampler.current.dispose();
      }
    };
  }, [selectedInstrument, musicData]);

  // Update volume when it changes
  useEffect(() => {
    if (sampler.current) {
      sampler.current.volume.value = Tone.gainToDb(volume);
    }
  }, [volume]);

  // Set up the notes for playback
  useEffect(() => {
    if (!musicData || !isInstrumentLoaded || !sampler.current) return;

    // Dispose previous part if it exists
    if (notesRef.current) {
      notesRef.current.dispose();
    }

    // Create a new part with the notes
    notesRef.current = new Tone.Part(
      (time, note) => {
        // Convert MIDI pitch to note name
        const noteName = Tone.Frequency(note.pitch, "midi").toNote();

        // Calculate duration in seconds
        const duration = note.end - note.start;

        // Play the note
        if (sampler.current) {
          sampler.current.triggerAttackRelease(
            noteName,
            duration,
            time,
            note.velocity
          );
        }
      },
      musicData.notes.map((note) => ({
        time: note.start,
        ...note,
      }))
    ).start(0);

    Tone.getTransport().bpm.value = playbackTempo;

    return () => {
      if (notesRef.current) {
        notesRef.current.dispose();
      }
    };
  }, [musicData, isInstrumentLoaded]);

  // Handle playback animation
  useEffect(() => {
    if (!isPlaying || !musicData) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      return;
    }

    // Start Tone.js transport if it's not started
    if (Tone.getTransport().state !== "started") {
      Tone.getTransport().start();
    }

    // Set the start time reference
    if (!startTimeRef.current) {
      startTimeRef.current = Tone.now() - currentTime;
    }

    // Animation loop for playback position
    const animate = () => {
      if (!startTimeRef.current || !musicData || !isPlaying) return;

      const elapsed = Tone.now() - startTimeRef.current;
      setCurrentTime(elapsed);

      const totalDuration = calculateTotalDuration(musicData.notes);
      const currentProgress = (elapsed / totalDuration) * 100;
      setProgress(Math.min(100, currentProgress));

      // Stop at the end
      if (elapsed >= totalDuration) {
        setIsPlaying(false);
        setCurrentTime(0);
        setProgress(0);
        Tone.getTransport().stop();
        Tone.getTransport().cancel();
        startTimeRef.current = null;

        return;
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, musicData, currentTime]);

  // Update tempo when it changes
  useEffect(() => {
    Tone.getTransport().bpm.value = playbackTempo;
  }, [playbackTempo]);

  // Toggle playback
  const togglePlayback = async () => {
    if (!musicData) return;

    try {
      // Start audio context if it's not started
      if (Tone.getContext().state !== "running") {
        await Tone.start();
      }

      if (isPlaying) {
        Tone.getTransport().pause();
      } else {
        // Stop any current playback
        Tone.getTransport().cancel();
        Tone.getTransport().stop();

        if (selectedModel === "advanced" && midiData) {
          // Schedule all MIDI events
          midiData.tracks.forEach((track) => {
            track.notes.forEach((note) => {
              Tone.getTransport().schedule((time) => {
                if (sampler.current) {
                  sampler.current.triggerAttackRelease(
                    note.name,
                    note.duration,
                    time,
                    note.velocity
                  );
                }
              }, note.time);
            });
          });

          // Update progress during playback
          Tone.getTransport().scheduleRepeat((time) => {
            const currentProgress =
              (Tone.getTransport().seconds / midiData.duration) * 100;
            setProgress(Math.min(100, currentProgress));
            setCurrentTime(Tone.getTransport().seconds);
          }, 0.1);

          // Handle playback completion
          Tone.getTransport().scheduleOnce(() => {
            setIsPlaying(false);
            setProgress(100);
            setCurrentTime(0);
            Tone.getTransport().stop();
            Tone.getTransport().cancel();
            startTimeRef.current = null;
          }, midiData.duration);
        } else {
          // Create a new part with the notes
          notesRef.current = new Tone.Part(
            (time, note) => {
              // Convert MIDI pitch to note name
              const noteName = Tone.Frequency(note.pitch, "midi").toNote();

              // Calculate duration in seconds
              const duration = note.end - note.start;

              // Play the note
              if (sampler.current) {
                sampler.current.triggerAttackRelease(
                  noteName,
                  duration,
                  time,
                  note.velocity
                );
              }
            },
            musicData.notes.map((note) => ({
              time: note.start,
              ...note,
            }))
          ).start(0);

          // Update progress during playback
          Tone.getTransport().scheduleRepeat((time) => {
            const totalDuration = calculateTotalDuration(musicData.notes);
            const currentProgress =
              (Tone.getTransport().seconds / totalDuration) * 100;
            setProgress(Math.min(100, currentProgress));
            setCurrentTime(Tone.getTransport().seconds);
          }, 0.1);

          // Handle playback completion
          Tone.getTransport().scheduleOnce(() => {
            setIsPlaying(false);
            setProgress(100);
            setCurrentTime(0);
            Tone.getTransport().stop();
            Tone.getTransport().cancel();
            startTimeRef.current = null;
          }, calculateTotalDuration(musicData.notes));
        }

        // Start playback
        Tone.getTransport().start();
      }

      setIsPlaying(!isPlaying);
    } catch (err) {
      console.error("Error playing audio:", err);
      setIsPlaying(false);
    }
  };

  // Stop playback
  const stopPlayback = () => {
    Tone.getTransport().stop();
    Tone.getTransport().cancel();
    setIsPlaying(false);
    setCurrentTime(0);
    setProgress(0);
    startTimeRef.current = null;
  };

  // Handle seeking in the timeline
  const handleSeek = (value: number[]) => {
    const newTime = value[0];
    setCurrentTime(newTime);
    const totalDuration =
      selectedModel === "advanced" && midiData
        ? midiData.duration
        : calculateTotalDuration(musicData?.notes || []);
    const newProgress = (newTime / totalDuration) * 100;
    setProgress(Math.min(100, newProgress));

    if (isPlaying) {
      // Stop current playback
      Tone.getTransport().stop();
      Tone.getTransport().cancel();

      // Restart from new position
      if (selectedModel === "advanced" && midiData) {
        // Schedule all MIDI events from new position
        midiData.tracks.forEach((track) => {
          track.notes.forEach((note) => {
            if (note.time >= newTime) {
              Tone.getTransport().schedule((time) => {
                if (sampler.current) {
                  sampler.current.triggerAttackRelease(
                    note.name,
                    note.duration,
                    time,
                    note.velocity
                  );
                }
              }, note.time - newTime);
            }
          });
        });
      } else if (musicData) {
        // Create a new part with the notes from new position
        notesRef.current = new Tone.Part(
          (time, note) => {
            if (note.start >= newTime) {
              const noteName = Tone.Frequency(note.pitch, "midi").toNote();
              const duration = note.end - note.start;
              if (sampler.current) {
                sampler.current.triggerAttackRelease(
                  noteName,
                  duration,
                  time,
                  note.velocity
                );
              }
            }
          },
          musicData.notes.map((note) => ({
            time: note.start - newTime,
            ...note,
          }))
        ).start(0);
      }

      Tone.getTransport().start();
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const calculateTotalDuration = (notes: Note[]) => {
    return notes.length > 0 ? Math.max(...notes.map((n) => n.end)) + 1 : 30;
  };

  if (!musicData || !musicData.notes || musicData.notes.length === 0) {
    return null;
  }

  const totalDuration =
    selectedModel === "advanced" && midiData
      ? midiData.duration
      : calculateTotalDuration(musicData.notes);

  return (
    <div className="space-y-4">
      <NoteVisualization
        notes={musicData.notes}
        totalDuration={totalDuration}
        isPlaying={isPlaying}
        currentTime={currentTime}
      />

      {/* Playback controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button
            onClick={togglePlayback}
            variant="outline"
            size="icon"
            disabled={!isInstrumentLoaded}
            className="h-10 w-10 rounded-full border border-black/20 dark:border-white/20"
          >
            {isPlaying ? (
              <Pause className="h-5 w-5" />
            ) : (
              <Play className="h-5 w-5" />
            )}
          </Button>
          <Button
            onClick={stopPlayback}
            variant="outline"
            size="icon"
            disabled={!isPlaying}
            className="h-10 w-10 rounded-full border border-black/20 dark:border-white/20"
          >
            <Square className="h-5 w-5" />
          </Button>
          <div className="text-sm font-medium ml-1">
            {formatTime(currentTime)} / {formatTime(totalDuration)}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Volume2 className="h-4 w-4 text-muted-foreground" />
          <Slider
            value={[volume]}
            min={0}
            max={1}
            step={0.01}
            className="w-24"
            onValueChange={(value) => setVolume(value[0])}
          />
        </div>
      </div>

      {/* Seek bar */}
      <Slider
        value={[currentTime]}
        min={0}
        max={totalDuration}
        step={0.01}
        className="w-full"
        onValueChange={handleSeek}
      />

      <div className="space-y-2">
        <Label className="text-sm font-medium">
          Tempo: {playbackTempo.toFixed(1)} BPM
        </Label>
        <Slider
          value={[playbackTempo]}
          min={60}
          max={200}
          step={1}
          onValueChange={(value) => setPlaybackTempo(value[0])}
        />
      </div>

      {!isInstrumentLoaded && (
        <div className="flex items-center justify-center py-2 text-sm text-muted-foreground">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
          Loading instrument samples...
        </div>
      )}
    </div>
  );
}
