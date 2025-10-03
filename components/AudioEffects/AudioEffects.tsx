/* eslint-disable */
"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Play,
  Pause,
  Square,
  Repeat,
  Download,
  AlertCircle,
} from "lucide-react";
import { cn, formatTime } from "@/lib/utils";
import { encode } from "wav-encoder";
import RunnerLoader from "@/components/loaders/runner-loader";
import * as Tone from "tone";
import { useAudio } from "@/contexts/audio-context";

interface AudioEffectsProps {
  audioUrl?: string | null;
  initialSpeed?: number;
  initialReverbWet?: number; // 0-1 (e.g., 0.7 for 70%)
  initialReverbDecay?: number; // seconds (e.g., 6.5)
}

export default function AudioEffects({
  audioUrl,
  initialSpeed = 1,
  initialReverbWet = 0.7,
  initialReverbDecay = 6.5,
}: AudioEffectsProps) {
  const {
    context,
    startAudio,
    registerPlayer,
    unregisterPlayer,
    stopOtherPlayers,
  } = useAudio();
  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [speed, setSpeed] = useState(initialSpeed);
  const [reverbWet, setReverbWet] = useState(initialReverbWet);
  const [reverbDecay, setReverbDecay] = useState(initialReverbDecay);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);
  const [isBufferLoaded, setIsBufferLoaded] = useState(false);
  const [isLooping, setIsLooping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudio, setRecordedAudio] = useState<Blob | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Memoize expensive calculations
  const formattedCurrentTime = useMemo(
    () => formatTime(currentTime),
    [currentTime]
  );
  const formattedTotalDuration = useMemo(
    () => formatTime(totalDuration),
    [totalDuration]
  );
  const volumePercentage = useMemo(() => (volume * 100).toFixed(0), [volume]);
  const speedFormatted = useMemo(() => speed.toFixed(2), [speed]);
  const reverbWetPercentage = useMemo(
    () => (reverbWet * 100).toFixed(0),
    [reverbWet]
  );
  const reverbDecayFormatted = useMemo(
    () => reverbDecay.toFixed(1),
    [reverbDecay]
  );

  // Sync ref with state for performance optimization in tick function
  useEffect(() => {
    isLoopingRef.current = isLooping;
  }, [isLooping]);

  const toneRef = useRef<null | typeof Tone>(null);
  const playerRef = useRef<Tone.Player | null>(null);
  const gainRef = useRef<Tone.Gain | null>(null);
  const reverbRef = useRef<Tone.Reverb | null>(null);
  const rafRef = useRef<number | null>(null);
  const startWallTimeRef = useRef<number>(0);
  const startBufferOffsetRef = useRef<number>(0); // seconds in source buffer when play started
  const originalDurationRef = useRef<number>(0);
  const isPlayingRef = useRef<boolean>(false);
  const isLoopingRef = useRef<boolean>(false);
  const mediaRecorderRef = useRef<InstanceType<typeof Tone.Recorder> | null>(
    null
  );
  const lastUpdateTimeRef = useRef<number>(0);
  const UPDATE_INTERVAL = 1000 / 30; // 30fps for smoother performance

  const sourceUrlRef = useRef<string | null>(null);

  // Prepare Tone.js context
  useEffect(() => {
    if (!context) {
      setIsReady(false);
      return;
    }

    toneRef.current = Tone;
    setIsReady(true);
  }, [context]);

  // Register this player and provide stop callback
  useEffect(() => {
    const stopCallback = () => {
      if (playerRef.current) {
        try {
          playerRef.current.stop();
        } catch {}
      }
      setIsPlaying(false);
      isPlayingRef.current = false;
      setCurrentTime(0);
      setIsLooping(false);
      isLoopingRef.current = false;
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };

    registerPlayer("audioEffects", stopCallback);

    return () => {
      unregisterPlayer("audioEffects");
    };
  }, [registerPlayer, unregisterPlayer]);

  // Resolve source URL whenever inputs change
  useEffect(() => {
    // Cleanup previous blob URL if any
    if (sourceUrlRef.current && sourceUrlRef.current.startsWith("blob:")) {
      try {
        URL.revokeObjectURL(sourceUrlRef.current);
      } catch {}
    }
    sourceUrlRef.current = null;
    setLoadError(null);

    if (audioUrl) {
      sourceUrlRef.current = audioUrl;
    }

    // Recreate player graph for new source
    void setupGraph();

    // stop on inputs change
  }, [audioUrl]);

  // If Tone becomes ready after source is set, build the graph
  useEffect(() => {
    if (isReady && sourceUrlRef.current) {
      void setupGraph();
    }
  }, [isReady]);

  // Build audio graph: Player -> Gain -> Reverb -> Destination
  const setupGraph = async () => {
    const Tone = toneRef.current;
    const url = sourceUrlRef.current;
    if (!Tone || !context || !url) {
      cleanupNodes();
      setLoadError(
        !url ? "No audio source selected." : "Audio context not ready."
      );
      return;
    }

    cleanupNodes();
    setIsBufferLoaded(false);
    setLoadError(null);

    const reverb = new Tone.Reverb({
      decay: reverbDecay,
      wet: reverbWet,
      context: context,
    });
    // Generate IR asynchronously; don't block playback
    try {
      // generate() is async and safe to call multiple times
      reverb.generate?.().catch((error: Error) => {
        console.warn("Reverb generation failed:", error);
      });
    } catch (error) {
      console.warn("Reverb setup failed:", error);
    }
    const gain = new Tone.Gain({ gain: volume, context: context });

    // Connect the audio graph properly
    try {
      gain.connect(reverb);
      reverb.connect((context as any).destination);
    } catch {}

    const player = new Tone.Player({
      url,
      autostart: false,
      context: context,
      onload: () => {
        const dur = player.buffer?.duration || 0;
        originalDurationRef.current = dur;
        setTotalDuration(dur);
        setCurrentTime(0);
        setIsBufferLoaded(true);
      },
      onerror: (e: Error) => {
        setIsBufferLoaded(false);
        setLoadError("Failed to load audio. Please try again.");
        console.error("Tone.Player load error:", e);
      },
    });
    try {
      player.connect(gain);
    } catch {}
    player.playbackRate = speed;

    playerRef.current = player;
    gainRef.current = gain;
    reverbRef.current = reverb;
  };

  const cleanupNodes = () => {
    // Stop and dispose of player
    try {
      if (playerRef.current) {
        playerRef.current.stop();
        playerRef.current.dispose();
      }
    } catch {}

    // Dispose of gain node
    try {
      if (gainRef.current) {
        gainRef.current.dispose();
      }
    } catch {}

    // Dispose of reverb node
    try {
      if (reverbRef.current) {
        reverbRef.current.dispose();
      }
    } catch {}

    // Stop and dispose of recorder if active
    try {
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop();
        if (mediaRecorderRef.current.dispose) {
          mediaRecorderRef.current.dispose();
        }
      }
    } catch {}

    // Clear all refs
    playerRef.current = null;
    gainRef.current = null;
    reverbRef.current = null;
    mediaRecorderRef.current = null;

    // Cancel any pending animation frames
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  };

  // Optimized control change handlers with debouncing
  const updateGain = useCallback((newVolume: number) => {
    if (gainRef.current) {
      try {
        gainRef.current.gain.value = newVolume;
      } catch {}
    }
  }, []);

  const updateReverbWet = useCallback((newWet: number) => {
    if (reverbRef.current) {
      try {
        reverbRef.current.wet.value = newWet;
      } catch {}
    }
  }, []);

  const updateReverbDecay = useCallback((newDecay: number) => {
    if (reverbRef.current) {
      try {
        reverbRef.current.decay = newDecay;
      } catch {}
    }
  }, []);

  // React to control changes with optimized handlers
  useEffect(() => {
    updateGain(volume);
  }, [volume, updateGain]);

  useEffect(() => {
    updateReverbWet(reverbWet);
  }, [reverbWet, updateReverbWet]);

  useEffect(() => {
    updateReverbDecay(reverbDecay);
  }, [reverbDecay, updateReverbDecay]);

  useEffect(() => {
    if (playerRef.current) {
      try {
        // Compute current buffer position before change
        const now = performance.now();
        const elapsed = Math.max(0, (now - startWallTimeRef.current) / 1000);
        const currentBufferPos = Math.min(
          startBufferOffsetRef.current +
            elapsed * (playerRef.current.playbackRate || 1),
          originalDurationRef.current || Infinity
        );
        // Update playback rate live without restart
        playerRef.current.playbackRate = speed;
        if (isPlaying) {
          // Reset references so UI time stays continuous after speed change
          startBufferOffsetRef.current = currentBufferPos;
          startWallTimeRef.current = now;
        }
      } catch {}
    }
  }, [speed, isPlaying]);

  // Play/pause/stop
  const onTogglePlay = async () => {
    if (!isReady || !playerRef.current || !isBufferLoaded) return;
    try {
      await startAudio();
    } catch {}
    if (isPlaying) {
      isPlayingRef.current = false;
      try {
        playerRef.current.stop();
      } catch {}
      setIsPlaying(false);
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    } else {
      // Stop other players before starting this one
      stopOtherPlayers("audioEffects");
      try {
        // Map UI time (seconds) to buffer time (seconds)
        playerRef.current.start(undefined, currentTime);
      } catch {}
      setIsPlaying(true);
      isPlayingRef.current = true;
      startBufferOffsetRef.current = currentTime;
      startWallTimeRef.current = performance.now();
      tick();
    }
  };

  const onStop = useCallback(() => {
    try {
      playerRef.current?.stop?.();
    } catch {}
    setIsPlaying(false);
    isPlayingRef.current = false;
    setCurrentTime(0);
    setIsLooping(false);
    isLoopingRef.current = false; // Sync ref when stopping
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  // Memoize the tick function to prevent recreation on every render
  const tick = useCallback(() => {
    const now = performance.now();

    // Throttle updates to 30fps for better performance
    if (now - lastUpdateTimeRef.current < UPDATE_INTERVAL) {
      if (isPlayingRef.current) {
        rafRef.current = requestAnimationFrame(tick);
      }
      return;
    }

    lastUpdateTimeRef.current = now;
    const elapsed = Math.max(0, (now - startWallTimeRef.current) / 1000);
    const rate = playerRef.current?.playbackRate || speed || 1;
    const bufferPos = startBufferOffsetRef.current + elapsed * rate;
    const dur = totalDuration || originalDurationRef.current || 0;
    const clamped = Math.min(bufferPos, dur);

    // Only update state if value actually changed to prevent unnecessary re-renders
    if (Math.abs(clamped - currentTime) > 0.01) {
      setCurrentTime(clamped);
    }

    if (clamped >= dur && dur > 0) {
      // reached end - check current loop state using ref for performance
      if (isLoopingRef.current) {
        // Loop: restart from beginning
        try {
          playerRef.current?.stop();
          playerRef.current?.start(undefined, 0);
        } catch {}
        setCurrentTime(0);
        startBufferOffsetRef.current = 0;
        startWallTimeRef.current = performance.now();
      } else {
        // No loop: stop playback
        onStop();
        return;
      }
    }

    if (isPlayingRef.current) {
      rafRef.current = requestAnimationFrame(tick);
    }
  }, [speed, totalDuration, onStop, currentTime]);

  // Handle loop toggle during playback
  const handleLoopToggle = () => {
    setIsLooping(!isLooping);
  };

  // Recording functions
  const startRecording = async () => {
    if (!isReady || !playerRef.current || !isBufferLoaded) return;

    try {
      const Tone = toneRef.current;
      if (!Tone || !context) return;

      // Create a Recorder node with the same context as other nodes
      const recorder = new Tone.Recorder({ context: context });

      // Connect recorder as a tap from the reverb node (no need to rebuild graph)
      if (reverbRef.current) {
        reverbRef.current.connect(recorder);
      }

      // Clear previous recording
      setRecordedAudio(null);

      // Start recording
      recorder.start();
      setIsRecording(true);

      // Store the Tone.Recorder reference
      mediaRecorderRef.current = recorder;

      // Start playing if not already playing
      if (!isPlaying) {
        onTogglePlay();
      }
    } catch (error) {
      console.error("Error starting recording:", error);
    }
  };

  const stopRecording = async () => {
    if (mediaRecorderRef.current && isRecording) {
      try {
        // Stop recording and get the audio data
        const recording = await mediaRecorderRef.current.stop();
        setRecordedAudio(recording);
        setIsRecording(false);

        // Disconnect the recorder from the reverb node
        if (reverbRef.current && mediaRecorderRef.current) {
          try {
            reverbRef.current.disconnect(mediaRecorderRef.current);
          } catch {}
        }
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
        // This is more efficient and avoids potential context limit issues
        const audioContext = context?.rawContext || new AudioContext();
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
        a.download = `mixed-audio-${Date.now()}.wav`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        // Only close if we created a new context (not reusing existing one)
        if (!context?.rawContext) {
          await (audioContext as any).close();
        }
      } catch (error) {
        console.error("Error converting to WAV:", error);
        // Fallback to original format if WAV conversion fails
        const url = URL.createObjectURL(recordedAudio);
        const a = document.createElement("a");
        a.href = url;
        a.download = `mixed-audio-${Date.now()}.webm`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    }
  };

  // Seek handler
  const onSeek = (value: number[]) => {
    const newTime = value[0];
    setCurrentTime(newTime);
    if (!playerRef.current) return;
    if (isPlaying) {
      try {
        playerRef.current.stop();
        playerRef.current.start(undefined, newTime);
      } catch {}
      startBufferOffsetRef.current = newTime;
      startWallTimeRef.current = performance.now();
    }
  };

  // Cleanup
  useEffect(() => {
    return () => {
      // Stop playback and clean up all nodes
      onStop();
      cleanupNodes();

      // Clean up blob URLs
      if (sourceUrlRef.current && sourceUrlRef.current.startsWith("blob:")) {
        try {
          URL.revokeObjectURL(sourceUrlRef.current);
        } catch {}
      }

      // Reset all refs to ensure no memory leaks
      sourceUrlRef.current = null;
    };
  }, []);

  const disabled = !sourceUrlRef.current || !isReady || !isBufferLoaded;

  return (
    <div className="w-full border border-black dark:border-white p-4 space-y-4">
      <div>
        <h2 className="text-2xl font-semibold">Audio Effects</h2>
        <p className="text-sm text-muted-foreground">
          Apply effects to your audio, speed, reverb, and more.
        </p>
      </div>
      <div className="space-y-4">
        {loadError ? (
          <div className="flex items-center justify-between gap-3 border border-destructive/30 bg-destructive/10 px-3 py-2 text-destructive">
            <div className="flex items-center gap-2 text-sm">
              <AlertCircle className="h-4 w-4" />
              <span>{loadError}</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setLoadError(null);
                void setupGraph();
              }}
              className="h-7"
            >
              Retry
            </Button>
          </div>
        ) : sourceUrlRef.current && (!isReady || !isBufferLoaded) ? (
          <div className="flex w-full items-center justify-center py-6">
            <div className="w-24 h-24">
              <RunnerLoader />
            </div>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-4 md:flex-row md:gap-2 items-center justify-between">
              <div className="flex items-center gap-2 border border-black dark:border-white px-3 h-8 w-full md:w-auto md:flex-1">
                <span className="text-xs font-mono whitespace-nowrap">
                  {formattedCurrentTime}
                </span>
                <Slider
                  value={[currentTime]}
                  min={0}
                  max={totalDuration || 0}
                  step={0.01}
                  className="flex-grow"
                  onValueChange={onSeek}
                  disabled={disabled}
                />
                <span className="text-xs font-mono w-8 text-right">
                  {formattedTotalDuration}
                </span>
              </div>
              <TooltipProvider>
                <div className="flex items-center justify-between w-full md:w-auto gap-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        onClick={onTogglePlay}
                        disabled={disabled}
                        className={cn(
                          "h-8 w-8 p-0 border border-black dark:border-white",
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
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{isPlaying ? "Pause" : "Play"}</p>
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        onClick={onStop}
                        disabled={disabled}
                        className={cn(
                          "h-8 w-8 p-0 border border-black dark:border-white",
                          "bg-white text-black hover:bg-black hover:text-white dark:bg-black dark:text-white dark:hover:bg-white dark:hover:text-black"
                        )}
                      >
                        <Square className="h-3 w-3" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Stop</p>
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        onClick={handleLoopToggle}
                        disabled={disabled}
                        className={cn(
                          "h-8 w-8 p-0 border border-black dark:border-white",
                          isLooping
                            ? "bg-black text-white hover:bg-black/90 dark:bg-white dark:text-black dark:hover:bg-white/90"
                            : "bg-white text-black  hover:bg-black hover:text-white dark:bg-black dark:text-white dark:hover:bg-white dark:hover:text-black"
                        )}
                      >
                        <Repeat className="h-3 w-3" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{isLooping ? "Disable Loop" : "Enable Loop"}</p>
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        onClick={isRecording ? stopRecording : startRecording}
                        variant="outline"
                        size="icon"
                        disabled={disabled}
                        className={cn(
                          "h-8 w-8 p-0 border border-black dark:border-white",
                          "bg-white text-black hover:bg-black hover:text-white dark:bg-black dark:text-white dark:hover:bg-white dark:hover:text-black"
                        )}
                      >
                        <div
                          className={`w-2.5 h-2.5 rounded-full bg-red-500 ${
                            isRecording ? "animate-pulse" : ""
                          }`}
                        />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>
                        {isRecording ? "Stop Recording" : "Start Recording"}
                      </p>
                    </TooltipContent>
                  </Tooltip>

                  {recordedAudio && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          onClick={downloadRecordedAudio}
                          className={cn(
                            "h-8 w-8 p-0 border border-black dark:border-white",
                            "bg-white text-black hover:bg-black hover:text-white dark:bg-black dark:text-white dark:hover:bg-white dark:hover:text-black"
                          )}
                        >
                          <Download className="h-3 w-3" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Download Recording</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>
              </TooltipProvider>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  Volume: {volumePercentage}%
                </Label>
                <Slider
                  value={[volume]}
                  min={0}
                  max={1}
                  step={0.01}
                  onValueChange={(v) => setVolume(v[0])}
                  disabled={disabled}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  Speed: {speedFormatted}x
                </Label>
                <Slider
                  value={[speed]}
                  min={0.5}
                  max={2}
                  step={0.01}
                  onValueChange={(v) => setSpeed(v[0])}
                  disabled={disabled}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Reverb Mix: {reverbWetPercentage}%
                </Label>
                <Slider
                  value={[reverbWet]}
                  min={0}
                  max={1}
                  step={0.01}
                  onValueChange={(v) => setReverbWet(v[0])}
                  disabled={disabled}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Reverb Decay: {reverbDecayFormatted}s
                </Label>
                <Slider
                  value={[reverbDecay]}
                  min={0.1}
                  max={10}
                  step={0.1}
                  onValueChange={(v) => setReverbDecay(v[0])}
                  disabled={disabled}
                />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
