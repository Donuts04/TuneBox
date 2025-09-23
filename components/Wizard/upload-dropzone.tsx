"use client";

import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Card, CardContent } from "@/components/ui/card";
import { Upload } from "lucide-react";
import { toast } from "sonner";

interface UploadDropzoneProps {
  onFileSelected: (file: File) => void;
}

export default function UploadDropzone({
  onFileSelected,
}: UploadDropzoneProps) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles && acceptedFiles.length > 0) {
        const file = acceptedFiles[0];
        if (!file.type.startsWith("audio/")) {
          toast.error("Please upload an audio file (MP3, WAV, etc.)");
          return;
        }
        onFileSelected(file);
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
