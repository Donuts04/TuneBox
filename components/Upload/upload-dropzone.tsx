"use client";

import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Upload } from "lucide-react";
import { toast } from "sonner";

interface UploadDropzoneProps {
  onFileSelected: (file: File) => void;
  onBack: () => void;
}

export default function UploadDropzone({
  onFileSelected,
  onBack,
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
    <Card className="border border-dashed border-black dark:border-white rounded-lg">
      <CardContent className="p-10">
        <div
          {...getRootProps()}
          className={`flex flex-col items-center justify-center gap-4 text-center cursor-pointer rounded-lg p-10 transition-colors ${
            isDragActive ? "bg-black/5 dark:bg-white/5" : "bg-transparent"
          }`}
        >
          <input {...getInputProps()} />
          <div className="w-20 h-20 rounded-full border border-dashed border-black dark:border-white flex items-center justify-center">
            <Upload className="h-10 w-10" />
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
