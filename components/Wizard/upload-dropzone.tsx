"use client";

import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Card, CardContent } from "@/components/ui/card";
import { Upload } from "lucide-react";
import { toast } from "sonner";

const checkAudioDuration = (file: File): Promise<number> => {
  return new Promise((resolve, reject) => {
    const audio = new Audio();
    const url = URL.createObjectURL(file);

    audio.addEventListener("loadedmetadata", () => {
      URL.revokeObjectURL(url);
      resolve(audio.duration);
    });

    audio.addEventListener("error", () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not load audio file"));
    });

    audio.src = url;
  });
};

interface UploadDropzoneProps {
  onFileSelected: (file: File) => void;
}

export default function UploadDropzone({
  onFileSelected,
}: UploadDropzoneProps) {
  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles && acceptedFiles.length > 0) {
        const file = acceptedFiles[0];
        if (!file.type.startsWith("audio/")) {
          toast.error("Please upload an audio file (MP3, WAV, etc.)");
          return;
        }

        // Check audio duration
        try {
          const duration = await checkAudioDuration(file);
          const maxDurationSeconds = 90; // 1 minute 30 seconds

          if (duration > maxDurationSeconds) {
            const minutes = Math.floor(duration / 60);
            const seconds = Math.round(duration % 60);
            const durationText =
              minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;

            toast.error(
              `File is ${durationText} long. Only files up to 1 minute 30 seconds are allowed.`,
              {
                action: {
                  label: "Contact Me ;)",
                  onClick: () => {
                    window.open(
                      "mailto:osamaqadoumi12@gmail.com?subject=API Access Request",
                      "_blank"
                    );
                  },
                },
              }
            );
            return;
          }

          onFileSelected(file);
        } catch {
          toast.error(
            "Could not process audio file. Please try a different file."
          );
          return;
        }
      }
    },
    [onFileSelected]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    onDropRejected: (fileRejections) => {
      const first = fileRejections[0];
      const reason = first?.errors?.[0]?.message || "Unsupported file";
      toast.error(`Upload failed: ${reason}`);
    },
    accept: { "audio/*": [] },
    multiple: false,
    maxFiles: 1,
  });

  return (
    <Card className="border border-dashed border-black dark:border-white rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-all duration-300">
      <CardContent className="p-10">
        <div
          {...getRootProps()}
          className={`flex flex-col items-center justify-center gap-4 text-center cursor-pointer rounded-lg p-10 transition-colors ${
            isDragActive ? "bg-black/5 dark:bg-white/5" : "bg-transparent"
          }`}
          tabIndex={0}
          aria-label="Audio file dropzone"
          role="button"
        >
          <input {...getInputProps()} />
          <div
            className={`w-20 h-20 rounded-full border border-dashed border-black dark:border-white flex items-center justify-center transition-transform ${
              isDragActive ? "scale-110" : ""
            }`}
          >
            <Upload className="h-10 w-10 opacity-80" />
          </div>
          {isDragActive ? (
            <p className="text-black dark:text-white">
              Drop the audio file here...
            </p>
          ) : (
            <div className="flex flex-col items-center justify-center gap-1">
              <p className="text-black dark:text-white font-medium">
                Drag and drop an audio file here
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                or click to select a file (MP3, WAV, etc.)
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
