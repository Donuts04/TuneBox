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

  const audioRefs = useRef<(HTMLAudioElement | null)[]>([]);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [loadingSamples, setLoadingSamples] = useState<Set<number>>(new Set());

  // Register this player with the global audio management system
  useEffect(() => {
    const stopCallback = () => {
      audioRefs.current.forEach((audio) => {
        if (audio) {
          audio.pause();
        }
      });
      setActiveIndex(null);
    };

    registerPlayer("loopSamples", stopCallback);

    return () => {
      unregisterPlayer("loopSamples");
    };
  }, [registerPlayer, unregisterPlayer]);

  // Initialize empty audio refs when items change
  useEffect(() => {
    // Cleanup previous audios
    audioRefs.current.forEach((a) => {
      if (a) {
        a.pause();
        a.src = "";
      }
    });

    // Initialize with null values - audio will be created on demand
    audioRefs.current = new Array(items.length).fill(null);
    setActiveIndex(null);
    setLoadingSamples(new Set());

    return () => {
      audioRefs.current.forEach((a) => {
        if (a) {
          a.pause();
          a.src = "";
        }
      });
    };
  }, [items]);

  const togglePlay = async (index: number) => {
    const item = items[index];
    if (!item.audioUrl) return;

    let current = audioRefs.current[index];

    // Create audio element if it doesn't exist
    if (!current) {
      try {
        setLoadingSamples((prev) => new Set(prev).add(index));

        current = new Audio(item.audioUrl);
        current.loop = true;

        // Add event listeners
        const handlePlay = () => setActiveIndex(index);
        const handlePause = () =>
          setActiveIndex((current) => (current === index ? null : current));
        const handleError = () => {
          setLoadingSamples((prev) => {
            const newSet = new Set(prev);
            newSet.delete(index);
            return newSet;
          });
          setActiveIndex((current) => (current === index ? null : current));
          toast.error("Failed to load audio");
        };
        const handleCanPlay = () => {
          setLoadingSamples((prev) => {
            const newSet = new Set(prev);
            newSet.delete(index);
            return newSet;
          });
        };

        current.addEventListener("play", handlePlay);
        current.addEventListener("pause", handlePause);
        current.addEventListener("error", handleError);
        current.addEventListener("canplay", handleCanPlay);

        audioRefs.current[index] = current;
      } catch (error) {
        console.error("Error creating audio:", error);
        setLoadingSamples((prev) => {
          const newSet = new Set(prev);
          newSet.delete(index);
          return newSet;
        });
        toast.error("Failed to load audio");
        return;
      }
    }

    try {
      if (!current.paused) {
        current.pause();
      } else {
        // Stop other players before starting this one
        stopOtherPlayers("loopSamples");

        // Start audio context if needed
        await startAudio();

        // Pause all others first
        if (activeIndex !== null && activeIndex !== index) {
          const active = audioRefs.current[activeIndex];
          if (active) active.pause();
        }
        await current.play();
      }
    } catch (error) {
      console.error("Error toggling audio:", error);
      toast.error("Failed to play audio");
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
              ) : activeIndex === index ? (
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
