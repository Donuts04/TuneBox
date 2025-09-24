/* eslint-disable */
"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Play,
  Pause,
  Download,
  Music,
  Mic,
  Volume2,
  Drum,
  AudioLines,
} from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { formatTime } from "@/lib/utils";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { encode } from "wav-encoder";
import RunnerLoader from "@/components/loaders/runner-loader";

export interface StemSource {
  name: string;
  icon: React.ReactNode;
  audioUrl?: string;
  audioData?: Uint8Array;
  audioBuffer?: AudioBuffer;
}

interface StemPlayerProps {
  audioUrls?: Record<string, string>;
}

export default function StemPlayer({ audioUrls = {} }: StemPlayerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudio, setRecordedAudio] = useState<Blob | null>(null);

  // Create stems object from audio URLs
  const stemMeta: Record<string, { name: string; icon: React.ReactNode }> = {
    vocals: {
      name: "Vocals",
      icon: <Mic className="h-4 w-4" />,
    },
    drums: {
      name: "Drums",
      icon: <Drum className="h-4 w-4" />,
    },
    bass: {
      name: "Bass",
      icon: <AudioLines className="h-4 w-4" />,
    },
    other: {
      name: "Other",
      icon: <Music className="h-4 w-4" />,
    },
  };

  const stems: Record<string, StemSource> = useMemo(
    () =>
      Object.entries(audioUrls).reduce((acc, [key, audioUrl]) => {
        if (stemMeta[key]) {
          acc[key] = {
            name: stemMeta[key].name,
            icon: stemMeta[key].icon,
            audioUrl: audioUrl,
          };
        }
        return acc;
      }, {} as Record<string, StemSource>),
    [audioUrls]
  );
  const [playingStems, setPlayingStems] = useState<Set<string>>(new Set());
  const [pausedStems, setPausedStems] = useState<Set<string>>(new Set());
  const [stemVolumes, setStemVolumes] = useState<Record<string, number>>({});
  const [stemCurrentTime, setStemCurrentTime] = useState(0);
  const [stemDuration, setStemDuration] = useState(0);
  const seekTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Tone.js refs
  const toneRef = useRef<null | typeof import("tone")>(null);
  const toneContextRef = useRef<any | null>(null);
  const transportRef = useRef<any | null>(null);
  const tonePlayersRef = useRef<Record<string, any>>({});
  const toneGainsRef = useRef<Record<string, any>>({});
  const transportDurationRef = useRef<number>(0);
  const transportEndEventIdRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const recorderRef = useRef<InstanceType<
    typeof import("tone").Recorder
  > | null>(null);

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

        // Step 2: Set up Tone.js context and transport
        toneRef.current = Tone;
        const ctx = new Tone.Context({ latencyHint: "interactive" });
        Tone.setContext(ctx);
        const transport = Tone.getTransport();
        transport.bpm.value = 120;
        transport.loopStart = 0;
        transport.loop = false;
        toneContextRef.current = ctx;
        transportRef.current = transport;

        // Step 3: Check if we have stems to load
        const entries = Object.entries(stems);
        if (entries.length === 0) {
          setIsLoading(false);
          return;
        }

        // Step 4: Load all audio stems
        let loadedCount = 0;
        const totalStems = entries.length;

        const loadStem = (key: string, src: StemSource) => {
          if (tonePlayersRef.current[key] || cancelled) return;

          try {
            const gain = new Tone.Gain({
              context: ctx,
              gain: stemVolumes[key] ?? 1,
            });
            try {
              (gain as any).connect((ctx as any).destination);
            } catch {}

            const player = new Tone.Player({
              url: src.audioUrl!,
              autostart: false,
              context: ctx,
              onload: () => {
                if (cancelled) return;

                const dur = player.buffer?.duration || 0;
                if (dur > 0) {
                  // track the longest duration across stems for transport
                  transportDurationRef.current = Math.max(
                    transportDurationRef.current,
                    dur
                  );
                  if (transport)
                    transport.loopEnd = transportDurationRef.current;
                  setStemDuration(transportDurationRef.current);
                  // reschedule end event whenever duration updates
                  if (transportEndEventIdRef.current !== null) {
                    try {
                      transport?.clear(transportEndEventIdRef.current);
                    } catch {}
                    transportEndEventIdRef.current = null;
                  }
                  transportEndEventIdRef.current = transport?.scheduleOnce(
                    (time: number) => {
                      // Stop and rewind to 0
                      transport?.pause();
                      if (transport) transport.seconds = 0;
                      setStemCurrentTime(0);
                      // Mute all players
                      Object.values(tonePlayersRef.current).forEach(
                        (p: any) => {
                          p.mute = true;
                        }
                      );
                      setPlayingStems(new Set());
                      setPausedStems(new Set());
                    },
                    transportDurationRef.current
                  ) as unknown as number | null;
                }

                // Check if all stems are loaded
                loadedCount++;
                if (loadedCount >= totalStems && !cancelled) {
                  setIsLoading(false);
                }
              },
              onerror: (err) => {
                if (cancelled) return;
                setError(`Failed to load audio for ${src.name}`);
                setIsLoading(false);
              },
            });

            player.connect(gain);
            try {
              player.sync();
            } catch {}
            // Pre-start players for transport sync (muted until user gesture)
            // This ensures sync with transport but may log warnings before Tone.start()
            player.start(0);
            player.mute = true;
            tonePlayersRef.current[key] = player;
            toneGainsRef.current[key] = gain;
          } catch (err) {
            if (cancelled) return;
            setError(`Failed to initialize audio player for ${src.name}`);
            setIsLoading(false);
          }
        };

        // Load all stems
        entries.forEach(([key, src]) => loadStem(key, src));
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
  }, [stems]);

  // Animation loop for time updates
  // Note: Uses shared transport timer - all stems sync to same timeline
  // Shorter stems will mute early, longest stem sets UI duration
  const updateTime = () => {
    const transport = transportRef.current;
    if (playingStems.size > 0 && transport) {
      const elapsed = transport.seconds;
      setStemCurrentTime(elapsed);
      animationFrameRef.current = requestAnimationFrame(updateTime);
    }
  };

  // Start time update loop
  useEffect(() => {
    if (playingStems.size > 0) {
      updateTime();
    } else {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [playingStems.size]);

  const stopAllSources = () => {
    Object.values(tonePlayersRef.current).forEach((player: any) => {
      player.mute = true;
    });
    transportRef.current?.pause();
  };

  // Recording functions
  const startRecording = async () => {
    const Tone = toneRef.current;
    const ctx = toneContextRef.current;
    if (!Tone || !ctx) return;

    // Only allow recording if there are stems loaded
    if (Object.keys(toneGainsRef.current).length === 0) {
      console.warn("No stems loaded for recording");
      return;
    }

    try {
      // Create a Recorder node with the same context
      const recorder = new Tone.Recorder({ context: ctx });

      // Connect the mixed output to the recorder
      // We'll connect all active gains to the recorder
      Object.values(toneGainsRef.current).forEach((gain: any) => {
        try {
          gain.connect(recorder);
        } catch {}
      });

      // Clear previous recording
      setRecordedAudio(null);

      // Start recording
      recorder.start();
      setIsRecording(true);
      recorderRef.current = recorder;
    } catch (error) {
      console.error("Error starting recording:", error);
    }
  };

  const stopRecording = async () => {
    if (recorderRef.current && isRecording) {
      try {
        // Stop recording and get the audio data
        const recording = await recorderRef.current.stop();
        setRecordedAudio(recording);
        setIsRecording(false);

        // Disconnect the recorder from all gains
        Object.values(toneGainsRef.current).forEach((gain: any) => {
          try {
            gain.disconnect(recorderRef.current);
          } catch {}
        });
      } catch (error) {
        console.error("Error stopping recording:", error);
        setIsRecording(false);
      }
    }
  };

  const downloadRecordedAudio = async () => {
    if (recordedAudio) {
      try {
        // Convert the recorded audio to WAV format
        const arrayBuffer = await recordedAudio.arrayBuffer();

        // Reuse existing AudioContext from Tone.js instead of creating new one
        const audioContext =
          toneContextRef.current?.rawContext || new AudioContext();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

        // Convert AudioBuffer to the format expected by wav-encoder
        const wavData = await encode({
          sampleRate: audioBuffer.sampleRate,
          channelData: Array.from(
            { length: audioBuffer.numberOfChannels },
            (_, i) => audioBuffer.getChannelData(i)
          ),
        });

        // Create and download the WAV file
        const blob = new Blob([wavData], { type: "audio/wav" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `stem-mix-${Date.now()}.wav`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        // Only close if we created a new context (not reusing existing one)
        if (!toneContextRef.current?.rawContext) {
          await audioContext.close();
        }
      } catch (error) {
        console.error("Error converting to WAV:", error);
        // Fallback to original format if WAV conversion fails
        const url = URL.createObjectURL(recordedAudio);
        const a = document.createElement("a");
        a.href = url;
        a.download = `stem-mix-${Date.now()}.webm`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    }
  };

  const togglePlayback = async (audioId: string) => {
    const Tone = toneRef.current;
    const ctx = toneContextRef.current;
    const transport = transportRef.current;
    const player = tonePlayersRef.current[audioId];
    if (!Tone || !player) return;

    // Ensure audio is started by user gesture
    try {
      await ctx?.resume();
      await Tone.start();
    } catch {}

    if (playingStems.has(audioId)) {
      // Pause this stem via mute
      player.mute = true;
      setPlayingStems((prev) => {
        const next = new Set(prev);
        next.delete(audioId);
        return next;
      });
      setPausedStems((prev) => {
        const next = new Set(prev);
        next.add(audioId);
        return next;
      });
      // If no stems left playing, pause transport
      setTimeout(() => {
        if (playingStems.size - 1 <= 0) {
          transport?.pause();
        }
      }, 0);
    } else {
      // Unmute this stem and ensure transport runs
      player.mute = false;
      if (playingStems.size === 0) {
        // If transport is at or beyond end, wrap to start when starting fresh
        const end = transportDurationRef.current || stemDuration || 0;
        if (end && (transport?.seconds || 0) >= end - 0.01) {
          if (transport) transport.seconds = 0;
        }
        transport?.start();
      }
      setPlayingStems((prev) => {
        const next = new Set(prev);
        next.add(audioId);
        return next;
      });
      setPausedStems((prev) => {
        const next = new Set(prev);
        next.delete(audioId);
        return next;
      });
    }
  };

  // Debounced seeking function using Tone.Transport
  const handleStemSeekDebounced = (value: number[]) => {
    const newTime = value[0];
    setStemCurrentTime(newTime);

    // Clear any existing timeout
    if (seekTimeoutRef.current) {
      clearTimeout(seekTimeoutRef.current);
    }

    // Set a timeout to actually seek after user stops dragging
    seekTimeoutRef.current = setTimeout(() => {
      handleStemSeekActual(newTime);
    }, 150); // 150ms delay after user stops dragging
  };

  // Actual seeking function that moves the Transport
  const handleStemSeekActual = async (newTime: number) => {
    const transport = transportRef.current;
    if (!transport) return;
    transport.seconds = newTime;
  };

  const handleVolumeChange = (audioId: string, value: number) => {
    const gain = toneGainsRef.current[audioId];
    if (gain) {
      gain.gain.rampTo(value, 0);
    }
    setStemVolumes((prev) => ({
      ...prev,
      [audioId]: value,
    }));
  };

  // Cleanup function
  useEffect(() => {
    return () => {
      stopAllSources();
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (seekTimeoutRef.current) {
        clearTimeout(seekTimeoutRef.current);
      }
      // Dispose Tone resources
      Object.values(tonePlayersRef.current).forEach((player: any) => {
        try {
          player.dispose();
        } catch {}
      });
      Object.values(toneGainsRef.current).forEach((gain: any) => {
        try {
          gain.dispose();
        } catch {}
      });
      tonePlayersRef.current = {};
      toneGainsRef.current = {};

      // Properly stop transport and close context
      try {
        if (transportRef.current) {
          transportRef.current.stop();
          transportRef.current.cancel();
        }
      } catch {}

      try {
        if (toneContextRef.current) {
          toneContextRef.current.close();
        }
      } catch {}

      // Clear refs
      transportRef.current = null;
      toneContextRef.current = null;
      recorderRef.current = null;
    };
  }, []);

  return (
    <div className="w-full border border-black dark:border-white rounded-lg p-4 space-y-4">
      <div>
        <h2 className="text-2xl font-semibold">Audio Separator</h2>
        <p className="text-sm text-muted-foreground">
          Play, mix, and dj individual audio tracks
        </p>
      </div>

      {Object.keys(stems).length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 space-y-4 text-center">
          <Music className="h-12 w-12" />
          <p>No Audio Stems Available, Please Process the Audio First</p>
        </div>
      ) : isLoading ? (
        <div className="flex justify-center items-center py-12">
          <div className="w-24 h-24">
            <RunnerLoader />
          </div>
        </div>
      ) : error ? (
        <Alert variant="destructive" className="animate-in fade-in-50">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : (
        <>
          {Object.keys(stems).length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-2">
                <Button
                  onClick={isRecording ? stopRecording : startRecording}
                  variant="outline"
                  size="sm"
                  disabled={Object.keys(stems).length === 0}
                  className="h-9 border border-black dark:border-white text-black dark:text-white hover:text-white hover:dark:text-black bg-transparent hover:bg-black dark:hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div
                    className={`w-2.5 h-2.5 rounded-full bg-red-500 ${
                      isRecording ? "animate-pulse" : ""
                    }`}
                  />
                  <span className="ml-2">
                    {isRecording ? "Stop Recording" : "Record Mix"}
                  </span>
                </Button>

                {recordedAudio && (
                  <Button
                    onClick={downloadRecordedAudio}
                    variant="outline"
                    size="sm"
                    className="h-9 border border-black dark:border-white text-black dark:text-white hover:text-white hover:dark:text-black bg-transparent hover:bg-black dark:hover:bg-white transition-colors"
                  >
                    <Download className="h-4 w-4" />
                    <span className="ml-2">Download WAV</span>
                  </Button>
                )}
              </div>
            </div>
          )}

          <div>
            {Object.keys(stems).length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {Object.entries(stems).map(([audioId, audioSource]) => (
                  <div
                    key={audioId}
                    className="border border-black dark:border-white rounded-lg overflow-hidden transition-all"
                  >
                    <div className="flex flex-col">
                      <div className="flex items-center justify-between p-3">
                        <div className="flex items-center">
                          <div className="w-9 h-9 rounded-full border border-black dark:border-white flex items-center justify-center mr-3">
                            {audioSource.icon}
                          </div>
                          <span className="font-semibold text-lg">
                            {audioSource.name}
                          </span>
                        </div>

                        <Button
                          variant="outline"
                          size="icon"
                          className={`h-9 w-9 rounded-full transition-colors border border-black dark:border-white ${
                            playingStems.has(audioId) ||
                            pausedStems.has(audioId)
                              ? "bg-black text-white dark:bg-white dark:text-black"
                              : "bg-transparent text-black dark:text-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black"
                          }`}
                          onClick={() => togglePlayback(audioId)}
                        >
                          {playingStems.has(audioId) ? (
                            <Pause className="h-4 w-4" />
                          ) : pausedStems.has(audioId) ? (
                            <Play className="h-4 w-4" />
                          ) : (
                            <Play className="h-4 w-4" />
                          )}
                        </Button>
                      </div>

                      <div className="flex items-center gap-3 bg-white dark:bg-black border-y border-black dark:border-white px-3 py-1.5">
                        <span className="text-xs font-mono whitespace-nowrap">
                          {formatTime(stemCurrentTime)}
                        </span>
                        <Slider
                          value={[stemCurrentTime]}
                          min={0}
                          max={stemDuration}
                          step={0.1}
                          onValueChange={handleStemSeekDebounced}
                          className="flex-grow"
                        />
                        <span className="text-xs font-mono w-8">
                          {formatTime(stemDuration)}
                        </span>
                      </div>

                      <div className="p-3 flex justify-between items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full h-9 border border-black/50 dark:border-white/50 text-black dark:text-white hover:text-white hover:dark:text-black bg-transparent hover:bg-black dark:hover:bg-white transition-colors"
                          asChild
                        >
                          <a
                            href={audioSource.audioUrl}
                            download={`${audioSource.name.toLowerCase()}.wav`}
                            title={`Download ${audioSource.name}`}
                            className="flex items-center gap-2"
                          >
                            <Download className="h-4 w-4" />
                            <span>Download</span>
                          </a>
                        </Button>
                      </div>

                      <div className="px-3 pb-3 flex items-center gap-2">
                        <Volume2 className="h-4 w-4 text-muted-foreground" />
                        <Slider
                          value={[stemVolumes[audioId] ?? 1]}
                          min={0}
                          max={1}
                          step={0.01}
                          onValueChange={(value) =>
                            handleVolumeChange(audioId, value[0])
                          }
                          className="flex-grow"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Transport Controls */}
    </div>
  );
}
