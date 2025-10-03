/* eslint-disable */
"use client";

import { useState, useRef, useEffect, useMemo, useCallback, memo } from "react";
import { Music, Mic, Drum, AudioLines } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { encode } from "wav-encoder";
import RunnerLoader from "@/components/loaders/runner-loader";
import StemControl, { StemSource } from "./StemControl";
import RecordingControls from "./RecordingControls";

// 1. MEMOIZE STATIC OBJECTS - Move outside component to prevent recreation
const STEM_META: Record<string, { name: string; icon: React.ReactNode }> = {
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

interface StemPlayerProps {
  audioUrls?: Record<string, string>;
}

const StemPlayer = memo(function StemPlayer({
  audioUrls = {},
}: StemPlayerProps) {
  // 2. OPTIMIZE STATE MANAGEMENT - Combine related state to reduce re-renders
  const [playerState, setPlayerState] = useState({
    isLoading: true,
    error: null as string | null,
    isRecording: false,
    recordedAudio: null as Blob | null,
    playingStems: new Set<string>(),
    pausedStems: new Set<string>(),
    volumes: {} as Record<string, number>,
    currentTime: 0,
    duration: 0,
  });

  const stems: Record<string, StemSource> = useMemo(
    () =>
      Object.entries(audioUrls).reduce((acc, [key, audioUrl]) => {
        if (STEM_META[key]) {
          acc[key] = {
            name: STEM_META[key].name,
            icon: STEM_META[key].icon,
            audioUrl: audioUrl,
          };
        }
        return acc;
      }, {} as Record<string, StemSource>),
    [audioUrls]
  );

  // Memoize expensive computations
  const stemEntries = useMemo(() => Object.entries(stems), [stems]);
  const hasStems = useMemo(() => Object.keys(stems).length > 0, [stems]);
  const hasRecordedAudio = useMemo(
    () => !!playerState.recordedAudio,
    [playerState.recordedAudio]
  );

  const seekTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Web Audio API refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioBuffersRef = useRef<Record<string, AudioBuffer>>({});
  const sourceNodesRef = useRef<Record<string, AudioBufferSourceNode>>({});
  const gainNodesRef = useRef<Record<string, GainNode>>({});
  const masterGainRef = useRef<GainNode | null>(null);
  const transportStartTimeRef = useRef<number>(0);
  const transportPauseTimeRef = useRef<number>(0);
  const transportDurationRef = useRef<number>(0);
  const animationFrameRef = useRef<number | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const isTransportRunningRef = useRef<boolean>(false);

  // Initialize Web Audio API and load audio stems
  useEffect(() => {
    let cancelled = false;
    setPlayerState((prev) => ({ ...prev, isLoading: true, error: null }));

    const loadEverything = async () => {
      try {
        // Step 1: Initialize AudioContext
        if (!audioContextRef.current) {
          audioContextRef.current = new (window.AudioContext ||
            (window as any).webkitAudioContext)();
        }

        const audioContext = audioContextRef.current;

        // Step 2: Check if we have stems to load
        const entries = Object.entries(stems);
        if (entries.length === 0) {
          setPlayerState((prev) => ({ ...prev, isLoading: false }));
          return;
        }

        // Step 3: Create master gain node for recording
        if (!masterGainRef.current) {
          masterGainRef.current = audioContext.createGain();
          masterGainRef.current.connect(audioContext.destination);
        }

        // Step 4: Load all audio stems
        let loadedCount = 0;
        const totalStems = entries.length;

        const loadStem = async (key: string, src: StemSource) => {
          if (audioBuffersRef.current[key] || cancelled) return;

          try {
            // Fetch and decode audio data
            const response = await fetch(src.audioUrl!);
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

            if (cancelled) return;

            // Store the audio buffer
            audioBuffersRef.current[key] = audioBuffer;

            // Create gain node for this stem
            const gainNode = audioContext.createGain();
            gainNode.gain.value = 0; // Start muted (like Tone.js)
            gainNode.connect(masterGainRef.current!);
            gainNodesRef.current[key] = gainNode;

            // Create persistent source node that loops (like Tone.js)
            const sourceNode = audioContext.createBufferSource();
            sourceNode.buffer = audioBuffer;
            sourceNode.loop = true; // Loop like Tone.js players
            sourceNode.connect(gainNode);

            // DON'T start immediately - wait for transport sync
            sourceNodesRef.current[key] = sourceNode;

            // Track the longest duration across stems
            const duration = audioBuffer.duration;
            if (duration > 0) {
              transportDurationRef.current = Math.max(
                transportDurationRef.current,
                duration
              );
              setPlayerState((prev) => ({
                ...prev,
                duration: transportDurationRef.current,
              }));
            }

            // Check if all stems are loaded
            loadedCount++;
            if (loadedCount >= totalStems && !cancelled) {
              setPlayerState((prev) => ({ ...prev, isLoading: false }));
            }
          } catch {
            if (cancelled) return;
            setPlayerState((prev) => ({
              ...prev,
              error: `Failed to load audio for ${src.name}`,
              isLoading: false,
            }));
          }
        };

        // Load all stems
        await Promise.all(entries.map(([key, src]) => loadStem(key, src)));
      } catch (err) {
        if (!cancelled) {
          setPlayerState((prev) => ({
            ...prev,
            error:
              err instanceof Error
                ? err.message
                : "Failed to load audio engine",
            isLoading: false,
          }));
        }
      }
    };

    loadEverything();

    return () => {
      cancelled = true;
    };
  }, [stems]);

  // 3. DEBOUNCE TIME UPDATES - Reduce animation frame frequency for better performance
  const updateTime = useCallback(() => {
    if (isTransportRunningRef.current && audioContextRef.current) {
      const currentTime = audioContextRef.current.currentTime;
      // FIXED: Proper time calculation
      // When transport is running: elapsed = (currentTime - startTime) + initialPauseTime
      const elapsed =
        currentTime -
        transportStartTimeRef.current +
        transportPauseTimeRef.current;

      // Only update if time changed significantly (reduce from 60fps to 30fps)
      if (Math.abs(elapsed - playerState.currentTime) > 0.033) {
        setPlayerState((prev) => ({
          ...prev,
          currentTime: Math.max(0, elapsed),
        }));
      }

      // Check if we've reached the end
      if (elapsed >= transportDurationRef.current) {
        // Stop transport and reset
        isTransportRunningRef.current = false;
        setPlayerState((prev) => ({
          ...prev,
          currentTime: 0,
          playingStems: new Set(),
          pausedStems: new Set(),
        }));
        transportPauseTimeRef.current = 0;
        // Stop all source nodes
        Object.values(sourceNodesRef.current).forEach((sourceNode) => {
          try {
            sourceNode.stop();
            sourceNode.disconnect();
          } catch {
            // Source might already be stopped
          }
        });
        sourceNodesRef.current = {};
        // Mute all stems
        Object.values(gainNodesRef.current).forEach((gainNode) => {
          gainNode.gain.value = 0;
        });
        return;
      }

      animationFrameRef.current = requestAnimationFrame(updateTime);
    }
  }, [playerState.currentTime]);

  // Start time update loop
  useEffect(() => {
    if (isTransportRunningRef.current) {
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
  }, [
    isTransportRunningRef.current,
    playerState.playingStems.size,
    updateTime,
  ]);

  // FIXED: Proper source node cleanup
  const cleanupSourceNodes = () => {
    Object.values(sourceNodesRef.current).forEach((sourceNode) => {
      try {
        sourceNode.stop();
        sourceNode.disconnect();
      } catch {
        // Source might already be stopped
      }
    });
    sourceNodesRef.current = {};
  };

  const stopAllSources = useCallback(() => {
    // Stop all source nodes first
    cleanupSourceNodes();

    // Mute all stems (like Tone.js)
    Object.values(gainNodesRef.current).forEach((gainNode) => {
      gainNode.gain.value = 0;
    });

    // Stop transport
    isTransportRunningRef.current = false;
    transportPauseTimeRef.current = 0;
    transportStartTimeRef.current = 0;

    // FIXED: Reset React state to prevent inconsistencies
    setPlayerState((prev) => ({
      ...prev,
      playingStems: new Set(),
      pausedStems: new Set(),
      currentTime: 0,
    }));
  }, []);

  const startTransport = () => {
    if (!audioContextRef.current) return;

    // FIXED: Clean up existing source nodes first
    cleanupSourceNodes();

    const currentTime = audioContextRef.current.currentTime;
    transportStartTimeRef.current = currentTime;
    isTransportRunningRef.current = true;

    // Create and start all source nodes simultaneously (like Tone.js transport)
    Object.entries(audioBuffersRef.current).forEach(([key, audioBuffer]) => {
      const gainNode = gainNodesRef.current[key];
      if (audioBuffer && gainNode) {
        // Create new source node
        const sourceNode = audioContextRef.current!.createBufferSource();
        sourceNode.buffer = audioBuffer;
        sourceNode.loop = true;
        sourceNode.connect(gainNode);

        // Start with offset based on current transport time
        const offset = Math.max(0, transportPauseTimeRef.current);
        sourceNode.start(currentTime, offset);
        sourceNodesRef.current[key] = sourceNode;
      }
    });
  };

  const pauseTransport = () => {
    if (!audioContextRef.current) return;

    const currentTime = audioContextRef.current.currentTime;
    // FIXED: Proper pause time accumulation
    transportPauseTimeRef.current +=
      currentTime - transportStartTimeRef.current;
    isTransportRunningRef.current = false;

    // FIXED: Use cleanup function
    cleanupSourceNodes();
  };

  // Recording functions using Web Audio API
  const startRecording = useCallback(async () => {
    if (!audioContextRef.current || !masterGainRef.current) return;

    // Only allow recording if there are stems loaded
    if (Object.keys(audioBuffersRef.current).length === 0) {
      console.warn("No stems loaded for recording");
      return;
    }

    try {
      // Create a MediaStreamDestination to capture the mixed audio
      const destination =
        audioContextRef.current.createMediaStreamDestination();

      // FIXED: Disconnect previous recording connection if any
      if (masterGainRef.current.numberOfOutputs > 1) {
        masterGainRef.current.disconnect();
        masterGainRef.current.connect(audioContextRef.current.destination);
      }

      masterGainRef.current.connect(destination);

      // Create MediaRecorder
      const mediaRecorder = new MediaRecorder(destination.stream);
      recordedChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, {
          type: "audio/webm",
        });
        setPlayerState((prev) => ({
          ...prev,
          recordedAudio: blob,
          isRecording: false,
        }));
      };

      // Clear previous recording
      setPlayerState((prev) => ({ ...prev, recordedAudio: null }));

      // Start recording
      mediaRecorder.start();
      setPlayerState((prev) => ({ ...prev, isRecording: true }));
      mediaRecorderRef.current = mediaRecorder;
    } catch (error) {
      console.error("Error starting recording:", error);
    }
  }, []);

  const stopRecording = useCallback(async () => {
    if (mediaRecorderRef.current && playerState.isRecording) {
      try {
        // Stop recording
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current = null;
      } catch (error) {
        console.error("Error stopping recording:", error);
        setPlayerState((prev) => ({ ...prev, isRecording: false }));
      }
    }
  }, [playerState.isRecording]);

  const downloadRecordedAudio = useCallback(async () => {
    if (playerState.recordedAudio) {
      try {
        // Convert the recorded audio to WAV format
        const arrayBuffer = await playerState.recordedAudio.arrayBuffer();

        // Use existing AudioContext
        const audioContext = audioContextRef.current || new AudioContext();
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
      } catch (error) {
        console.error("Error converting to WAV:", error);
        // Fallback to original format if WAV conversion fails
        const url = URL.createObjectURL(playerState.recordedAudio);
        const a = document.createElement("a");
        a.href = url;
        a.download = `stem-mix-${Date.now()}.webm`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    }
  }, [playerState.recordedAudio]);

  const togglePlayback = useCallback(
    async (audioId: string) => {
      if (!audioContextRef.current || !gainNodesRef.current[audioId]) return;

      // Resume audio context if suspended
      if (audioContextRef.current.state === "suspended") {
        await audioContextRef.current.resume();
      }

      const gainNode = gainNodesRef.current[audioId];

      if (playerState.playingStems.has(audioId)) {
        // Mute this stem (like Tone.js)
        gainNode.gain.value = 0;

        setPlayerState((prev) => ({
          ...prev,
          playingStems: new Set(
            [...prev.playingStems].filter((id) => id !== audioId)
          ),
          pausedStems: new Set([...prev.pausedStems, audioId]),
        }));

        // If no stems left playing, pause transport
        // FIXED: Use the updated state directly
        if (playerState.playingStems.size - 1 <= 0) {
          pauseTransport();
        }
      } else {
        // Unmute this stem (like Tone.js)
        gainNode.gain.value = playerState.volumes[audioId] ?? 1;

        if (playerState.playingStems.size === 0) {
          // If we're at or beyond the end, reset to start
          const end = transportDurationRef.current || playerState.duration || 0;
          if (end && playerState.currentTime >= end - 0.01) {
            setPlayerState((prev) => ({ ...prev, currentTime: 0 }));
            transportPauseTimeRef.current = 0;
          }
          startTransport();
          // Force restart of time update loop
          updateTime();
        }

        setPlayerState((prev) => ({
          ...prev,
          playingStems: new Set([...prev.playingStems, audioId]),
          pausedStems: new Set(
            [...prev.pausedStems].filter((id) => id !== audioId)
          ),
        }));
      }
    },
    [
      playerState.playingStems,
      playerState.pausedStems,
      playerState.volumes,
      playerState.currentTime,
      playerState.duration,
    ]
  );

  // Debounced seeking function using Web Audio API
  const handleStemSeekDebounced = useCallback((value: number[]) => {
    const newTime = value[0];
    setPlayerState((prev) => ({ ...prev, currentTime: newTime }));

    // Clear any existing timeout
    if (seekTimeoutRef.current) {
      clearTimeout(seekTimeoutRef.current);
    }

    // Set a timeout to actually seek after user stops dragging
    seekTimeoutRef.current = setTimeout(() => {
      handleStemSeekActual(newTime);
    }, 150); // 150ms delay after user stops dragging
  }, []);

  // FIXED: Proper seeking function
  const handleStemSeekActual = useCallback(async (newTime: number) => {
    if (!audioContextRef.current) return;

    // Update transport state (like Tone.js transport.seconds)
    transportPauseTimeRef.current = newTime;

    // If transport is running, restart all source nodes at the new time
    if (isTransportRunningRef.current) {
      const currentTime = audioContextRef.current.currentTime;
      transportStartTimeRef.current = currentTime;

      // FIXED: Use cleanup function
      cleanupSourceNodes();

      // Restart all source nodes at the new time with proper offset
      Object.entries(audioBuffersRef.current).forEach(([key, audioBuffer]) => {
        const gainNode = gainNodesRef.current[key];
        if (audioBuffer && gainNode) {
          const sourceNode = audioContextRef.current!.createBufferSource();
          sourceNode.buffer = audioBuffer;
          sourceNode.loop = true;
          sourceNode.connect(gainNode);

          // Start with offset based on seek position
          const offset = Math.max(0, newTime);
          sourceNode.start(currentTime, offset);
          sourceNodesRef.current[key] = sourceNode;
        }
      });
    }
  }, []);

  const handleVolumeChange = useCallback(
    (audioId: string, value: number) => {
      const gainNode = gainNodesRef.current[audioId];
      if (gainNode) {
        // FIXED: Always update the gain node, but only apply if playing
        gainNode.gain.value = playerState.playingStems.has(audioId) ? value : 0;
      }
      setPlayerState((prev) => ({
        ...prev,
        volumes: {
          ...prev.volumes,
          [audioId]: value,
        },
      }));
    },
    [playerState.playingStems]
  );

  // 7. IMPROVE CLEANUP - Enhanced cleanup logic for better memory management
  useEffect(() => {
    return () => {
      // Stop all audio sources first
      stopAllSources();

      // Cancel all timeouts and animation frames
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      if (seekTimeoutRef.current) {
        clearTimeout(seekTimeoutRef.current);
        seekTimeoutRef.current = null;
      }

      // Clean up all audio nodes
      Object.values(sourceNodesRef.current).forEach((sourceNode) => {
        try {
          sourceNode.stop();
          sourceNode.disconnect();
        } catch {
          // Source might already be stopped
        }
      });
      sourceNodesRef.current = {};

      Object.values(gainNodesRef.current).forEach((gainNode) => {
        try {
          gainNode.disconnect();
        } catch {
          // Node might already be disconnected
        }
      });
      gainNodesRef.current = {};

      // Clear audio buffers
      audioBuffersRef.current = {};

      // Stop and cleanup media recorder
      if (mediaRecorderRef.current) {
        try {
          if (mediaRecorderRef.current.state === "recording") {
            mediaRecorderRef.current.stop();
          }
        } catch {
          // Recorder might already be stopped
        }
        mediaRecorderRef.current = null;
      }

      // Clear recorded chunks
      recordedChunksRef.current = [];

      // Close audio context
      if (
        audioContextRef.current &&
        audioContextRef.current.state !== "closed"
      ) {
        try {
          audioContextRef.current.close();
        } catch {
          // Context might already be closed
        }
        audioContextRef.current = null;
      }

      // Reset all refs
      masterGainRef.current = null;
      transportStartTimeRef.current = 0;
      transportPauseTimeRef.current = 0;
      transportDurationRef.current = 0;
      isTransportRunningRef.current = false;
    };
  }, [stopAllSources]);

  return (
    <div className="w-full border border-black dark:border-white p-4 space-y-4">
      <div>
        <h2 className="text-2xl font-semibold">Audio Separator</h2>
        <p className="text-sm text-muted-foreground">
          Play, mix, and dj individual audio tracks
        </p>
      </div>

      {!hasStems ? (
        <div className="flex flex-col items-center justify-center py-12 space-y-4 text-center">
          <Music className="h-12 w-12" />
          <p>No Audio Stems Available, Please Process the Audio First</p>
        </div>
      ) : playerState.isLoading ? (
        <div className="flex justify-center items-center py-12">
          <div className="w-24 h-24">
            <RunnerLoader />
          </div>
        </div>
      ) : playerState.error ? (
        <Alert variant="destructive" className="animate-in fade-in-50">
          <AlertDescription>{playerState.error}</AlertDescription>
        </Alert>
      ) : (
        <>
          <div>
            {hasStems && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {stemEntries.map(([audioId, audioSource]) => (
                  <StemControl
                    key={audioId}
                    audioId={audioId}
                    audioSource={audioSource}
                    isPlaying={playerState.playingStems.has(audioId)}
                    isPaused={playerState.pausedStems.has(audioId)}
                    currentTime={playerState.currentTime}
                    duration={playerState.duration}
                    volume={playerState.volumes[audioId] ?? 1}
                    onToggle={togglePlayback}
                    onSeek={handleStemSeekDebounced}
                    onVolumeChange={handleVolumeChange}
                  />
                ))}
              </div>
            )}
          </div>
          {hasStems && (
            <div className="space-y-4">
              <RecordingControls
                isRecording={playerState.isRecording}
                hasRecordedAudio={hasRecordedAudio}
                onStartRecording={startRecording}
                onStopRecording={stopRecording}
                onDownload={downloadRecordedAudio}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
});

export default StemPlayer;
