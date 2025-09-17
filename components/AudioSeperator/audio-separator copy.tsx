"use client";

import React from "react";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
import HamsterLoader from "../loaders/hamster-loader";
import { formatTime } from "@/lib/utils";

export interface StemSource {
  name: string;
  icon: React.ReactNode;
  audioUrl?: string;
  audioData?: Uint8Array;
  audioBuffer?: AudioBuffer;
}

interface AudioSeparatorProps {
  stems?: Record<string, StemSource>;
  isLoading?: boolean;
  error?: string | null;
  loaderImageUrl?: string | null;
}

export default function AudioSeparator({
  stems: stemsProp = {},
  isLoading = false,
  error: errorProp = null,
  loaderImageUrl = null,
}: AudioSeparatorProps) {
  const [error, setError] = useState<string | null>(errorProp);
  const stems = stemsProp;
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

  const stemTypes = {
    vocals: {
      name: "Vocals",
      color: "bg-purple-500 hover:bg-purple-600",
      icon: <Mic className="h-4 w-4" />,
      filename: "vocals.wav",
    },
    drums: {
      name: "Drums",
      color: "bg-red-500 hover:bg-red-600",
      icon: <Drum className="h-4 w-4" />,
      filename: "drums.wav",
    },
    bass: {
      name: "Bass",
      color: "bg-blue-500 hover:bg-blue-600",
      icon: <AudioLines className="h-4 w-4" />,
      filename: "bass.wav",
    },
    other: {
      name: "Other",
      color: "bg-green-500 hover:bg-green-600",
      icon: <Music className="h-4 w-4" />,
      filename: "other.wav",
    },
  };

  // Load Tone.js (client-only)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const Tone = await import("tone");
      if (!cancelled) {
        toneRef.current = Tone;
        // Create isolated context and bind a transport to it
        const ctx = new Tone.Context({ latencyHint: "interactive" });
        const prevCtx = Tone.getContext();
        Tone.setContext(ctx);
        const transport = Tone.getTransport();
        // restore previous context immediately to avoid global side effects
        Tone.setContext(prevCtx);
        transport.bpm.value = 120;
        transport.loopStart = 0;
        transport.loop = false;
        toneContextRef.current = ctx;
        transportRef.current = transport;
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Processing moved to parent

  // After stems are set and Tone is loaded, create Tone players
  useEffect(() => {
    const Tone = toneRef.current;
    const transport = transportRef.current;
    const ctx = toneContextRef.current;
    if (!Tone) return;
    const entries = Object.entries(stems);
    if (entries.length === 0) return;

    // Create players for any new stems
    entries.forEach(([key, src]) => {
      if (tonePlayersRef.current[key]) return;
      const gain = new Tone.Gain({ context: ctx, gain: stemVolumes[key] ?? 1 });
      try {
        (gain as any).connect((ctx as any).destination);
      } catch {}
      const player = new Tone.Player({
        url: src.audioUrl!,
        autostart: false,
        context: ctx,
        onload: () => {
          const dur = player.buffer?.duration || 0;
          if (dur > 0) {
            // track the longest duration across stems for transport
            transportDurationRef.current = Math.max(
              transportDurationRef.current,
              dur
            );
            if (transport) transport.loopEnd = transportDurationRef.current;
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
                Object.values(tonePlayersRef.current).forEach((p: any) => {
                  p.mute = true;
                });
                setPlayingStems(new Set());
                setPausedStems(new Set());
              },
              transportDurationRef.current
            ) as unknown as number | null;
          }
        },
      });
      player.connect(gain);
      // Keep players synced to transport; start at time 0, controlled by transport position
      try {
        player.sync();
      } catch {}
      player.start(0);
      // Initially muted until explicitly played
      player.mute = true;
      tonePlayersRef.current[key] = player;
      toneGainsRef.current[key] = gain;
    });

    return () => {
      // Do not dispose here; do it in global cleanup
    };
  }, [stems, stemVolumes]);

  // Animation loop for time updates
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

  const togglePlayback = async (audioId: string) => {
    const Tone = toneRef.current;
    const ctx = toneContextRef.current;
    const transport = transportRef.current;
    const player = tonePlayersRef.current[audioId];
    if (!Tone || !player) return;

    // Ensure audio is started by user gesture
    try {
      await ctx?.resume();
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
      try {
        transportRef.current?.stop();
        transportRef.current?.cancel?.();
      } catch {}
      // No separate Destination instance; nodes connect to ctx.destination
      try {
        toneContextRef.current?.close?.();
      } catch {}
      transportRef.current = null;
      toneContextRef.current = null;
    };
  }, []);

  return (
    <div>
      {error && (
        <Alert variant="destructive" className="animate-in fade-in-50">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {isLoading && (
        <div className="flex justify-center items-center py-12">
          <HamsterLoader image={loaderImageUrl || undefined} size={20} />
        </div>
      )}

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
                    className={`h-9 w-9 rounded-full transition-colors ${
                      playingStems.has(audioId) || pausedStems.has(audioId)
                        ? "bg-black text-white dark:bg-white dark:text-black border border-black dark:border-white"
                        : "border border-black/50 dark:border-white/50 bg-transparent text-black dark:text-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black"
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

                  {/* <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleProcessedStem(audioId)}
                        className={`h-9 border w-full border-black/50 dark:border-white/50 text-black dark:text-white hover:text-white hover:dark:text-black bg-transparent hover:bg-black dark:hover:bg-white transition-colors`}
                      >
                        <KeyboardMusic className="h-4 w-4" />
                        <span>Convert to Notes</span>
                      </Button> */}
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
  );
}
