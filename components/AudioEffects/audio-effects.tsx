"use client";

import { useEffect, useRef, useState } from "react";
import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Play, Pause, Square, Repeat, Download } from "lucide-react";
import type { DeezerTrack } from "@/lib/deezer";
import { formatTime } from "@/lib/utils";

interface AudioEffectsProps {
  uploadedFile?: File | null;
  track?: DeezerTrack | null;
}

export default function AudioEffects({
  uploadedFile,
  track,
}: AudioEffectsProps) {
  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [speed, setSpeed] = useState(1);
  const [reverbWet, setReverbWet] = useState(0.2);
  const [reverbDecay, setReverbDecay] = useState(2.5);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);
  const [isBufferLoaded, setIsBufferLoaded] = useState(false);
  const [isLooping, setIsLooping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudio, setRecordedAudio] = useState<Blob | null>(null);

  // Keep refs in sync with state
  useEffect(() => {
    isLoopingRef.current = isLooping;
  }, [isLooping]);

  useEffect(() => {
    isRecordingRef.current = isRecording;
  }, [isRecording]);

  const toneRef = useRef<null | typeof import("tone")>(null);
  const ctxRef = useRef<any | null>(null);
  const playerRef = useRef<any | null>(null);
  const gainRef = useRef<any | null>(null);
  const reverbRef = useRef<any | null>(null);
  const rafRef = useRef<number | null>(null);
  const startWallTimeRef = useRef<number>(0);
  const startBufferOffsetRef = useRef<number>(0); // seconds in source buffer when play started
  const originalDurationRef = useRef<number>(0);
  const isPlayingRef = useRef<boolean>(false);
  const isLoopingRef = useRef<boolean>(false);
  const isRecordingRef = useRef<boolean>(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  const sourceUrlRef = useRef<string | null>(null);

  // Prepare Tone.js context
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const Tone = await import("tone");
      if (cancelled) return;
      toneRef.current = Tone;
      const ctx = new Tone.Context({ latencyHint: "interactive" });
      const prev = Tone.getContext();
      Tone.setContext(ctx);
      // bind transport (not strictly needed, but keeps consistency)
      Tone.getTransport();
      Tone.setContext(prev);
      ctxRef.current = ctx;
      setIsReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Resolve source URL whenever inputs change
  useEffect(() => {
    // Cleanup previous blob URL if any
    if (sourceUrlRef.current && sourceUrlRef.current.startsWith("blob:")) {
      try {
        URL.revokeObjectURL(sourceUrlRef.current);
      } catch {}
    }
    sourceUrlRef.current = null;

    if (track?.preview) {
      sourceUrlRef.current = track.preview;
    } else if (uploadedFile) {
      sourceUrlRef.current = URL.createObjectURL(uploadedFile);
    }

    // Recreate player graph for new source
    void setupGraph();

    // stop on inputs change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [track, uploadedFile]);

  // If Tone becomes ready after source is set, build the graph
  useEffect(() => {
    if (isReady && sourceUrlRef.current) {
      void setupGraph();
    }
  }, [isReady]);

  // Build audio graph: Player -> Gain -> Reverb -> Destination
  const setupGraph = async () => {
    const Tone = toneRef.current;
    const ctx = ctxRef.current;
    const url = sourceUrlRef.current;
    if (!Tone || !ctx || !url) {
      cleanupNodes();
      return;
    }

    cleanupNodes();

    const reverb = new Tone.Reverb({
      decay: reverbDecay,
      wet: reverbWet,
      context: ctx,
    });
    // Generate IR asynchronously; don't block playback
    try {
      (reverb as any).generate?.();
    } catch {}
    const gain = new Tone.Gain({ gain: volume, context: ctx });
    try {
      (reverb as any).connect((ctx as any).destination);
    } catch {}
    try {
      (gain as any).connect(reverb);
    } catch {}

    const player = new Tone.Player({
      url,
      autostart: false,
      context: ctx,
      onload: () => {
        const dur = player.buffer?.duration || 0;
        originalDurationRef.current = dur;
        setTotalDuration(dur);
        setCurrentTime(0);
        setIsBufferLoaded(true);
      },
    });
    try {
      (player as any).connect(gain);
    } catch {}
    (player as any).playbackRate = speed;

    playerRef.current = player;
    gainRef.current = gain;
    reverbRef.current = reverb;
  };

  const cleanupNodes = () => {
    try {
      playerRef.current?.stop?.();
      playerRef.current?.dispose?.();
    } catch {}
    try {
      gainRef.current?.dispose?.();
    } catch {}
    try {
      reverbRef.current?.dispose?.();
    } catch {}
    try {
      if (mediaRecorderRef.current && isRecordingRef.current) {
        mediaRecorderRef.current.stop();
        (mediaRecorderRef.current as any).dispose?.();
      }
    } catch {}
    playerRef.current = null;
    gainRef.current = null;
    reverbRef.current = null;
    mediaRecorderRef.current = null;
    recordedChunksRef.current = [];
  };

  // React to control changes
  useEffect(() => {
    if (gainRef.current) {
      try {
        gainRef.current.gain.value = volume;
      } catch {}
    }
  }, [volume]);

  useEffect(() => {
    if (reverbRef.current) {
      try {
        reverbRef.current.wet.value = reverbWet;
      } catch {}
    }
  }, [reverbWet]);

  useEffect(() => {
    if (reverbRef.current) {
      try {
        reverbRef.current.decay = reverbDecay;
      } catch {}
    }
  }, [reverbDecay]);

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
      const ctx = ctxRef.current as AudioContext | null;
      if (ctx && (ctx as any).state !== "running") {
        await (ctx as any).resume();
      }
      // Some environments still require a global start
      try {
        await (toneRef.current as any)?.start?.();
      } catch {}
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

  const onStop = () => {
    try {
      playerRef.current?.stop?.();
    } catch {}
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

  // Animation frame update for current time display
  const tick = () => {
    const now = performance.now();
    const elapsed = Math.max(0, (now - startWallTimeRef.current) / 1000);
    const rate = playerRef.current?.playbackRate || speed || 1;
    const bufferPos = startBufferOffsetRef.current + elapsed * rate;
    const dur = totalDuration || originalDurationRef.current || 0;
    const clamped = Math.min(bufferPos, dur);
    setCurrentTime(clamped);
    if (clamped >= dur && dur > 0) {
      // reached end - check current loop state
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
  };

  // Handle loop toggle during playback
  const handleLoopToggle = () => {
    setIsLooping(!isLooping);
  };

  // Recording functions
  const startRecording = async () => {
    if (!isReady || !playerRef.current || !isBufferLoaded) return;

    try {
      const Tone = toneRef.current;
      const ctx = ctxRef.current;
      if (!Tone || !ctx) return;

      // Create a Recorder node with the same context as other nodes
      const recorder = new Tone.Recorder({ context: ctx });

      // Connect the audio graph to the recorder
      if (playerRef.current) {
        (playerRef.current as any).connect(gainRef.current);
        (gainRef.current as any).connect(reverbRef.current);
        (reverbRef.current as any).connect(recorder);
      }

      // Clear previous recording
      setRecordedAudio(null);

      // Start recording
      recorder.start();
      setIsRecording(true);

      // Store the recorder reference
      mediaRecorderRef.current = recorder as any;

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
        const recording = await (mediaRecorderRef.current as any).stop();
        setRecordedAudio(recording);
        setIsRecording(false);
      } catch (error) {
        console.error("Error stopping recording:", error);
        setIsRecording(false);
      }
    }
  };

  const downloadRecordedAudio = () => {
    if (recordedAudio) {
      const url = URL.createObjectURL(recordedAudio);
      const a = document.createElement("a");
      a.href = url;
      a.download = `mixed-audio-${Date.now()}.webm`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
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
      onStop();
      cleanupNodes();
      try {
        ctxRef.current?.close?.();
      } catch {}
      if (sourceUrlRef.current && sourceUrlRef.current.startsWith("blob:")) {
        try {
          URL.revokeObjectURL(sourceUrlRef.current);
        } catch {}
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const disabled = !sourceUrlRef.current || !isReady || !isBufferLoaded;

  return (
    <Card className="w-full border border-black dark:border-white bg-transparent">
      {/* <AudioHeader uploadedFile={uploadedFile} track={track} /> */}
      <CardContent className="p-4 space-y-6">
        {/* Transport + Seek bar in one row */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2 border border-black dark:border-white rounded-full px-3 py-1.5 w-full md:w-auto md:flex-1">
            <span className="text-xs font-mono whitespace-nowrap">
              {formatTime(currentTime)}
            </span>
            <Slider
              value={[currentTime]}
              min={0}
              max={totalDuration || 0}
              step={0.01}
              className="flex-grow"
              onValueChange={onSeek}
            />
            <span className="text-xs font-mono w-8 text-right">
              {formatTime(totalDuration)}
            </span>
          </div>
          <TooltipProvider>
            <div className="flex items-center justify-between w-full md:w-auto gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={onTogglePlay}
                    variant="outline"
                    size="icon"
                    disabled={disabled}
                    className="h-8 w-8 rounded-full border border-black/20 dark:border-white/20"
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
                    variant="outline"
                    size="icon"
                    disabled={disabled}
                    className="h-8 w-8 rounded-full border border-black/20 dark:border-white/20"
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
                    variant="outline"
                    size="icon"
                    disabled={disabled}
                    className={`h-8 w-8 rounded-full border border-black/20 dark:border-white/20 ${
                      isLooping
                        ? "bg-black text-white dark:bg-white dark:text-black"
                        : ""
                    }`}
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
                    className={`h-8 w-8 rounded-full border border-black/20 dark:border-white/20`}
                  >
                    <div
                      className={`w-2.5 h-2.5 rounded-full bg-red-500 ${
                        isRecording ? "animate-pulse" : ""
                      }`}
                    />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{isRecording ? "Stop Recording" : "Start Recording"}</p>
                </TooltipContent>
              </Tooltip>

              {recordedAudio && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={downloadRecordedAudio}
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 rounded-full border border-black/20 dark:border-white/20"
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-2">
              Volume: {(volume * 100).toFixed(0)}%
            </Label>
            <Slider
              value={[volume]}
              min={0}
              max={1}
              step={0.01}
              onValueChange={(v) => setVolume(v[0])}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-2">
              Speed: {speed.toFixed(2)}x
            </Label>
            <Slider
              value={[speed]}
              min={0.5}
              max={2}
              step={0.01}
              onValueChange={(v) => setSpeed(v[0])}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Reverb Mix: {(reverbWet * 100).toFixed(0)}%
            </Label>
            <Slider
              value={[reverbWet]}
              min={0}
              max={1}
              step={0.01}
              onValueChange={(v) => setReverbWet(v[0])}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Reverb Decay: {reverbDecay.toFixed(1)}s
            </Label>
            <Slider
              value={[reverbDecay]}
              min={0.1}
              max={10}
              step={0.1}
              onValueChange={(v) => setReverbDecay(v[0])}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
