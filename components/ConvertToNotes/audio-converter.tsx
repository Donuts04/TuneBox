"use client";

import type React from "react";

import { useState, useEffect, useRef } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Music,
  Loader2,
  FileAudio,
  KeyboardMusic,
  Upload,
  Speaker,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Play, Pause, Settings } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { DeezerTrack } from "@/lib/deezer";
import { INSTRUMENTS } from "@/lib/instruments";
import Image from "next/image";
import CircleLoader from "../loaders/circleLoader";
import { Midi } from "@tonejs/midi";
import TonePlayer from "./TonePlayer";

export interface Note {
  start: number;
  end: number;
  pitch: number;
  velocity: number;
}

export interface MusicData {
  notes: Note[];
  "X-Processing-Time-Seconds": number;
}

interface AudioSource {
  name: string;
  downloadLink: string;
  color: string;
  icon: React.ReactNode;
}

interface AudioProcessingParams {
  onset_threshold?: number | null;
  frame_threshold?: number | null;
  minimum_note_length?: number | null;
  minimum_frequency?: number | null;
  maximum_frequency?: number | null;
  multiple_pitch_bends?: boolean | null;
  tempo_override?: number | null;
}

type ModelType = "basic" | "advanced";

interface ComposerOption {
  id: string;
  label: string;
}

const COMPOSER_OPTIONS: ComposerOption[] = [
  { id: "composer1", label: "Classic Pop Ballad" },
  { id: "composer2", label: "Jazz-Inspired Arrangement" },
  { id: "composer3", label: "Upbeat Dance Style" },
  { id: "composer4", label: "Acoustic Singer-Songwriter" },
  { id: "composer5", label: "R&B Smooth Groove" },
  { id: "composer6", label: "Rock Piano Version" },
  { id: "composer7", label: "Minimalist Interpretation" },
  { id: "composer8", label: "Orchestral Pop Fusion" },
  { id: "composer9", label: "Soulful Expression" },
  { id: "composer10", label: "Funky Rhythmic Style" },
  { id: "composer11", label: "Electronic Remix" },
  { id: "composer12", label: "Latin Pop Flavor" },
  { id: "composer13", label: "Indie Pop Arrangement" },
  { id: "composer14", label: "Gospel-Inspired Harmony" },
  { id: "composer15", label: "Ambient Chill Version" },
  { id: "composer16", label: "Retro 80s Vibe" },
  { id: "composer17", label: "Country Ballad Style" },
  { id: "composer18", label: "Experimental Fusion" },
  { id: "composer19", label: "Cinematic Score Approach" },
  { id: "composer20", label: "Bluesy Interpretation" },
  { id: "composer21", label: "Contemporary Classical" },
];

interface AudioConverterProps {
  uploadedFile?: File | null;
  stemKey?: string;
  isProcessed?: boolean;
  onProcessed?: (musicData: MusicData) => void;
  track?: DeezerTrack | null;
  showCardHeader?: boolean;
  audioUrl?: string;
}

