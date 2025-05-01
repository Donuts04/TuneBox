"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

interface AudioProcessingData {
  processedAudio: Record<string, boolean>;
  processedMusicData: Record<string, any>;
  currentlyProcessingAudio: string | null;
  viewingProcessedAudio: string | null;
}

interface AudioProcessingContextType extends AudioProcessingData {
  markAudioAsProcessed: (audioId: string, musicData: any) => void;
  setProcessingAudio: (audioId: string | null) => void;
  getAudioMusicData: (audioId: string) => any | null;
  setViewingProcessedAudio: (audioId: string | null) => void;
}

const AudioProcessingContext = createContext<
  AudioProcessingContextType | undefined
>(undefined);

export function AudioProcessingProvider({ children }: { children: ReactNode }) {
  const [processedAudio, setProcessedAudio] = useState<Record<string, boolean>>(
    {}
  );
  const [processedMusicData, setProcessedMusicData] = useState<
    Record<string, any>
  >({});
  const [currentlyProcessingAudio, setCurrentlyProcessingAudio] = useState<
    string | null
  >(null);
  const [viewingProcessedAudio, setViewingProcessedAudio] = useState<
    string | null
  >(null);

  const markAudioAsProcessed = (audioId: string, musicData: any) => {
    setProcessedAudio((prev) => ({
      ...prev,
      [audioId]: true,
    }));
    setProcessedMusicData((prev) => ({
      ...prev,
      [audioId]: musicData,
    }));
    setCurrentlyProcessingAudio(null);
    // Automatically set to view the newly processed audio
    setViewingProcessedAudio(audioId);
  };

  const setProcessingAudio = (audioId: string | null) => {
    setCurrentlyProcessingAudio(audioId);
    if (audioId) {
      // When starting to process, also set it as the viewing audio
      setViewingProcessedAudio(audioId);
    }
  };

  const getAudioMusicData = (audioId: string) => {
    return processedMusicData[audioId] || null;
  };

  const contextValue: AudioProcessingContextType = {
    processedAudio,
    processedMusicData,
    currentlyProcessingAudio,
    viewingProcessedAudio,
    markAudioAsProcessed,
    setProcessingAudio,
    getAudioMusicData,
    setViewingProcessedAudio,
  };

  return (
    <AudioProcessingContext.Provider value={contextValue}>
      {children}
    </AudioProcessingContext.Provider>
  );
}

export function useAudioProcessing() {
  const context = useContext(AudioProcessingContext);
  if (context === undefined) {
    throw new Error(
      "useAudioProcessing must be used within an AudioProcessingProvider"
    );
  }
  return context;
}
