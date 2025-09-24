/* eslint-disable */
"use client";

import { useState, useEffect, useRef } from "react";
import * as Tone from "tone";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Play, Pause, Square, Volume2 } from "lucide-react";
import { INSTRUMENTS } from "@/lib/constants";
import { Midi } from "@tonejs/midi";
import { NoteVisualization } from "./NoteVisualization2";
import { cn, formatTime } from "@/lib/utils";
import { Alert, AlertDescription } from "@/components/ui/alert";
import RunnerLoader from "@/components/loaders/runner-loader";

interface TonePlayerProps {
  midiData: Midi | null;
  selectedInstrument: string;
  originalAudioUrl?: string;
}

export default function TonePlayer({
  midiData,
  selectedInstrument,
  originalAudioUrl,
}: TonePlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [playOriginal, setPlayOriginal] = useState(false);
  const [originalVolume, setOriginalVolume] = useState(0.5);
  const [isInstrumentLoaded, setIsInstrumentLoaded] = useState(false);
  const [playbackTempo, setPlaybackTempo] = useState(120);
  const [previousTempo, setPreviousTempo] = useState(120);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const sampler = useRef<Tone.Sampler | null>(null);
  const toneContextRef = useRef<any | null>(null);
  const transportRef = useRef<any | null>(null);
  const originalPlayerRef = useRef<Tone.Player | null>(null);
  const originalGainRef = useRef<Tone.Gain | null>(null);

  // Initialize isolated context/transport
  useEffect(() => {
    setIsLoading(true);
    setError(null);

    try {
      const ctx = new (Tone as any).Context({ latencyHint: "interactive" });
      // Keep the custom context active for proper isolation
      // This ensures all nodes (Player, Sampler, etc.) bind to the same context
      Tone.setContext(ctx);
      const transport = Tone.getTransport();
      transport.bpm.value = playbackTempo;
      transport.loop = false;
      toneContextRef.current = ctx;
      transportRef.current = transport;
      setIsLoading(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to initialize audio engine"
      );
      setIsLoading(false);
    }

    return () => {
      try {
        transportRef.current?.stop();
        transportRef.current?.cancel?.();
      } catch {}
      try {
        toneContextRef.current?.close?.();
      } catch {}
      transportRef.current = null;
      toneContextRef.current = null;
    };
  }, []);

  // Initialize/Update original audio player
  useEffect(() => {
    const ctx = toneContextRef.current;
    const destination = ctx?.destination;

    if (!originalAudioUrl || !ctx || !destination) {
      // Dispose if url removed
      originalPlayerRef.current?.dispose?.();
      originalGainRef.current?.dispose?.();
      originalPlayerRef.current = null;
      originalGainRef.current = null;
      return;
    }

    // Dispose any previous
    originalPlayerRef.current?.dispose?.();
    originalGainRef.current?.dispose?.();

    const gain = new Tone.Gain({ gain: originalVolume, context: ctx });
    if (destination) (gain as any).connect(destination);
    originalGainRef.current = gain;

    const player = new Tone.Player({
      url: originalAudioUrl,
      autostart: false,
      context: ctx,
    });
    (player as any).connect(gain);
    // tie playback rate to bpm (relative to 120 BPM baseline)
    (player as any).playbackRate = playbackTempo / 120;
    originalPlayerRef.current = player;

    return () => {
      originalPlayerRef.current?.stop?.();
      originalPlayerRef.current?.dispose?.();
      originalGainRef.current?.dispose?.();
      originalPlayerRef.current = null;
      originalGainRef.current = null;
    };
  }, [originalAudioUrl]);

  // Update original volume
  useEffect(() => {
    if (originalGainRef.current) {
      // Tone.Gain expects a linear gain (0..1);
      (originalGainRef.current as any).gain.value = originalVolume;
    }
  }, [originalVolume]);

  // Update original playbackRate when BPM changes and keep alignment if playing
  useEffect(() => {
    if (originalPlayerRef.current) {
      (originalPlayerRef.current as any).playbackRate = playbackTempo / 120;
      if (isPlaying && playOriginal) {
        const transportPos = transportRef.current?.seconds || 0;
        const rate = playbackTempo / 120;
        originalPlayerRef.current.stop();
        originalPlayerRef.current.start(undefined, transportPos / rate);
      }
    }
  }, [playbackTempo]);

  // Initialize the selected instrument
  useEffect(() => {
    if (!midiData || isLoading || error) return;

    // Reset everything when changing instruments
    transportRef.current?.stop();
    transportRef.current?.cancel?.();
    originalPlayerRef.current?.stop?.();
    setIsPlaying(false);
    setCurrentTime(0);

    setIsInstrumentLoaded(false);
    setError(null);

    const instrumentConfig = INSTRUMENTS.find(
      (inst) => inst.id === selectedInstrument
    );
    if (!instrumentConfig) {
      setError("Instrument not found");
      return;
    }

    if (sampler.current) {
      sampler.current.dispose();
    }

    const ctx = toneContextRef.current;
    const destination = ctx?.destination;

    if (!ctx || !destination) {
      setError("Audio context not available");
      return;
    }

    try {
      if (instrumentConfig.type === "sampler") {
        const newSampler = new Tone.Sampler({
          urls: instrumentConfig.urls,
          baseUrl: instrumentConfig.baseUrl,
          onload: () => {
            setIsInstrumentLoaded(true);
          },
          onerror: () => {
            setError(`Failed to load ${instrumentConfig.name} samples`);
          },
          context: ctx,
        });
        if (destination) (newSampler as any).connect(destination);
        sampler.current = newSampler;
      } else if (instrumentConfig.type === "synth") {
        const newSynth = new Tone.Synth({
          ...instrumentConfig.options,
          context: ctx,
        });
        if (destination) (newSynth as any).connect(destination);
        sampler.current = newSynth as unknown as Tone.Sampler;
        setIsInstrumentLoaded(true);
      } else if (instrumentConfig.type === "amSynth") {
        const newSynth = new Tone.AMSynth({
          ...instrumentConfig.options,
          context: ctx,
        });
        if (destination) (newSynth as any).connect(destination);
        sampler.current = newSynth as unknown as Tone.Sampler;
        setIsInstrumentLoaded(true);
      } else if (instrumentConfig.type === "fmSynth") {
        const newSynth = new Tone.FMSynth({
          ...instrumentConfig.options,
          context: ctx,
        });
        if (destination) (newSynth as any).connect(destination);
        sampler.current = newSynth as unknown as Tone.Sampler;
        setIsInstrumentLoaded(true);
      }

      if (sampler.current) {
        (sampler.current as any).volume.value = Tone.gainToDb(volume);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to initialize instrument"
      );
    }

    return () => {
      if (sampler.current) {
        sampler.current.dispose();
      }
    };
  }, [selectedInstrument, midiData, isLoading, error]);

  // Update volume when it changes
  useEffect(() => {
    if (sampler.current) {
      (sampler.current as any).volume.value = Tone.gainToDb(volume);
    }
  }, [volume]);

  // Set up the notes for playback (ensure clearing schedules when midi/instrument changes)
  useEffect(() => {
    if (!transportRef.current) return;
    // Clear any previously scheduled events to avoid duplicates
    try {
      transportRef.current.cancel?.();
      transportRef.current.stop?.();
      transportRef.current.seconds = 0;
    } catch {}
    if (!midiData || !isInstrumentLoaded || !sampler.current) return;
    transportRef.current.bpm.value = playbackTempo;
  }, [midiData, isInstrumentLoaded]);

  // Update tempo when it changes
  useEffect(() => {
    if (transportRef.current) transportRef.current.bpm.value = playbackTempo;

    // If currently playing, reschedule remaining notes with new tempo
    if (
      isPlaying &&
      midiData &&
      sampler.current &&
      playbackTempo !== previousTempo
    ) {
      // Get current position and convert to original MIDI time scale using previous tempo
      const currentPosition = transportRef.current
        ? transportRef.current.seconds
        : 0;
      const previousTempoRatio = 120 / previousTempo;
      const currentMidiTime = currentPosition / previousTempoRatio;

      // Stop current playback and clear all scheduled events
      transportRef.current?.stop();
      transportRef.current?.cancel?.();

      // Calculate new tempo ratio
      const newTempoRatio = 120 / playbackTempo;

      // Set transport position to the new scaled position
      const newPosition = currentMidiTime * newTempoRatio;
      if (transportRef.current) transportRef.current.seconds = newPosition;
      setCurrentTime(newPosition);

      // Reschedule all MIDI events from current position with new tempo
      midiData.tracks.forEach((track) => {
        track.notes.forEach((note) => {
          const scaledNoteTime = note.time * newTempoRatio;
          if (note.time >= currentMidiTime) {
            transportRef.current?.schedule((time: number) => {
              if (sampler.current) {
                sampler.current.triggerAttackRelease(
                  note.name,
                  note.duration * newTempoRatio,
                  time,
                  note.velocity
                );
              }
            }, scaledNoteTime);
          }
        });
      });

      // Update progress during playback
      transportRef.current?.scheduleRepeat((time: number) => {
        setCurrentTime(transportRef.current?.seconds || 0);
      }, 0.1);

      // Handle playback completion
      const totalDuration = midiData.duration * newTempoRatio;
      transportRef.current?.scheduleOnce(() => {
        setIsPlaying(false);
        setCurrentTime(0);
        transportRef.current?.stop();
        transportRef.current?.cancel?.();
        // Stop original audio when sequence ends
        originalPlayerRef.current?.stop?.();
      }, totalDuration);

      // Resume playback
      transportRef.current?.start();

      // Restart original audio from new position if enabled
      if (playOriginal) {
        originalPlayerRef.current?.stop?.();
        const rate = playbackTempo / 120;
        originalPlayerRef.current?.start?.(undefined, newPosition / rate);
      }
    }

    // Update previous tempo
    setPreviousTempo(playbackTempo);
  }, [playbackTempo, isPlaying, midiData, previousTempo]);

  // Toggle playback
  const togglePlayback = async () => {
    if (!midiData) return;

    try {
      // Start audio context if it's not started
      const ctx = toneContextRef.current as AudioContext | null;
      if (ctx && (ctx as any).state !== "running") {
        await (ctx as any).resume();
      }

      if (isPlaying) {
        transportRef.current?.pause();
        // Stop original audio (no pause) so we can resume at current position
        originalPlayerRef.current?.stop?.();
      } else {
        // If resuming from pause, just start the transport
        if ((transportRef.current?.seconds || 0) > 0) {
          transportRef.current?.start();
          if (playOriginal) {
            const resumePos = transportRef.current?.seconds || 0;
            const rate = playbackTempo / 120;
            originalPlayerRef.current?.stop?.();
            originalPlayerRef.current?.start?.(undefined, resumePos / rate);
          }
        } else {
          // If starting from beginning, set up everything
          // Stop any current playback and clear all scheduled events
          transportRef.current?.cancel?.();
          transportRef.current?.stop();

          // Set the tempo before starting playback
          if (transportRef.current)
            transportRef.current.bpm.value = playbackTempo;

          // Reset transport position to start
          if (transportRef.current) transportRef.current.seconds = 0;

          // Schedule all MIDI events with tempo scaling
          midiData.tracks.forEach((track) => {
            track.notes.forEach((note) => {
              transportRef.current?.schedule((time: number) => {
                if (sampler.current) {
                  sampler.current.triggerAttackRelease(
                    note.name,
                    note.duration * tempoRatio,
                    time,
                    note.velocity
                  );
                }
              }, note.time * tempoRatio);
            });
          });

          // Update progress during playback (optimized frequency for smooth playback)
          transportRef.current?.scheduleRepeat((time: number) => {
            setCurrentTime(transportRef.current?.seconds || 0);
          }, 0.1);

          // Handle playback completion
          transportRef.current?.scheduleOnce(() => {
            setIsPlaying(false);
            setCurrentTime(0);
            transportRef.current?.stop();
            transportRef.current?.cancel?.();
          }, totalDuration);

          // Start playback
          transportRef.current?.start();
          if (playOriginal) {
            originalPlayerRef.current?.stop?.();
            const rate = playbackTempo / 120;
            originalPlayerRef.current?.start?.(undefined, 0 / rate);
          }
        }
      }

      setIsPlaying(!isPlaying);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error playing audio");
      setIsPlaying(false);
    }
  };

  // Stop playback
  const stopPlayback = () => {
    transportRef.current?.stop();
    transportRef.current?.cancel?.();
    setIsPlaying(false);
    setCurrentTime(0);
    originalPlayerRef.current?.stop?.();
  };

  // Handle seeking in the timeline
  const handleSeek = (value: number[]) => {
    const newTime = value[0];
    setCurrentTime(newTime);
    const tempoRatio = 120 / playbackTempo;
    const totalDuration = (midiData?.duration || 0) * tempoRatio;

    if (isPlaying && midiData) {
      // Stop current playback and clear all scheduled events
      transportRef.current?.stop();
      transportRef.current?.cancel?.();

      // Set the tempo before restarting playback
      if (transportRef.current) transportRef.current.bpm.value = playbackTempo;

      // Set transport position to the new time
      if (transportRef.current) transportRef.current.seconds = newTime;

      // Restart from new position using the same system as togglePlayback
      // Schedule all MIDI events from new position with tempo scaling
      midiData.tracks.forEach((track) => {
        track.notes.forEach((note) => {
          const scaledNoteTime = note.time * tempoRatio;
          if (scaledNoteTime >= newTime) {
            transportRef.current?.schedule((time: number) => {
              if (sampler.current) {
                sampler.current.triggerAttackRelease(
                  note.name,
                  note.duration * tempoRatio,
                  time,
                  note.velocity
                );
              }
            }, scaledNoteTime);
          }
        });
      });

      // Update progress during playback (optimized frequency for smooth playback)
      transportRef.current?.scheduleRepeat((time: number) => {
        setCurrentTime(transportRef.current?.seconds || 0);
      }, 0.1);

      // Handle playback completion
      transportRef.current?.scheduleOnce(() => {
        setIsPlaying(false);
        setCurrentTime(0);
        transportRef.current?.stop();
        transportRef.current?.cancel?.();
        originalPlayerRef.current?.stop?.();
      }, totalDuration);

      // Start playback
      transportRef.current?.start();

      // Restart original from new seek position if enabled
      if (playOriginal) {
        originalPlayerRef.current?.stop?.();
        const rate = playbackTempo / 120;
        originalPlayerRef.current?.start?.(undefined, newTime / rate);
      }
    }
  };

  if (!midiData) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="w-24 h-24">
          <RunnerLoader />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="animate-in fade-in-50">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  // Create allNotes once for both playback and visualization
  const allNotes = midiData.tracks.flatMap((track) => track.notes);

  // Calculate actual playback duration based on tempo
  // Original duration is at 120 BPM, so we scale it by the tempo ratio
  const tempoRatio = 120 / playbackTempo;
  const totalDuration = midiData.duration * tempoRatio;

  return (
    <div className="space-y-4">
      <NoteVisualization
        allNotes={allNotes}
        isPlaying={isPlaying}
        currentTime={currentTime}
        tempoRatio={tempoRatio}
      />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            onClick={togglePlayback}
            disabled={!isInstrumentLoaded}
            className={cn(
              "h-8 w-8 rounded-full border border-black dark:border-white",
              isPlaying
                ? "bg-black text-white hover:bg-black/90 dark:bg-white dark:text-black dark:hover:bg-white/90"
                : "bg-white text-black hover:bg-black hover:text-white dark:bg-black dark:text-white dark:hover:bg-white dark:hover:text-black"
            )}
          >
            {isPlaying ? (
              <Pause className="h-3 w-3" />
            ) : (
              <Play className="h-3 w-3" />
            )}
          </Button>
          <Button
            onClick={stopPlayback}
            disabled={!isPlaying}
            className={cn(
              "h-8 w-8 rounded-full border border-black dark:border-white",
              "bg-white text-black hover:bg-black hover:text-white dark:bg-black dark:text-white dark:hover:bg-white dark:hover:text-black"
            )}
          >
            <Square className="h-3 w-3" />
          </Button>
        </div>
        <div className="text-sm font-medium">
          {formatTime(currentTime)} / {formatTime(totalDuration)}
        </div>
      </div>

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

      <div className="flex flex-wrap items-center gap-3 sm:gap-4">
        <div className="flex items-center gap-2 min-w-[160px] flex-1">
          <Volume2 className="h-4 w-4 text-muted-foreground" />
          <Slider
            value={[volume]}
            min={0}
            max={1}
            step={0.01}
            className="flex-1 min-w-[120px] sm:min-w-[160px] md:min-w-[200px]"
            onValueChange={(value) => setVolume(value[0])}
            aria-label="Instrument volume"
          />
        </div>

        {originalAudioUrl && (
          <div className="flex items-center gap-2 min-w-[200px] flex-1">
            <button
              type="button"
              aria-pressed={playOriginal}
              onClick={() => {
                const next = !playOriginal;
                setPlayOriginal(next);
                if (!next) {
                  originalPlayerRef.current?.stop?.();
                } else if (isPlaying) {
                  const pos = transportRef.current?.seconds || 0;
                  const rate = playbackTempo / 120;
                  originalPlayerRef.current?.stop?.();
                  originalPlayerRef.current?.start?.(undefined, pos / rate);
                }
              }}
              className={`text-xs px-2 py-1 rounded-full border ${
                playOriginal
                  ? "bg-black text-white border-black dark:bg-white dark:text-black dark:border-white"
                  : "bg-transparent text-black border-black dark:text-white dark:border-white"
              }`}
            >
              Original
            </button>
            <Slider
              value={[originalVolume]}
              min={0}
              max={1}
              step={0.01}
              className={
                "flex-1 min-w-[120px] sm:min-w-[160px] md:min-w-[200px]" +
                (playOriginal ? "" : " opacity-50 pointer-events-none")
              }
              onValueChange={(value) => setOriginalVolume(value[0])}
              aria-label="Original audio volume"
            />
          </div>
        )}
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
