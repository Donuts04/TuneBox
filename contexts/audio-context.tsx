"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import * as Tone from "tone";

interface AudioContextType {
  isReady: boolean;
  context: Tone.Context | null;
  transport: any | null;
  startAudio: () => Promise<void>;
  registerPlayer: (playerId: string, stopCallback: () => void) => void;
  unregisterPlayer: (playerId: string) => void;
  stopOtherPlayers: (currentPlayerId: string) => void;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export function AudioProvider({ children }: { children: ReactNode }) {
  const [isReady, setIsReady] = useState(false);
  const contextRef = useRef<Tone.Context | null>(null);
  const transportRef = useRef<any | null>(null);
  const hasStartedRef = useRef(false);
  const hasUnblockedRef = useRef(false);
  const playersRef = useRef<Map<string, () => void>>(new Map());

  const startAudio = async () => {
    if (hasStartedRef.current) return;

    try {
      // Resume the underlying AudioContext if suspended
      const ac = (contextRef.current as any)?.rawContext;
      if (ac && ac.state === "suspended") {
        await ac.resume();
      }

      // Start Tone.js audio
      await Tone.start();

      hasStartedRef.current = true;
    } catch (error) {
      console.warn("Failed to start audio context:", error);
    }
  };

  useEffect(() => {
    let cancelled = false;

    const initAudio = async () => {
      if (cancelled) return;

      try {
        // Create a single global context
        const ctx = new Tone.Context({ latencyHint: "interactive" });
        Tone.setContext(ctx);

        contextRef.current = ctx;
        transportRef.current = Tone.getTransport();
        setIsReady(true);
      } catch (error) {
        console.warn("Failed to initialize audio context:", error);
      }
    };

    initAudio();

    // Unblock iOS silent mode on first user interaction
    const unblockAudio = async () => {
      if (hasUnblockedRef.current) return;
      hasUnblockedRef.current = true;

      try {
        const audio = document.getElementById(
          "silent-audio"
        ) as HTMLAudioElement;
        if (audio) {
          audio.volume = 0;
          await audio.play();
        }
      } catch (error) {
        console.warn("Failed to unblock iOS audio:", error);
      }
    };

    // Add event listeners for first user interaction (optimized)
    const events = ["click", "touchstart", "keydown"];
    const addListeners = () => {
      events.forEach((event) => {
        document.addEventListener(event, unblockAudio, { once: true });
      });
    };

    addListeners();

    return () => {
      cancelled = true;
      try {
        contextRef.current?.close?.();
      } catch {}
      // Event listeners are automatically cleaned up with { once: true }
    };
  }, []);

  const registerPlayer = (playerId: string, stopCallback: () => void) => {
    playersRef.current.set(playerId, stopCallback);
  };

  const unregisterPlayer = (playerId: string) => {
    playersRef.current.delete(playerId);
  };

  const stopOtherPlayers = (currentPlayerId: string) => {
    playersRef.current.forEach((stopCallback, playerId) => {
      if (playerId !== currentPlayerId) {
        stopCallback();
      }
    });
  };

  const value: AudioContextType = {
    isReady,
    context: contextRef.current,
    transport: transportRef.current,
    startAudio,
    registerPlayer,
    unregisterPlayer,
    stopOtherPlayers,
  };

  return (
    <AudioContext.Provider value={value}>{children}</AudioContext.Provider>
  );
}

export function useAudio() {
  const context = useContext(AudioContext);
  if (context === undefined) {
    throw new Error("useAudio must be used within an AudioProvider");
  }
  return context;
}
