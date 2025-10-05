"use client";

import React, { useEffect, useRef, useState } from "react";
import { Play, Pause, Loader } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface LoopItem {
  text: string;
  audioUrl: string;
}

interface LoopSamplesProps {
  items: LoopItem[];
}

export default function LoopSamples({ items }: LoopSamplesProps) {
  const audioRefs = useRef<(HTMLAudioElement | null)[]>([]);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [loadingIndex, setLoadingIndex] = useState<number | null>(null);

  // Recreate audio elements when items change
  useEffect(() => {
    // Cleanup previous audios
    audioRefs.current.forEach((a) => {
      if (a) {
        a.pause();
        a.src = "";
      }
    });

    audioRefs.current = items.map((item) => {
      if (!item.audioUrl) return null;
      const audio = new Audio(item.audioUrl);
      audio.loop = true;
      return audio;
    });

    setActiveIndex(null);
    setLoadingIndex(null);

    // Attach event listeners
    const cleanups: (() => void)[] = [];
    audioRefs.current.forEach((audio, index) => {
      if (!audio) return;

      const handleLoadStart = () => setLoadingIndex(index);
      const handleCanPlay = () =>
        setLoadingIndex((current) => (current === index ? null : current));
      const handlePlay = () => setActiveIndex(index);
      const handlePause = () =>
        setActiveIndex((current) => (current === index ? null : current));
      const handleError = () => {
        setLoadingIndex((current) => (current === index ? null : current));
        setActiveIndex((current) => (current === index ? null : current));
        console.error("Error loading audio");
      };

      audio.addEventListener("loadstart", handleLoadStart);
      audio.addEventListener("canplay", handleCanPlay);
      audio.addEventListener("play", handlePlay);
      audio.addEventListener("pause", handlePause);
      audio.addEventListener("error", handleError);

      cleanups.push(() => {
        audio.removeEventListener("loadstart", handleLoadStart);
        audio.removeEventListener("canplay", handleCanPlay);
        audio.removeEventListener("play", handlePlay);
        audio.removeEventListener("pause", handlePause);
        audio.removeEventListener("error", handleError);
      });
    });

    return () => {
      cleanups.forEach((fn) => fn());
      audioRefs.current.forEach((a) => {
        if (a) {
          a.pause();
          a.src = "";
        }
      });
    };
  }, [items]);

  const togglePlay = async (index: number) => {
    const current = audioRefs.current[index];
    if (!current) return;

    try {
      if (!current.paused) {
        current.pause();
      } else {
        // Pause all others first
        if (activeIndex !== null && activeIndex !== index) {
          const active = audioRefs.current[activeIndex];
          if (active) active.pause();
        }
        await current.play();
      }
    } catch (error) {
      console.error("Error toggling audio:", error);
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
              disabled={loadingIndex === index || !item.audioUrl}
            >
              {loadingIndex === index ? (
                <Loader className="h-4 w-4 animate-spin" />
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
