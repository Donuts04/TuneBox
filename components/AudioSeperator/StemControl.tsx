"use client";

import { memo } from "react";
import { Button } from "@/components/ui/button";
import { Play, Pause, Download, Volume2 } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { formatTime } from "@/lib/utils";

export interface StemSource {
  name: string;
  icon: React.ReactNode;
  audioUrl?: string;
  audioData?: Uint8Array;
  audioBuffer?: AudioBuffer;
}

interface StemControlProps {
  audioId: string;
  audioSource: StemSource;
  isPlaying: boolean;
  isPaused: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  onToggle: (audioId: string) => void;
  onSeek: (value: number[]) => void;
  onVolumeChange: (audioId: string, value: number) => void;
}

const StemControl = memo(
  ({
    audioId,
    audioSource,
    isPlaying,
    isPaused,
    currentTime,
    duration,
    volume,
    onToggle,
    onSeek,
    onVolumeChange,
  }: StemControlProps) => (
    <div className="border border-black dark:border-white rounded-lg overflow-hidden transition-all">
      <div className="flex flex-col">
        <div className="flex items-center justify-between p-3">
          <div className="flex items-center">
            <div className="w-9 h-9 rounded-full border border-black dark:border-white flex items-center justify-center mr-3">
              {audioSource.icon}
            </div>
            <span className="font-semibold text-lg">{audioSource.name}</span>
          </div>

          <Button
            variant="outline"
            size="icon"
            className={`h-9 w-9 rounded-full transition-colors border border-black dark:border-white ${
              isPlaying || isPaused
                ? "bg-black text-white dark:bg-white dark:text-black"
                : "bg-transparent text-black dark:text-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black"
            }`}
            onClick={() => onToggle(audioId)}
          >
            {isPlaying ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
            )}
          </Button>
        </div>

        <div className="flex items-center gap-3 bg-white dark:bg-black border-y border-black dark:border-white px-3 py-1.5">
          <span className="text-xs font-mono whitespace-nowrap">
            {formatTime(currentTime)}
          </span>
          <Slider
            value={[currentTime]}
            min={0}
            max={duration}
            step={0.1}
            onValueChange={onSeek}
            className="flex-grow"
          />
          <span className="text-xs font-mono w-8">{formatTime(duration)}</span>
        </div>

        <div className="p-3 flex justify-between items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="w-full h-9 border border-black/50 dark:border-white/50 text-black dark:text-white hover:text-white hover:dark:text-black bg-transparent hover:bg-black dark:hover:bg-white transition-colors"
            asChild
          >
            <a
              href={audioSource.audioUrl}
              download={`${audioSource.name.toLowerCase()}.wav`}
              title={`Download ${audioSource.name}`}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              <span>Download</span>
            </a>
          </Button>
        </div>

        <div className="px-3 pb-3 flex items-center gap-2">
          <Volume2 className="h-4 w-4 text-muted-foreground" />
          <Slider
            value={[volume]}
            min={0}
            max={1}
            step={0.01}
            onValueChange={(value) => onVolumeChange(audioId, value[0])}
            className="flex-grow"
          />
        </div>
      </div>
    </div>
  )
);

StemControl.displayName = "StemControl";

export default StemControl;
