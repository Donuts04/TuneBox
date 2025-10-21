"use client";

import React, { useEffect, useRef, useState } from "react";
import { Play, Pause, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAudio } from "@/contexts/audio-context";
import { toast } from "sonner";

interface LoopItem {
  text: string;
  audioUrl: string;
}

interface LoopSamplesProps {
  items: LoopItem[];
}

export default function LoopSamples({ items }: LoopSamplesProps) {
  // Get audio context for global audio management
  const { registerPlayer, unregisterPlayer, stopOtherPlayers, startAudio } =
    useAudio();

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loadingSamples, setLoadingSamples] = useState<Set<number>>(new Set());

  // Register this player with the global audio management system
  useEffect(() => {
    const stopCallback = () => {
      if (audioRef.current) {
        audioRef.current.pause();
        setActiveIndex(null);
        setIsPlaying(false);
      }
    };

    registerPlayer("loopSamples", stopCallback);

    return () => {
      unregisterPlayer("loopSamples");
    };
  }, [registerPlayer, unregisterPlayer]);

  // Initialize audio element and handle cleanup
  useEffect(() => {
    audioRef.current = new Audio();
    audioRef.current.loop = true;

    // Add event listeners
    const audio = audioRef.current;
    audio.addEventListener("ended", () => {
      setActiveIndex(null);
      setIsPlaying(false);
    });

    audio.addEventListener("play", () => {
      setIsPlaying(true);
    });

    audio.addEventListener("pause", () => {
      setIsPlaying(false);
    });

    // Cleanup
    return () => {
      if (audio) {
        audio.pause();
        audio.removeEventListener("ended", () => {});
        audioRef.current = null;
      }
    };
  }, []);

  const togglePlay = async (index: number) => {
    const item = items[index];
    if (!item.audioUrl || !audioRef.current) return;

    const audio = audioRef.current;

    if (activeIndex === index) {
      // If the same song is clicked, toggle play/pause
      if (audio.paused) {
        try {
          await startAudio();
          await audio.play();
        } catch (err) {
          console.error("Error playing audio:", err);
          toast.error("Failed to play audio");
        }
      } else {
        audio.pause();
      }
    } else {
      // Stop other players before starting this one
      stopOtherPlayers("loopSamples");

      // Stop any currently playing audio
      audio.pause();

      // Update source and play new track
      audio.src = item.audioUrl;
      audio.load(); // Ensure the new source is loaded

      try {
        setLoadingSamples((prev) => new Set(prev).add(index));
        await startAudio();
        await audio.play();
        setActiveIndex(index);
      } catch (err) {
        console.error("Error playing audio:", err);
        toast.error("Failed to play audio");
      } finally {
        setLoadingSamples((prev) => {
          const newSet = new Set(prev);
          newSet.delete(index);
          return newSet;
        });
      }
    }
  };

  return (
    <div id="loops">
      <h2 className="text-3xl font-bold sm:text-4xl text-center mb-10">
        Some Good Loops
      </h2>
      <div className="flex flex-col gap-4">
        {items.map((item, index) => (
          <div
            key={`${item.text}-${index}`}
            className="flex items-center w-full"
          >
            <span className="text-lg font-medium text-black dark:text-white whitespace-nowrap">
              {item.text}
            </span>
            <div className="flex items-center flex-1 mx-4">
              <div className="flex-1 h-0.5 bg-black dark:bg-white"></div>
            </div>
            <Button
              size="sm"
              variant="outline"
              className={cn(
                "h-8 w-8 border border-black dark:border-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black",
                activeIndex === index &&
                  "bg-black text-white dark:bg-white dark:text-black"
              )}
              onClick={() => togglePlay(index)}
              disabled={loadingSamples.has(index) || !item.audioUrl}
            >
              {loadingSamples.has(index) ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : activeIndex === index && isPlaying ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
