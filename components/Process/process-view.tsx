"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Layers, FileMusic, Mic, Drum, AudioLines, Music } from "lucide-react";
import AudioHeader from "../AudioCard.tsx/AudioHeader";
import AudioEffects from "../AudioEffects/audio-effects";
import AudioSeparator, {
  StemSource,
} from "../AudioSeperator/audio-separator copy";
import AudioConverter from "../ConvertToNotes/audio-converter copy";
import { DeezerTrack } from "@/lib/deezer";
import { Midi } from "@tonejs/midi";

interface ProcessViewProps {
  uploadedFile: File | null;
  track: DeezerTrack | null;
}

export default function ProcessView({ uploadedFile, track }: ProcessViewProps) {
  const [showSeparator, setShowSeparator] = useState(false);
  const [showConverter, setShowConverter] = useState(false);
  const [separateLoading, setSeparateLoading] = useState(false);
  const [separateError, setSeparateError] = useState<string | null>(null);
  const [stems, setStems] = useState<Record<string, StemSource>>({});

  const [convertLoading, setConvertLoading] = useState(false);
  const [convertError, setConvertError] = useState<string | null>(null);
  const [midi, setMidi] = useState<Midi | null>(null);
  const [uploadedObjectUrl, setUploadedObjectUrl] = useState<string | null>(
    null
  );
  const [hasSeparated, setHasSeparated] = useState(false);
  const [hasConverted, setHasConverted] = useState(false);
  const [lastComposer, setLastComposer] = useState<string | null>(null);
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
    if (hasSeparated && Object.keys(stems).length > 0) return;
    setSeparateLoading(true);
    setSeparateError(null);
    setStems({});
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
      const stemMeta: Record<string, { name: string; icon: React.ReactNode }> =
        {
          vocals: {
            name: "Vocals",
            icon: <Mic className="h-4 w-4" />,
          },
          drums: {
            name: "Drums",
            icon: <Drum className="h-4 w-4" />,
          },
          bass: {
            name: "Bass",
            icon: <AudioLines className="h-4 w-4" />,
          },
          other: {
            name: "Other",
            icon: <Music className="h-4 w-4" />,
          },
        };
      const processed: Record<string, StemSource> = {};
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
          processed[key] = {
            name: stemMeta[key].name,
            icon: stemMeta[key].icon,
            audioUrl: objectUrl,
            audioData: uint8,
            audioBuffer: undefined,
          };
        } catch {}
      }
      setStems(processed);
      setHasSeparated(true);
    } catch (e) {
      setSeparateError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setSeparateLoading(false);
    }
  }, [getInputFile, hasSeparated, stems]);

  const handleConvert = useCallback(
    async (composer: string) => {
      if (midi && lastComposer === composer && hasConverted) return;
      setConvertLoading(true);
      setConvertError(null);
      setMidi(null);
      try {
        const input = await getInputFile();
        if (!input) throw new Error("No audio selected");
        const formData = new FormData();
        formData.append("file", input);
        formData.append("composer", composer);
        const apiResponse = await fetch("/api/generate-midi", {
          method: "POST",
          body: formData,
        });
        if (!apiResponse.ok)
          throw new Error(
            `Server responded with status: ${apiResponse.status}`
          );
        const midiBlob = await apiResponse.blob();
        const arrayBuffer = await midiBlob.arrayBuffer();
        const midiParsed = new Midi(arrayBuffer);
        setMidi(midiParsed);
        setHasConverted(true);
        setLastComposer(composer);
      } catch (e) {
        setConvertError(e instanceof Error ? e.message : "Unknown error");
      } finally {
        setConvertLoading(false);
      }
    },
    [getInputFile, midi, lastComposer, hasConverted]
  );

  // Auto-run separation the first time the section is opened
  useEffect(() => {
    if (showSeparator && !hasSeparated && !separateLoading) {
      handleSeparate();
    }
  }, [showSeparator, hasSeparated, separateLoading, handleSeparate]);

  return (
    <Card className="border border-black dark:border-white rounded-lg">
      <AudioHeader
        uploadedFile={uploadedFile || undefined}
        track={track || undefined}
      />
      <CardContent className="p-4 space-y-4 bg-transparent">
        <AudioEffects uploadedFile={uploadedFile} track={track} />

        {(!showSeparator || !showConverter) && (
          <div className="flex flex-col md:flex-row gap-4">
            {!showSeparator && (
              <Card
                className="border border-black dark:border-white transition-all cursor-pointer flex-1"
                onClick={() => setShowSeparator(true)}
              >
                <CardContent className="p-6 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center border border-black dark:border-white">
                      <Layers className="h-5 w-5 text-black dark:text-white" />
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
                  <div className="text-sm text-black dark:text-white">Open</div>
                </CardContent>
              </Card>
            )}

            {!showConverter && (
              <Card
                className="border border-black dark:border-white transition-all cursor-pointer flex-1"
                onClick={() => setShowConverter(true)}
              >
                <CardContent className="p-6 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center border border-black dark:border:white">
                      <FileMusic className="h-5 w-5 text-black dark:text-white" />
                    </div>
                    <div>
                      <h4 className="text-base font-semibold text-black dark:text-white">
                        Convert to Notes
                      </h4>
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        Extract notes / MIDI
                      </p>
                    </div>
                  </div>
                  <div className="text-sm text-black dark:text-white">Open</div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {showSeparator && (
          <div className="space-y-3">
            <AudioSeparator
              stems={stems}
              isLoading={separateLoading}
              error={separateError}
              loaderImageUrl={track?.album.cover_medium || null}
            />
          </div>
        )}

        {showConverter && (
          <div className="space-y-3">
            <AudioConverter
              midi={midi}
              originalAudioUrl={originalAudioUrl}
              isLoading={convertLoading}
              error={convertError}
              onRequestConvert={handleConvert}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
