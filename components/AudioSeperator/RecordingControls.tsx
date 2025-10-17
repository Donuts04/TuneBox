"use client";

import { memo } from "react";
import { Button } from "@/components/ui/button";
import { Download, RotateCcw } from "lucide-react";

interface RecordingControlsProps {
  isRecording: boolean;
  hasRecordedAudio: boolean;
  isLooping: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onDownload: () => void;
  onToggleLoop: () => void;
}

const RecordingControls = memo(
  ({
    isRecording,
    hasRecordedAudio,
    isLooping,
    onStartRecording,
    onStopRecording,
    onDownload,
    onToggleLoop,
  }: RecordingControlsProps) => (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-2 w-full">
      <Button
        onClick={onToggleLoop}
        variant="outline"
        size="sm"
        className={`h-9 w-full sm:flex-[2] border border-black dark:border-white transition-colors ${
          isLooping
            ? "bg-black text-white dark:bg-white dark:text-black"
            : "text-black dark:text-white hover:text-white hover:dark:text-black bg-transparent hover:bg-black dark:hover:bg-white"
        }`}
      >
        <RotateCcw className="h-4 w-4" />
        <span className="text-xs">{isLooping ? "Loop On" : "Loop"}</span>
      </Button>

      <Button
        onClick={isRecording ? onStopRecording : onStartRecording}
        variant="outline"
        size="sm"
        className="h-9 w-full sm:flex-[5] border border-black dark:border-white text-black dark:text-white hover:text-white hover:dark:text-black bg-transparent hover:bg-black dark:hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <div
          className={`w-2.5 h-2.5 rounded-full bg-red-500 ${
            isRecording ? "animate-pulse" : ""
          }`}
        />
        <span className="hidden sm:inline">
          {isRecording ? "Stop Recording" : "Record Mix"}
        </span>
        <span className="sm:hidden">{isRecording ? "Stop" : "Record"}</span>
      </Button>

      {hasRecordedAudio && (
        <Button
          onClick={onDownload}
          variant="outline"
          size="sm"
          className="h-9 w-full sm:flex-[3] border border-black dark:border-white text-black dark:text-white hover:text-white hover:dark:text-black bg-transparent hover:bg-black dark:hover:bg-white transition-colors"
        >
          <Download className="h-4 w-4" />

          <span>Download</span>
        </Button>
      )}
    </div>
  )
);

RecordingControls.displayName = "RecordingControls";

export default RecordingControls;
