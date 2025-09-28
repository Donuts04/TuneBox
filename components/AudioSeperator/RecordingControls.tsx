"use client";

import { memo } from "react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

interface RecordingControlsProps {
  isRecording: boolean;
  hasRecordedAudio: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onDownload: () => void;
}

const RecordingControls = memo(
  ({
    isRecording,
    hasRecordedAudio,
    onStartRecording,
    onStopRecording,
    onDownload,
  }: RecordingControlsProps) => (
    <div className="flex items-center justify-center gap-2">
      <Button
        onClick={isRecording ? onStopRecording : onStartRecording}
        variant="outline"
        size="sm"
        className="h-9 border border-black dark:border-white text-black dark:text-white hover:text-white hover:dark:text-black bg-transparent hover:bg-black dark:hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <div
          className={`w-2.5 h-2.5 rounded-full bg-red-500 ${
            isRecording ? "animate-pulse" : ""
          }`}
        />
        <span className="ml-2">
          {isRecording ? "Stop Recording" : "Record Mix"}
        </span>
      </Button>

      {hasRecordedAudio && (
        <Button
          onClick={onDownload}
          variant="outline"
          size="sm"
          className="h-9 border border-black dark:border-white text-black dark:text-white hover:text-white hover:dark:text-black bg-transparent hover:bg-black dark:hover:bg-white transition-colors"
        >
          <Download className="h-4 w-4" />
          <span className="ml-2">Download WAV</span>
        </Button>
      )}
    </div>
  )
);

RecordingControls.displayName = "RecordingControls";

export default RecordingControls;
