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
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export function AudioProvider({ children }: { children: ReactNode }) {
  const [isReady, setIsReady] = useState(false);
  const contextRef = useRef<Tone.Context | null>(null);
  const transportRef = useRef<any | null>(null);
  const hasStartedRef = useRef(false);

  const startAudio = async () => {
    if (hasStartedRef.current) return;
    hasStartedRef.current = true;

    try {
      await Tone.start();
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

    return () => {
      cancelled = true;
      try {
        contextRef.current?.close?.();
      } catch {}
    };
  }, []);

  const value: AudioContextType = {
    isReady,
    context: contextRef.current,
    transport: transportRef.current,
    startAudio,
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
