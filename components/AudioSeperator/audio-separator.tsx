"use client";

import React from "react";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Play,
  Pause,
  Download,
  Music,
  Loader2,
  FileMusic,
  Upload,
  Mic,
  FileAudio,
  SpellCheck2,
  Volume2,
} from "lucide-react";
import type { DeezerTrack } from "@/lib/deezer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import AudioConverter from "../ConvertToNotes/audio-converter";
import Image from "next/image";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Settings } from "lucide-react";
import HamsterLoader from "../loaders/hamster-loader";
import { separateAudio } from "@/actions/separateAudio";
import { transcribeAudio } from "@/actions/transcribeAudio";

interface AudioSource {
  name: string;
  color: string;
  icon: React.ReactNode;
  audioUrl?: string;
  audioData?: Uint8Array;
}

interface AudioSeparatorProps {
  uploadedFile?: File | null;
  track?: DeezerTrack | null;
  featured?: boolean;
  preloadedStems?: Record<string, AudioSource>;
}

interface LyricsSegment {
  text: string;
  start: number;
  end: number;
  words: {
    text: string;
    start: number;
    end: number;
  }[];
}

interface LyricsData {
  text: string;
  segments: LyricsSegment[];
}

export default function AudioSeparator({
  uploadedFile,
  track,
  featured = false,
  preloadedStems,
}: AudioSeparatorProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stems, setStems] = useState<Record<string, AudioSource>>(
    preloadedStems || {}
  );
  const [playingStems, setPlayingStems] = useState<Set<string>>(new Set());
  const [pausedStems, setPausedStems] = useState<Set<string>>(new Set());
  const audioRefs = useRef<Record<string, HTMLAudioElement>>({});
  const [isTranscribing, setIsTranscribing] = useState<boolean>(false);
  const [lyrics, setLyrics] = useState<LyricsData | null>(null);
  const [showLyrics, setShowLyrics] = useState<boolean>(false);
  const [currentLyricTime, setCurrentLyricTime] = useState(0);
  const lyricsIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [stemVolumes, setStemVolumes] = useState<Record<string, number>>({});
  const [stemCurrentTime, setStemCurrentTime] = useState(0);
  const [headerCurrentTime, setHeaderCurrentTime] = useState(0);
  const timeUpdateRef = useRef<((time: number) => void) | null>(null);

  const [selectedOption, setSelectedOption] = useState<string>("spleeter-2");

  const modelOptions = [
    {
      id: "spleeter-2",
      name: "Basic (Vocals & Others)",
      model: "SPLEETER",
      stems: 2,
      description: "Simple separation into vocals and accompaniment",
    },
    {
      id: "spleeter-4",
      name: "Basic + (Vocals, Drums, Bass, Other)",
      model: "SPLEETER",
      stems: 4,
      description: "Separate into vocals, drums, bass, and other instruments",
    },
    {
      id: "spleeter-5",
      name: "Basic Extended (Vocals, Drums, Bass, Piano, Other)",
      model: "SPLEETER",
      stems: 5,
      description: "Advanced separation with piano as a separate stem",
    },
    {
      id: "demucs",
      name: "ADVANCED SEPARATION (Vocals, Drums, Bass, Other)",
      model: "DEMUCS",
      description: "High-quality separation using Meta's Demucs model",
    },
  ];

  const stemTypes = {
    other: {
      name: "Instrumental",
      color: "bg-green-500 hover:bg-green-600",
      icon: <Music className="h-4 w-4" />,
      filename: "other.mp3",
    },
    accompaniment: {
      name: "Instrumental",
      color: "bg-green-500 hover:bg-green-600",
      icon: <Music className="h-4 w-4" />,
      filename: "accompaniment.mp3",
    },
    vocals: {
      name: "Vocals",
      color: "bg-purple-500 hover:bg-purple-600",
      icon: <Mic className="h-4 w-4" />,
      filename: "vocals.mp3",
    },
    drums: {
      name: "Drums",
      color: "bg-red-500 hover:bg-red-600",
      icon: <Music className="h-4 w-4" />,
      filename: "drums.mp3",
    },
    bass: {
      name: "Bass",
      color: "bg-blue-500 hover:bg-blue-600",
      icon: <Music className="h-4 w-4" />,
      filename: "bass.mp3",
    },
    piano: {
      name: "Piano",
      color: "bg-green-500 hover:bg-green-600",
      icon: <Music className="h-4 w-4" />,
      filename: "piano.mp3",
    },
  };

  // Audio player state
  const [isHeaderPlaying, setIsHeaderPlaying] = useState(false);
  const [headerAudioDuration, setHeaderAudioDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const headerAudioRef = useRef<HTMLAudioElement | null>(null);
  const headerAudioIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Single useEffect for processing audio
  useEffect(() => {
    const processAudio = async () => {
      if (!track && !uploadedFile) return;
      if (preloadedStems) return;

      setIsLoading(true);
      setError(null);
      setStems({});
      setLyrics(null);

      try {
        if (track) {
          const response = await fetch(track.preview);
          if (!response.ok) {
            throw new Error(`Failed to fetch audio: ${response.statusText}`);
          }
          const blob = await response.blob();
          const file = new File([blob], `${track.title}.mp3`, {
            type: "audio/mpeg",
          });
          await handleSeparateAudio(file);
        } else if (uploadedFile) {
          await handleSeparateAudio(uploadedFile);
        }
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "Unknown error processing audio"
        );
      } finally {
        setIsLoading(false);
      }
    };

    processAudio();
  }, [track, uploadedFile, selectedOption, preloadedStems]);

  // Initialize header audio player
  useEffect(() => {
    if (!headerAudioRef.current) {
      headerAudioRef.current = new Audio();

      // Set audio source
      if (track) {
        headerAudioRef.current.src = track.preview;
      } else if (uploadedFile) {
        headerAudioRef.current.src = URL.createObjectURL(uploadedFile);
      }

      // Add event listeners
      headerAudioRef.current.addEventListener("loadedmetadata", () => {
        if (headerAudioRef.current) {
          setHeaderAudioDuration(headerAudioRef.current.duration);
        }
      });

      headerAudioRef.current.addEventListener("timeupdate", () => {
        if (headerAudioRef.current) {
          setHeaderCurrentTime(headerAudioRef.current.currentTime);
        }
      });

      headerAudioRef.current.addEventListener("ended", () => {
        setIsHeaderPlaying(false);
        setHeaderCurrentTime(0);
        if (headerAudioIntervalRef.current) {
          clearInterval(headerAudioIntervalRef.current);
        }
      });

      // Set volume
      headerAudioRef.current.volume = volume;
    }

    return () => {
      if (headerAudioRef.current) {
        headerAudioRef.current.pause();
        headerAudioRef.current.removeEventListener("loadedmetadata", () => {});
        headerAudioRef.current.removeEventListener("timeupdate", () => {});
        headerAudioRef.current.removeEventListener("ended", () => {});
      }
    };
  }, [track, uploadedFile]);

  // Update volume when it changes
  useEffect(() => {
    if (headerAudioRef.current) {
      headerAudioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  const handleSeparateAudio = async (file: File) => {
    setIsLoading(true);
    setError(null);
    setStems({});
    setLyrics(null);

    const selectedModelOption = modelOptions.find(
      (option) => option.id === selectedOption
    );

    if (!selectedModelOption) {
      setError("Invalid model selection");
      setIsLoading(false);
      return;
    }

    try {
      // Prepare form data for /api/separate
      const formData = new FormData();
      formData.append("file", file);
      formData.append("model", selectedModelOption.model);
      if (selectedModelOption.stems) {
        formData.append("stems", selectedModelOption.stems.toString());
      }

      const response = await fetch("/api/separate", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        setError("Failed to separate audio");
        setIsLoading(false);
        return;
      }

      // Get the zip as arrayBuffer
      const zipBuffer = await response.arrayBuffer();
      // Use JSZip on the client to extract stems
      const JSZip = (await import("jszip")).default;
      const zip = new JSZip();
      const zipContent = await zip.loadAsync(zipBuffer);
      const processedStems: Record<string, AudioSource> = {};
      for (const [key, value] of Object.entries(stemTypes)) {
        const audioFile = zipContent.file(value.filename);
        if (audioFile) {
          const uint8 = new Uint8Array(await audioFile.async("uint8array"));
          const blob = new Blob([uint8], { type: "audio/mp3" });
          const audioUrl = URL.createObjectURL(blob);
          processedStems[key] = {
            name: value.name,
            color: value.color,
            icon: value.icon,
            audioUrl: audioUrl,
            audioData: uint8,
          };
        }
      }
      setStems(processedStems);
    } catch (error) {
      console.error("Error separating audio:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Unknown error separating audio"
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Set up the time update handler
  useEffect(() => {
    timeUpdateRef.current = (time: number) => {
      setStemCurrentTime(time);
      setCurrentLyricTime(time);
    };
  }, []);

  const togglePlayback = (audioId: string) => {
    const audioSource = stems[audioId];
    if (!audioSource || !audioSource.audioUrl) return;

    if (playingStems.has(audioId)) {
      // Pause this stem
      if (audioRefs.current[audioId]) {
        audioRefs.current[audioId].pause();
      }
      setPlayingStems((prev) => {
        const next = new Set(prev);
        next.delete(audioId);
        return next;
      });
      setPausedStems((prev) => {
        const next = new Set(prev);
        next.add(audioId);
        return next;
      });
    } else {
      // Stop header audio if playing
      if (headerAudioRef.current && isHeaderPlaying) {
        headerAudioRef.current.pause();
        setIsHeaderPlaying(false);
        if (headerAudioIntervalRef.current) {
          clearInterval(headerAudioIntervalRef.current);
          headerAudioIntervalRef.current = null;
        }
      }

      // Create or get audio element for this stem
      if (!audioRefs.current[audioId]) {
        audioRefs.current[audioId] = new Audio(audioSource.audioUrl);

        // Add timeupdate event listener
        audioRefs.current[audioId].addEventListener("timeupdate", () => {
          if (timeUpdateRef.current) {
            timeUpdateRef.current(audioRefs.current[audioId].currentTime);
          }
        });

        audioRefs.current[audioId].onended = () => {
          audioRefs.current[audioId].currentTime = 0;
          setPlayingStems((prev) => {
            const next = new Set(prev);
            next.delete(audioId);
            return next;
          });
          setPausedStems((prev) => {
            const next = new Set(prev);
            next.add(audioId);
            return next;
          });
        };
      }

      // If this is the first stem to play, reset the time
      if (playingStems.size === 0) {
        setStemCurrentTime(0);
        setCurrentLyricTime(0);
      }

      // Sync with other playing stems
      if (playingStems.size > 0) {
        const firstPlayingStem = Array.from(playingStems)[0];
        if (firstPlayingStem && audioRefs.current[firstPlayingStem]) {
          audioRefs.current[audioId].currentTime =
            audioRefs.current[firstPlayingStem].currentTime;
        }
      }

      // Play the stem
      audioRefs.current[audioId].play().catch((err) => {
        console.error("Error playing audio:", err);
        setError("Failed to play audio");
      });

      setPlayingStems((prev) => {
        const next = new Set(prev);
        next.add(audioId);
        return next;
      });
      setPausedStems((prev) => {
        const next = new Set(prev);
        next.delete(audioId);
        return next;
      });
    }
  };

  const toggleHeaderPlayback = () => {
    if (!headerAudioRef.current) return;

    if (isHeaderPlaying) {
      // Pause playback
      headerAudioRef.current.pause();
      setIsHeaderPlaying(false);
      if (headerAudioIntervalRef.current) {
        clearInterval(headerAudioIntervalRef.current);
        headerAudioIntervalRef.current = null;
      }
    } else {
      // Stop any stem playback
      Object.values(audioRefs.current).forEach((audio) => {
        audio.pause();
      });
      setPlayingStems(new Set());
      setPausedStems(new Set());
      setStemCurrentTime(0);

      // Start playback
      headerAudioRef.current.play().catch((err) => {
        console.error("Error playing audio:", err);
        setError("Failed to play audio");
      });

      setIsHeaderPlaying(true);
    }
  };

  const handleHeaderSeek = (value: number[]) => {
    const newTime = value[0];
    setHeaderCurrentTime(newTime);

    // Update header audio if playing
    if (headerAudioRef.current && isHeaderPlaying) {
      headerAudioRef.current.currentTime = newTime;
    }
  };

  const handleStemSeek = (value: number[]) => {
    const newTime = value[0];
    setStemCurrentTime(newTime);
    setCurrentLyricTime(newTime);

    // Update all playing stems
    Object.entries(audioRefs.current).forEach(([id, audio]) => {
      if (playingStems.has(id)) {
        audio.currentTime = newTime;
      }
    });
  };

  const generateLyrics = async () => {
    let audioBlob: Blob | null = null;

    if (stems["vocals"] && stems["vocals"].audioUrl) {
      try {
        const response = await fetch(stems["vocals"].audioUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch vocals: ${response.statusText}`);
        }
        audioBlob = await response.blob();
      } catch (error) {
        console.error("Error fetching vocals for transcription:", error);
        setError("Failed to fetch vocals for transcription");
        return;
      }
    } else if (uploadedFile) {
      audioBlob = uploadedFile;
    } else if (track && track.preview) {
      try {
        const response = await fetch(track.preview);
        if (!response.ok) {
          throw new Error(`Failed to fetch track: ${response.statusText}`);
        }
        audioBlob = await response.blob();
      } catch (error) {
        console.error("Error fetching track for transcription:", error);
        setError("Failed to fetch track for transcription");
        return;
      }
    } else {
      setError("No audio source found to transcribe");
      return;
    }

    setIsTranscribing(true);
    setError(null);

    try {
      // Prepare form data for /api/transcribe
      const formData = new FormData();
      formData.append("file", audioBlob, "audio.mp3");
      const response = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        setError("Failed to transcribe lyrics");
        setIsTranscribing(false);
        return;
      }
      const data = await response.json();
      setLyrics(data);
      setShowLyrics(true);
    } catch (error) {
      console.error("Error transcribing lyrics:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Unknown error transcribing lyrics"
      );
    } finally {
      setIsTranscribing(false);
    }
  };

  const cancelRequest = () => {
    setIsLoading(false);
    setError("Request cancelled");
  };

  const [showProcessedStem, setShowProcessedStem] = useState<string | null>(
    null
  );

  const toggleProcessedStem = (audioId: string) => {
    setShowProcessedStem(showProcessedStem === audioId ? null : audioId);
  };

  const handleVolumeChange = (audioId: string, value: number) => {
    if (audioRefs.current[audioId]) {
      audioRefs.current[audioId].volume = value;
    }
    setStemVolumes((prev) => ({
      ...prev,
      [audioId]: value,
    }));
  };

  // Cleanup function
  useEffect(() => {
    return () => {
      Object.values(audioRefs.current).forEach((audio) => {
        audio.pause();
      });
      audioRefs.current = {};
      if (lyricsIntervalRef.current) {
        clearInterval(lyricsIntervalRef.current);
      }
      if (headerAudioIntervalRef.current) {
        clearInterval(headerAudioIntervalRef.current);
      }
    };
  }, []);

  return (
    <Card className="w-full border border-black dark:border-white overflow-hidden bg-transparent">
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
                      handleSeparateAudio(file);
                    }
                  }}
                  disabled={isLoading}
                />
              </label>
            </Button>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="p-4 space-y-4">
        {!featured && (
          <div className="flex items-center gap-2 w-full">
            <Settings className="h-5 w-5 flex-shrink-0 text-black dark:text-white" />
            <Select
              value={selectedOption}
              onValueChange={setSelectedOption}
              disabled={isLoading}
            >
              <SelectTrigger className="w-full min-w-0 border-black dark:border-white bg-white dark:bg-black">
                <SelectValue placeholder="Select model" className="truncate" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Models</SelectLabel>
                  {modelOptions.map((model) => (
                    <SelectItem key={model.id} value={model.id}>
                      {model.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        )}

        {error && (
          <Alert variant="destructive" className="animate-in fade-in-50">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {isLoading && (
          <div className="flex justify-center items-center py-12">
            <HamsterLoader image={track?.album.cover_medium} size={20} />
          </div>
        )}

        {Object.keys(stems).length > 0 && (
          <div className="space-y-3">
            <div className="flex justify-between items-end">
              <h4 className="font-medium text-sm">Separated Stems</h4>

              <Button
                variant={lyrics ? "secondary" : "outline"}
                size="sm"
                onClick={
                  lyrics ? () => setShowLyrics(!showLyrics) : generateLyrics
                }
                disabled={isTranscribing || Object.keys(stems).length === 0}
                className={`h-8 flex items-center justify-center gap-1 border border-black/50 dark:border-white/50 text-black dark:text-white hover:text-white hover:dark:text-black bg-transparent hover:bg-black dark:hover:bg-white transition-colors`}
              >
                {isTranscribing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <SpellCheck2 className="h-4 w-4" />
                )}
                <span>
                  {isTranscribing
                    ? "Generating Lyrics..."
                    : lyrics
                    ? showLyrics
                      ? "Hide Lyrics"
                      : "Show Lyrics"
                    : "Generate Lyrics"}
                </span>
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Object.entries(stems).map(([audioId, audioSource]) => (
                <div
                  key={audioId}
                  className="border border-black dark:border-white rounded-lg overflow-hidden transition-all"
                >
                  <div className="flex flex-col">
                    <div className="flex items-center justify-between p-3">
                      <div className="flex items-center">
                        <div className="w-9 h-9 rounded-full border border-black dark:border-white flex items-center justify-center mr-3">
                          {audioSource.icon}
                        </div>
                        <span className="font-semibold text-lg">
                          {audioSource.name}
                        </span>
                      </div>

                      <Button
                        variant="outline"
                        size="icon"
                        className={`h-9 w-9 rounded-full transition-colors ${
                          playingStems.has(audioId) || pausedStems.has(audioId)
                            ? "bg-black text-white dark:bg-white dark:text-black border border-black dark:border-white"
                            : "border border-black/50 dark:border-white/50 bg-transparent text-black dark:text-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black"
                        }`}
                        onClick={() => togglePlayback(audioId)}
                      >
                        {playingStems.has(audioId) ? (
                          <Pause className="h-4 w-4" />
                        ) : pausedStems.has(audioId) ? (
                          <Play className="h-4 w-4" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                      </Button>
                    </div>

                    <div className="flex items-center gap-3 bg-white dark:bg-black border-y border-black dark:border-white px-3 py-1.5">
                      <span className="text-xs font-mono whitespace-nowrap">
                        {formatTime(stemCurrentTime)}
                      </span>
                      <Slider
                        value={[stemCurrentTime]}
                        min={0}
                        max={headerAudioDuration}
                        step={0.1}
                        onValueChange={handleStemSeek}
                        className="flex-grow"
                      />
                      <span className="text-xs font-mono w-8">
                        {formatTime(headerAudioDuration)}
                      </span>
                    </div>

                    <div className="p-3 flex justify-between items-center gap-2">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-9 border border-black/50 dark:border-white/50 text-black dark:text-white hover:text-white hover:dark:text-black bg-transparent hover:bg-black dark:hover:bg-white transition-colors"
                          asChild
                        >
                          <a
                            href={audioSource.audioUrl}
                            download={`${audioSource.name.toLowerCase()}.mp3`}
                            title={`Download ${audioSource.name}`}
                            className="flex items-center gap-2"
                            onClick={(e) => {
                              if (audioSource.audioData) {
                                const uint8 = new Uint8Array(
                                  audioSource.audioData as any
                                );
                                const blob = new Blob([uint8], {
                                  type: "audio/mp3",
                                });
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement("a");
                                a.href = url;
                                a.download = `${audioSource.name.toLowerCase()}.mp3`;
                                document.body.appendChild(a);
                                a.click();
                                document.body.removeChild(a);
                                URL.revokeObjectURL(url);
                                e.preventDefault();
                              }
                            }}
                          >
                            <Download className="h-4 w-4" />
                            <span className="hidden sm:inline">Download</span>
                          </a>
                        </Button>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleProcessedStem(audioId)}
                        className={`h-9 border w-full border-black/50 dark:border-white/50 text-black dark:text-white hover:text-white hover:dark:text-black bg-transparent hover:bg-black dark:hover:bg-white transition-colors`}
                      >
                        <FileMusic className="h-4 w-4" />
                        <span>Process</span>
                      </Button>
                    </div>

                    <div className="px-3 pb-3 flex items-center gap-2">
                      <Volume2 className="h-4 w-4 text-muted-foreground" />
                      <Slider
                        value={[stemVolumes[audioId] ?? 1]}
                        min={0}
                        max={1}
                        step={0.01}
                        onValueChange={(value) =>
                          handleVolumeChange(audioId, value[0])
                        }
                        className="flex-grow"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {lyrics && showLyrics && (
          <LyricsDisplay
            lyrics={lyrics}
            currentLyricTime={currentLyricTime}
            currentlyPlaying={
              playingStems.size > 0 ? Object.keys(stems)[0] : null
            }
            isHeaderPlaying={isHeaderPlaying}
            headerAudioDuration={headerAudioDuration}
            formatTime={formatTime}
          />
        )}

        {showProcessedStem && (
          <div className="mt-6 animate-in slide-in-from-bottom-5">
            <AudioConverter
              uploadedFile={uploadedFile}
              stemKey={showProcessedStem}
              track={track}
              showCardHeader={false}
              audioUrl={stems[showProcessedStem]?.audioUrl}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Helper function to format time as MM:SS
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

interface LyricsDisplayProps {
  lyrics: LyricsData;
  currentLyricTime: number;
  currentlyPlaying: string | null;
  isHeaderPlaying: boolean;
  headerAudioDuration: number;
  formatTime: (seconds: number) => string;
}
const LyricsDisplay: React.FC<LyricsDisplayProps> = ({
  lyrics,
  currentLyricTime,
  currentlyPlaying,
  isHeaderPlaying,
  headerAudioDuration,
  formatTime,
}) => {
  const scrollViewportRef = useRef<HTMLDivElement | null>(null);
  const activeSegmentRef = useRef<HTMLDivElement | null>(null);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleUserScroll = () => {
    setIsUserScrolling(true);

    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    scrollTimeoutRef.current = setTimeout(() => {
      setIsUserScrolling(false);
    }, 1500);
  };

  useEffect(() => {
    if (
      activeSegmentRef.current &&
      scrollViewportRef.current &&
      !isUserScrolling
    ) {
      const segmentElement = activeSegmentRef.current;
      const viewport = scrollViewportRef.current;

      const segmentRect = segmentElement.getBoundingClientRect();

      const scrollTop =
        segmentElement.offsetTop -
        viewport.offsetTop -
        viewport.clientHeight / 2 +
        segmentRect.height / 2;

      viewport.scrollTo({
        top: scrollTop,
        behavior: "smooth",
      });
    }
  }, [currentLyricTime, isUserScrolling]);

  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="mt-6">
      <div
        className="flex flex-col items-center text-center max-h-[200px] overflow-y-auto no-scrollbar"
        ref={scrollViewportRef}
        onScroll={handleUserScroll}
      >
        {lyrics.segments.map((segment, index) => {
          const isActiveSegment =
            currentLyricTime >= segment.start &&
            currentLyricTime <= segment.end &&
            (currentlyPlaying !== null || isHeaderPlaying);

          return (
            <div
              key={index}
              ref={isActiveSegment ? activeSegmentRef : null}
              className={`transition-all duration-300 max-w-[80%] mx-auto my-1 ${
                isActiveSegment
                  ? "text-foreground scale-110 transform"
                  : "text-muted-foreground opacity-70"
              }`}
            >
              <div className="text-base leading-relaxed whitespace-pre-wrap break-words">
                {segment.words.map((word, wordIndex) => {
                  const isActiveWord =
                    currentLyricTime >= word.start &&
                    currentLyricTime <= word.end &&
                    (currentlyPlaying !== null || isHeaderPlaying);

                  // Add natural spacing between words
                  const isLastWord = wordIndex === segment.words.length - 1;
                  const shouldAddSpace =
                    !isLastWord && !word.text.endsWith("-");
                  const isPunctuation = /[.,!?;:]/.test(word.text);

                  return (
                    <React.Fragment key={wordIndex}>
                      <span
                        className={cn(
                          "transition-all duration-300 inline-block relative",
                          isActiveWord
                            ? "text-primary after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-full after:h-[2px] after:bg-primary after:origin-left after:scale-x-100 after:transition-transform after:duration-300"
                            : "text-muted-foreground after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-full after:h-[2px] after:bg-primary after:origin-left after:scale-x-0 after:transition-transform after:duration-300"
                        )}
                      >
                        {word.text}
                      </span>
                      {shouldAddSpace && (
                        <span className={isPunctuation ? "mr-1" : ""}> </span>
                      )}
                      {/* Add line breaks at natural sentence endings */}
                      {!isLastWord && /[.!?]$/.test(word.text) && <br />}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex justify-center text-xs text-muted-foreground">
        {formatTime(currentLyricTime)} / {formatTime(headerAudioDuration)}{" "}
      </div>
    </div>
  );
};