export default function AudioConverter({
  uploadedFile,
  stemKey = "main",
  isProcessed = false,
  onProcessed,
  track,
  showCardHeader = true,
  audioUrl,
}: AudioConverterProps) {
  const [audioSource, setAudioSource] = useState<AudioSource | null>(null);
  const [audioId, setAudioId] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<ModelType>("advanced");
  const [selectedComposer, setSelectedComposer] = useState<string>("composer1");

  const [musicData, setMusicData] = useState<MusicData | null>(null);

  const isInitialRender = useRef(true);
  const [isLoading, setIsLoading] = useState(!isProcessed);
  const [error, setError] = useState<string | null>(null);
  const [selectedInstrument, setSelectedInstrument] = useState(
    INSTRUMENTS[0].id
  );
  const [processingAudio, setProcessingAudio] = useState(false);

  // Audio processing parameters
  const [processingParams, setProcessingParams] =
    useState<AudioProcessingParams>({
      onset_threshold: null,
      frame_threshold: null,
      minimum_note_length: null,
      minimum_frequency: null,
      maximum_frequency: null,
      multiple_pitch_bends: null,
      tempo_override: null,
    });

  const [isHeaderPlaying, setIsHeaderPlaying] = useState(false);
  const [headerCurrentTime, setHeaderCurrentTime] = useState(0);
  const [headerAudioDuration, setHeaderAudioDuration] = useState(0);
  const headerAudioRef = useRef<HTMLAudioElement | null>(null);

  const [midiData, setMidiData] = useState<Midi | null>(null);
  const [duration, setDuration] = useState(0);

  const toggleHeaderPlayback = () => {
    if (!headerAudioRef.current) return;

    if (isHeaderPlaying) {
      headerAudioRef.current.pause();
    } else {
      headerAudioRef.current.play();
    }
    setIsHeaderPlaying(!isHeaderPlaying);
  };

  const handleHeaderSeek = (value: number[]) => {
    if (!headerAudioRef.current) return;
    const newTime = value[0];
    headerAudioRef.current.currentTime = newTime;
    setHeaderCurrentTime(newTime);
  };

  useEffect(() => {
    if (track?.preview || uploadedFile || audioUrl) {
      const audio = new Audio(
        track?.preview || audioUrl || URL.createObjectURL(uploadedFile!)
      );
      headerAudioRef.current = audio;

      audio.addEventListener("timeupdate", () => {
        setHeaderCurrentTime(audio.currentTime);
      });

      audio.addEventListener("loadedmetadata", () => {
        setHeaderAudioDuration(audio.duration);
      });

      audio.addEventListener("ended", () => {
        setIsHeaderPlaying(false);
        setHeaderCurrentTime(0);
      });

      return () => {
        audio.pause();
        audio.removeEventListener("timeupdate", () => {});
        audio.removeEventListener("loadedmetadata", () => {});
        audio.removeEventListener("ended", () => {});
        if (uploadedFile) {
          URL.revokeObjectURL(audio.src);
        }
      };
    }
  }, [track, uploadedFile, audioUrl]);

  useEffect(() => {
    if (track) {
      setIsLoading(true);
      setError(null);

      const uniqueId = `track-${stemKey}-${Date.now()}`;
      setAudioId(uniqueId);

      // Create audio source object
      setAudioSource({
        name: `${track.title} - ${track.artist.name}`,
        downloadLink: track.preview,
        color: "bg-blue-500 hover:bg-blue-600",
        icon: <Music className="h-4 w-4" />,
      });

      setIsLoading(false);
    }
  }, [track, stemKey]);

  useEffect(() => {
    if (uploadedFile) {
      setIsLoading(true);
      setError(null);

      // Create a unique ID for this audio
      const uniqueId = `upload-${stemKey}-${Date.now()}`;
      setAudioId(uniqueId);

      // Create a URL for the uploaded file
      const fileUrl = URL.createObjectURL(uploadedFile);

      // Create audio source object
      setAudioSource({
        name: uploadedFile.name,
        downloadLink: fileUrl,
        color: "bg-amber-500 hover:bg-amber-600",
        icon: <Music className="h-4 w-4" />,
      });

      setIsLoading(false);

      return () => {
        URL.revokeObjectURL(fileUrl);
      };
    }
  }, [uploadedFile, stemKey]);

  // Stem audio URL
  useEffect(() => {
    if (audioUrl) {
      setIsLoading(true);
      setError(null);

      // Create a unique ID for this audio
      const uniqueId = `stem-${stemKey}-${Date.now()}`;
      setAudioId(uniqueId);

      // Create audio source object
      setAudioSource({
        name: `Stem ${stemKey}`,
        downloadLink: audioUrl,
        color: "bg-purple-500 hover:bg-purple-600",
        icon: <Music className="h-4 w-4" />,
      });

      setIsLoading(false);
    }
  }, [audioUrl, stemKey]);

  // Process the audio when component mounts if not already processed
  useEffect(() => {
    if (!isProcessed && audioSource && !musicData) {
      processAudio();
    }
  }, [isProcessed, audioSource, musicData]);

  // Process audio to extract notes
  const processAudio = async () => {
    if (!audioSource) return;

    setIsLoading(true);
    setError(null);
    setProcessingAudio(true);

    try {
      const response = await fetch(audioSource.downloadLink);
      if (!response.ok) {
        throw new Error(`Failed to fetch audio: ${response.statusText}`);
      }

      const blob = await response.blob();

      const file = new File([blob], `${audioSource.name}.mp3`, {
        type: "audio/mpeg",
      });

      const formData = new FormData();
      formData.append("file", file);

      if (selectedModel === "basic") {
        Object.entries(processingParams).forEach(([key, value]) => {
          if (value !== null) {
            formData.append(key, value.toString());
          }
        });

        const apiResponse = await fetch("/api/process-audio", {
          method: "POST",
          body: formData,
        });

        if (!apiResponse.ok) {
          throw new Error(
            `Server responded with status: ${apiResponse.status}`
          );
        }

        const data = await apiResponse.json();

        if (!data) {
          setError("API returned empty data");
          return;
        }

        if (!data.notes) {
          setError("API response is missing notes array");
          return;
        }

        if (!Array.isArray(data.notes)) {
          setError("API response notes is not an array");
          return;
        }

        if (data.notes && Array.isArray(data.notes)) {
          const newMusicData: MusicData = {
            notes: data.notes,
            "X-Processing-Time-Seconds": data["X-Processing-Time-Seconds"] || 0,
          };

          isInitialRender.current = true;

          // Use a function update to ensure we don't depend on the previous state
          setMusicData(() => ({ ...newMusicData }));

          // Immediately update loading state to trigger a rerender
          setIsLoading(false);

          // Force a rerender - this is a hack but will ensure the component updates
          setTimeout(() => {
            if (onProcessed) {
              onProcessed(newMusicData);
            }
          }, 50);
        } else {
          throw new Error(
            "Invalid response format from server: notes array is missing or not an array"
          );
        }
      } else if (selectedModel === "advanced") {
        formData.append("composer", selectedComposer);
        const apiResponse = await fetch("/api/generate-midi", {
          method: "POST",
          body: formData,
        });

        if (!apiResponse.ok) {
          throw new Error(
            `Server responded with status: ${apiResponse.status}`
          );
        }

        const midiBlob = await apiResponse.blob();
        const arrayBuffer = await midiBlob.arrayBuffer();
        const midi = new Midi(arrayBuffer);
        setMidiData(midi);
        setDuration(midi.duration);

        // Convert MIDI to our note format
        const notes: Note[] = [];
        midi.tracks.forEach((track) => {
          track.notes.forEach((note) => {
            notes.push({
              start: note.time,
              end: note.time + note.duration,
              pitch: note.midi,
              velocity: note.velocity,
            });
          });
        });

        const newMusicData: MusicData = {
          notes,
          "X-Processing-Time-Seconds": 0,
        };

        setMusicData(newMusicData);
        if (onProcessed) {
          onProcessed(newMusicData);
        }
      }
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unknown error processing audio"
      );
    } finally {
      setIsLoading(false);
      setProcessingAudio(false);
    }
  };

  // Handle parameter changes
  const handleParamChange = (
    param: keyof AudioProcessingParams,
    value: any
  ) => {
    setProcessingParams((prev) => ({
      ...prev,
      [param]: value,
    }));
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const calculateTotalDuration = (notes: Note[]) => {
    return notes.length > 0 ? Math.max(...notes.map((n) => n.end)) + 1 : 30;
  };

  useEffect(() => {
    if (audioSource && !isInitialRender.current && selectedModel === "basic") {
      processAudio();
    }
  }, [selectedModel, audioSource]);

  useEffect(() => {
    if (
      audioSource &&
      // !isInitialRender.current &&
      selectedModel === "advanced" &&
      selectedComposer
    ) {
      processAudio();
    }
  }, [selectedComposer]);

  const separateAudio = async (file: File) => {
    if (!file) return;

    // Create a unique ID for this audio
    const uniqueId = `upload-${stemKey}-${Date.now()}`;
    setAudioId(uniqueId);

    // Create audio source object
    setAudioSource({
      name: file.name,
      downloadLink: URL.createObjectURL(file),
      color: "bg-amber-500 hover:bg-amber-600",
      icon: <Music className="h-4 w-4" />,
    });

    setIsLoading(false);
  };

  return (
    <Card className="w-full border border-black dark:border-white overflow-hidden bg-transparent">
      {showCardHeader && (
        <CardHeader className="border-b border-black dark:border-white p-3 sm:p-4">
          <CardTitle className="flex flex-col md:flex-row items-start md:items-center text-lg gap-3">
            {track ? (
              <div className="flex flex-col md:flex-row items-start md:items-end justify-between w-full gap-4">
                <div className="flex items-end gap-3 flex-1 min-w-0">
                  {track.album.cover_medium && (
                    <div className="flex-shrink-0">
                      <Image
                        src={track.album.cover_medium || "/placeholder.svg"}
                        alt={track.album.title}
                        width={60}
                        height={60}
                        className="rounded-md border border-black dark:border-white"
                      />
                    </div>
                  )}
                  <div className="flex flex-col justify-between min-w-0">
                    <h3 className="font-semibold truncate">{track.title}</h3>
                    <p className="text-sm font-medium text-muted-foreground truncate">
                      {track.artist.name} • {track.album.title}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full md:w-[300px] flex-shrink-0">
                  <Button
                    className={`rounded-full transition-transform hover:scale-105 h-8 w-8 ${
                      isHeaderPlaying
                        ? "bg-black text-white hover:bg-black/90 dark:bg-white dark:text-black dark:hover:bg-white/90"
                        : "bg-white text-black border border-black hover:bg-black hover:text-white dark:bg-black dark:text-white dark:border-white dark:hover:bg-white dark:hover:text-black"
                    }`}
                    onClick={toggleHeaderPlayback}
                  >
                    {isHeaderPlaying ? (
                      <Pause className="h-3 w-3" />
                    ) : (
                      <Play className="h-3 w-3" />
                    )}
                  </Button>

                  <div className="flex items-center gap-2 bg-white dark:bg-black border border-black dark:border-white rounded-full px-3 py-1.5 flex-grow">
                    <span className="text-xs font-mono whitespace-nowrap">
                      {formatTime(headerCurrentTime)}
                    </span>
                    <Slider
                      value={[headerCurrentTime]}
                      min={0}
                      max={headerAudioDuration || 100}
                      step={0.1}
                      onValueChange={handleHeaderSeek}
                      className="flex-grow"
                    />
                    <span className="text-xs font-mono w-8">
                      {formatTime(headerAudioDuration)}
                    </span>
                  </div>
                </div>
              </div>
            ) : uploadedFile ? (
              <div className="flex flex-col md:flex-row items-start md:items-end justify-between w-full gap-4">
                <div className="flex items-end gap-3 flex-1 min-w-0">
                  <div className="flex-shrink-0 bg-muted/30 rounded-md p-3 border border-black dark:border-white">
                    <FileAudio className="h-6 w-6" />
                  </div>
                  <div className="flex flex-col justify-between min-w-0">
                    <h3 className="font-semibold truncate">
                      {uploadedFile.name}
                    </h3>
                    <p className="text-sm font-medium text-muted-foreground truncate">
                      {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB •{" "}
                      {uploadedFile.type}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full md:w-[300px] flex-shrink-0">
                  <Button
                    className={`rounded-full transition-transform hover:scale-105 h-8 w-8 ${
                      isHeaderPlaying
                        ? "bg-black text-white hover:bg-black/90 dark:bg-white dark:text-black dark:hover:bg-white/90"
                        : "bg-white text-black border border-black hover:bg-black hover:text-white dark:bg-black dark:text-white dark:border-white dark:hover:bg-white dark:hover:text-black"
                    }`}
                    onClick={toggleHeaderPlayback}
                  >
                    {isHeaderPlaying ? (
                      <Pause className="h-3 w-3" />
                    ) : (
                      <Play className="h-3 w-3" />
                    )}
                  </Button>

                  <div className="flex items-center gap-2 bg-white dark:bg-black border border-black dark:border-white rounded-full px-3 py-1.5 flex-grow">
                    <span className="text-xs font-mono whitespace-nowrap">
                      {formatTime(headerCurrentTime)}
                    </span>
                    <Slider
                      value={[headerCurrentTime]}
                      min={0}
                      max={headerAudioDuration || 100}
                      step={0.1}
                      onValueChange={handleHeaderSeek}
                      className="flex-grow"
                    />
                    <span className="text-xs font-mono w-8">
                      {formatTime(headerAudioDuration)}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <Button variant="outline" size="sm" className="h-10" asChild>
                <label className="cursor-pointer flex items-center">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Audio
                  <input
                    type="file"
                    className="hidden"
                    accept="audio/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        separateAudio(file);
                      }
                    }}
                    disabled={isLoading}
                  />
                </label>
              </Button>
            )}
          </CardTitle>
        </CardHeader>
      )}

      <CardContent className="p-4 space-y-4 bg-transparent">
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <CircleLoader />
          </div>
        ) : error ? (
          <div className="space-y-4">
            <Alert variant="destructive" className="animate-in fade-in-50">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <Button
              onClick={processAudio}
              className="border border-black/20 dark:border-white/20 bg-transparent hover:bg-black/5 dark:hover:bg-white/5 text-black dark:text-white"
            >
              Try Again
            </Button>
          </div>
        ) : !audioSource ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-4 text-center">
            <div className="bg-muted/20 rounded-full p-4">
              <Music className="h-12 w-12 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">
              No audio selected for conversion.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2 w-full">
              <Settings className="h-5 w-5 flex-shrink-0 text-black dark:text-white" />
              <Select
                value={selectedModel}
                onValueChange={(value) => setSelectedModel(value as ModelType)}
                disabled={isLoading}
              >
                <SelectTrigger className="w-full min-w-0 border-black/50 dark:border-white/50">
                  <SelectValue
                    placeholder="Select model"
                    className="truncate"
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="advanced">Advanced</SelectItem>
                  <SelectItem value="basic">Basic</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-4 w-full md:flex-row flex-col">
              <div className="flex items-center gap-2 w-full">
                <KeyboardMusic className="h-5 w-5 flex-shrink-0 text-black dark:text-white" />
                <Select
                  value={selectedInstrument}
                  onValueChange={setSelectedInstrument}
                  disabled={isLoading}
                >
                  <SelectTrigger className="w-full min-w-0 border-black/50 dark:border-white/50">
                    <SelectValue
                      placeholder="Select an instrument"
                      className="truncate"
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {INSTRUMENTS.map((instrument) => (
                      <SelectItem key={instrument.id} value={instrument.id}>
                        {instrument.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedModel === "advanced" && (
                <div className="flex items-center gap-2 w-full">
                  <Speaker className="h-5 w-5 flex-shrink-0 text-black dark:text-white" />
                  <Select
                    value={selectedComposer}
                    onValueChange={setSelectedComposer}
                    disabled={isLoading}
                  >
                    <SelectTrigger className="w-full min-w-0 border-black/50 dark:border-white/50">
                      <SelectValue placeholder="Select a composer style" />
                    </SelectTrigger>
                    <SelectContent>
                      {COMPOSER_OPTIONS.map((composer) => (
                        <SelectItem key={composer.id} value={composer.id}>
                          {composer.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {!isProcessed && selectedModel === "basic" && (
              <Accordion type="single" collapsible className="mb-4">
                <AccordionItem
                  value="processing-settings"
                  className="border-none"
                >
                  <AccordionTrigger className="py-2 px-3 rounded-md hover:bg-muted/50 transition-colors">
                    <div className="flex items-center">
                      <Settings className="h-4 w-4 mr-2" />
                      <span className="text-sm font-medium">
                        Processing Settings
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4 pt-2 px-2 border border-black/10 dark:border-white/10 rounded-md p-4 mt-2">
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <Label htmlFor="onset-threshold" className="text-sm">
                            Onset Threshold:{" "}
                            {processingParams.onset_threshold?.toFixed(2) ||
                              "0.4"}
                          </Label>
                        </div>
                        <Slider
                          id="onset-threshold"
                          value={[processingParams.onset_threshold ?? 0.4]}
                          min={0.1}
                          max={1.0}
                          step={0.05}
                          onValueChange={(value) =>
                            handleParamChange("onset_threshold", value[0])
                          }
                        />
                        <div className="text-xs text-muted-foreground">
                          Controls how sensitive the detection is to note
                          starts. Lower values detect more notes.
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <Label htmlFor="frame-threshold" className="text-sm">
                            Frame Threshold:{" "}
                            {processingParams.frame_threshold?.toFixed(2) ||
                              "0.2"}
                          </Label>
                        </div>
                        <Slider
                          id="frame-threshold"
                          value={[processingParams.frame_threshold ?? 0.2]}
                          min={0.1}
                          max={1.0}
                          step={0.05}
                          onValueChange={(value) =>
                            handleParamChange("frame_threshold", value[0])
                          }
                        />
                        <div className="text-xs text-muted-foreground">
                          Threshold for detecting pitches in each frame. Lower
                          values capture more subtle sounds.
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <Label htmlFor="min-note-length" className="text-sm">
                            Minimum Note Length (ms):{" "}
                            {processingParams.minimum_note_length || "100"}
                          </Label>
                        </div>
                        <Slider
                          id="min-note-length"
                          value={[processingParams.minimum_note_length ?? 100]}
                          min={10}
                          max={300}
                          step={10}
                          onValueChange={(value) =>
                            handleParamChange("minimum_note_length", value[0])
                          }
                        />
                        <div className="text-xs text-muted-foreground">
                          Notes shorter than this will be filtered out. Helps
                          reduce noise and false detections.
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="min-freq" className="text-sm">
                            Minimum Frequency (Hz)
                          </Label>
                          <Input
                            id="min-freq"
                            type="number"
                            placeholder="Optional"
                            value={processingParams.minimum_frequency || ""}
                            onChange={(e) =>
                              handleParamChange(
                                "minimum_frequency",
                                e.target.value ? Number(e.target.value) : null
                              )
                            }
                            className="h-9 border-black/20 dark:border-white/20"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="max-freq" className="text-sm">
                            Maximum Frequency (Hz)
                          </Label>
                          <Input
                            id="max-freq"
                            type="number"
                            placeholder="Optional"
                            value={processingParams.maximum_frequency || ""}
                            onChange={(e) =>
                              handleParamChange(
                                "maximum_frequency",
                                e.target.value ? Number(e.target.value) : null
                              )
                            }
                            className="h-9 border-black/20 dark:border-white/20"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="tempo-override" className="text-sm">
                          Tempo Override (BPM)
                        </Label>
                        <Input
                          id="tempo-override"
                          type="number"
                          placeholder="Let system detect tempo"
                          value={processingParams.tempo_override || ""}
                          onChange={(e) =>
                            handleParamChange(
                              "tempo_override",
                              e.target.value ? Number(e.target.value) : null
                            )
                          }
                          className="h-9 border-black/20 dark:border-white/20"
                        />
                        <div className="text-xs text-muted-foreground">
                          Leave empty to let the system detect tempo
                          automatically.
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Switch
                          id="pitch-bends"
                          checked={
                            processingParams.multiple_pitch_bends ?? false
                          }
                          onCheckedChange={(checked) =>
                            handleParamChange("multiple_pitch_bends", checked)
                          }
                        />
                        <Label htmlFor="pitch-bends" className="text-sm">
                          Enable Pitch Bends
                        </Label>
                      </div>

                      <div className="flex justify-end mt-4">
                        <Button
                          onClick={processAudio}
                          disabled={isLoading}
                          className="border border-black/20 dark:border-white/20 bg-transparent hover:bg-black/5 dark:hover:bg-white/5 text-black dark:text-white"
                        >
                          Apply Settings
                        </Button>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            )}

            {musicData && musicData.notes && musicData.notes.length > 0 ? (
              <div>
                <div className="w-full">
                  <TonePlayer
                    musicData={musicData}
                    midiData={midiData}
                    selectedModel={selectedModel}
                    selectedInstrument={selectedInstrument}
                  />
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 space-y-4 text-center">
                <div className="bg-muted/20 rounded-full p-4">
                  <Music className="h-12 w-12 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-muted-foreground">
                    No notes data available. Please process the audio first.
                  </p>
                  {!isProcessed && (
                    <Button
                      onClick={processAudio}
                      disabled={isLoading}
                      className="mt-4 border border-black/20 dark:border-white/20 bg-transparent hover:bg-black/5 dark:hover:bg-white/5 text-black dark:text-white"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        "Process Now"
                      )}
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
