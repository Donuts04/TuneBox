"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Layers,
  KeyboardMusic,
  CircleChevronRight,
  RefreshCw,
} from "lucide-react";
import AudioHeader from "@/components/AudioCard.tsx/AudioHeader";
import AudioEffects from "@/components/AudioEffects/AudioEffects";
import StemPlayer from "@/components/AudioSeperator/StemPlayer";
import MidiPlayer from "@/components/ConvertToNotes/MidiPlayer";
import { DeezerTrack } from "@/lib/deezer";
import { Midi } from "@tonejs/midi";
import { Alert } from "@/components/ui/alert";
import { AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import TuneBoxLoader from "@/components/loaders/tunebox-loader";

interface ProcessViewProps {
  uploadedFile: File | null;
  track: DeezerTrack | null;
}

export default function ProcessView({ uploadedFile, track }: ProcessViewProps) {
  const [showSeparator, setShowSeparator] = useState(false);
  const [showConverter, setShowConverter] = useState(false);
  const [separateLoading, setSeparateLoading] = useState(false);
  const [separateError, setSeparateError] = useState<string | null>(null);
  const [audioUrls, setAudioUrls] = useState<Record<string, string>>({});

  const [convertLoading, setConvertLoading] = useState(false);
  const [convertError, setConvertError] = useState<string | null>(null);
  const [midi, setMidi] = useState<Midi | null>(null);
  const [uploadedObjectUrl, setUploadedObjectUrl] = useState<string | null>(
    null
  );
  const [hasSeparated, setHasSeparated] = useState(false);
  const [hasConverted, setHasConverted] = useState(false);
  useEffect(() => {
    if (uploadedFile) {
      const url = URL.createObjectURL(uploadedFile);
      setUploadedObjectUrl(url);
      return () => {
        URL.revokeObjectURL(url);
        setUploadedObjectUrl(null);
      };
    } else {
      setUploadedObjectUrl(null);
    }
  }, [uploadedFile]);
  const originalAudioUrl = useMemo(
    () => uploadedObjectUrl || track?.preview || null,
    [uploadedObjectUrl, track]
  );

  const getInputFile = useCallback(async (): Promise<File | null> => {
    try {
      if (uploadedFile) return uploadedFile;
      if (track?.preview) {
        const response = await fetch(track.preview);
        if (!response.ok) return null;
        const blob = await response.blob();
        return new File([blob], `${track.title}.mp3`, { type: "audio/mpeg" });
      }
    } catch {}
    return null;
  }, [uploadedFile, track]);

  const handleSeparate = useCallback(async () => {
    setShowSeparator(true);
    if (hasSeparated && Object.keys(audioUrls).length > 0) return;
    setSeparateLoading(true);
    setSeparateError(null);
    setAudioUrls({});
    try {
      const input = await getInputFile();
      if (!input) throw new Error("No audio selected");
      const formData = new FormData();
      formData.append("file", input);
      const response = await fetch("/api/separate", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) throw new Error("Failed to separate audio");
      const result = await response.json();
      if (!result.stems || typeof result.stems !== "object") {
        throw new Error("Invalid response from separation API");
      }
      const processed: Record<string, string> = {};
      for (const key of Object.keys(result.stems)) {
        const url = result.stems[key];
        if (!url) continue;
        try {
          const audioResponse = await fetch(url);
          if (!audioResponse.ok) continue;
          const arrayBuffer = await audioResponse.arrayBuffer();
          const uint8 = new Uint8Array(arrayBuffer);
          const blob = new Blob([uint8], { type: "audio/wav" });
          const objectUrl = URL.createObjectURL(blob);
          processed[key] = objectUrl;
        } catch {}
      }
      setAudioUrls(processed);
      setHasSeparated(true);
    } catch (e) {
      setSeparateError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setSeparateLoading(false);
    }
  }, [getInputFile, hasSeparated, audioUrls]);

  const handleConvert = useCallback(async () => {
    setShowConverter(true);
    if (midi && hasConverted) return;
    setConvertLoading(true);
    setConvertError(null);
    setMidi(null);
    try {
      const input = await getInputFile();
      if (!input) throw new Error("No audio selected");
      const formData = new FormData();
      formData.append("file", input);
      const apiResponse = await fetch("/api/generate-midi", {
        method: "POST",
        body: formData,
      });
      if (!apiResponse.ok) throw new Error(`Failed to convert audio`);
      const midiBlob = await apiResponse.blob();
      const arrayBuffer = await midiBlob.arrayBuffer();
      const midiParsed = new Midi(arrayBuffer);
      setMidi(midiParsed);
      setHasConverted(true);
    } catch (e) {
      setConvertError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setConvertLoading(false);
    }
  }, [getInputFile, midi, hasConverted]);

  return (
    <div className="space-y-4">
      <AudioHeader
        title={track?.title || uploadedFile?.name || ""}
        subtitle={
          track
            ? `${track.artist.name} • ${track.album.title}`
            : uploadedFile
            ? `${(uploadedFile.size / 1024 / 1024).toFixed(2)} MB • ${
                uploadedFile.type
              }`
            : undefined
        }
        imageUrl={track?.album.cover_medium}
        audioUrl={originalAudioUrl || undefined}
      />

      <AudioEffects audioUrl={originalAudioUrl} />

      {(!showSeparator || !showConverter) && (
        <div className="flex flex-col md:flex-row gap-4">
          {!showSeparator && (
            <div
              className="border border-black dark:border-white cursor-pointer flex-1 p-4 flex items-center justify-between rounded-lg"
              onClick={() => handleSeparate()}
            >
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-full flex items-center justify-center border border-black dark:border-white bg-black dark:bg-white text-white dark:text-black">
                  <Layers className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="text-base font-semibold text-black dark:text-white">
                    Separate Audio
                  </h4>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Split into stems
                  </p>
                </div>
              </div>

              <div className="h-9 w-9 rounded-full border border-black/20 dark:border-white/20 flex items-center justify-center">
                <CircleChevronRight className="h-5 w-5" />
              </div>
            </div>
          )}

          {!showConverter && (
            <div
              className="border border-black dark:border-white transition-all cursor-pointer flex-1 p-4 flex items-center justify-between rounded-lg"
              onClick={() => handleConvert()}
            >
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-full flex items-center justify-center border border-black dark:border-white bg-black dark:bg-white text-white dark:text-black">
                  <KeyboardMusic className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="text-base font-semibold text-black dark:text-white">
                    Convert to Notes
                  </h4>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Extract notes
                  </p>
                </div>
              </div>

              <div className="h-9 w-9 rounded-full border border-black/20 dark:border-white/20 flex items-center justify-center">
                <CircleChevronRight className="h-5 w-5" />
              </div>
            </div>
          )}
        </div>
      )}

      {separateLoading && (
        <div className="flex justify-center items-center py-12">
          <TuneBoxLoader />
        </div>
      )}

      {separateError && (
        <div className="space-y-4">
          <Alert variant="destructive" className="animate-in fade-in-50">
            <AlertDescription>{separateError}</AlertDescription>
          </Alert>
          <Button
            onClick={() => handleSeparate()}
            className="border border-black dark:border-white bg-white text-black hover:bg-black hover:text-white dark:bg-black dark:text-white dark:hover:bg-white dark:hover:text-black w-full"
          >
            <RefreshCw className="h-4 w-4" />
            Try Again
          </Button>
        </div>
      )}

      {convertLoading && (
        <div className="flex justify-center items-center py-12 max-w-md mx-auto">
          <TuneBoxLoader />
        </div>
      )}

      {convertError && (
        <div className="space-y-4">
          <Alert variant="destructive" className="animate-in fade-in-50">
            <AlertDescription>{convertError}</AlertDescription>
          </Alert>
          <Button
            onClick={handleConvert}
            className="border border-black dark:border-white bg-white text-black hover:bg-black hover:text-white dark:bg-black dark:text-white dark:hover:bg-white dark:hover:text-black w-full"
          >
            <RefreshCw className="h-4 w-4" />
            Try Again
          </Button>
        </div>
      )}

      {showSeparator && !separateLoading && !separateError && (
        <div className="space-y-3">
          <StemPlayer audioUrls={audioUrls} />
        </div>
      )}

      {showConverter && !convertLoading && !convertError && (
        <div className="space-y-3">
          <MidiPlayer midi={midi} originalAudioUrl={originalAudioUrl} />
        </div>
      )}
    </div>
  );
}
