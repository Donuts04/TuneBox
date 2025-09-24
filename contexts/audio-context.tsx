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

    try {
      // Resume the underlying AudioContext first (Safari/iOS needs this)
      const ac: AudioContext | undefined = (contextRef.current as any)
        ?.rawContext;
      if (ac && ac.state !== "running") {
        await ac.resume();
      }

      // Start Tone.js audio (required by many browsers)
      await Tone.start();

      // Play a 1-frame silent buffer to fully unlock on some platforms
      if (ac) {
        const buffer = ac.createBuffer(1, 1, ac.sampleRate);
        const src = ac.createBufferSource();
        src.buffer = buffer;
        src.connect(ac.destination);
        try {
          src.start(0);
        } finally {
          src.disconnect();
        }
      }

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

    // Add global event listeners to unlock audio on first user interaction
    const unlockAudio = async () => {
      if (hasStartedRef.current) return;

      try {
        await startAudio();
      } catch (error) {
        console.warn("Failed to unlock audio context:", error);
      } finally {
        // Remove listeners after first attempt (listeners were once: true as well)
        document.removeEventListener("click", unlockAudio);
        document.removeEventListener("touchstart", unlockAudio);
        document.removeEventListener("keydown", unlockAudio);
        document.removeEventListener("pointerdown", unlockAudio);
        document.removeEventListener("mousedown", unlockAudio);
      }
    };

    // Add event listeners for first user interaction
    document.addEventListener("click", unlockAudio, { once: true });
    document.addEventListener("touchstart", unlockAudio, { once: true });
    document.addEventListener("keydown", unlockAudio, { once: true });
    document.addEventListener("pointerdown", unlockAudio, { once: true });
    document.addEventListener("mousedown", unlockAudio, { once: true });

    return () => {
      cancelled = true;
      try {
        contextRef.current?.close?.();
      } catch {}
      // Clean up event listeners
      document.removeEventListener("click", unlockAudio);
      document.removeEventListener("touchstart", unlockAudio);
      document.removeEventListener("keydown", unlockAudio);
      document.removeEventListener("pointerdown", unlockAudio);
      document.removeEventListener("mousedown", unlockAudio);
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
