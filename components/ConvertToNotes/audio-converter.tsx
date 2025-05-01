"use client";

import type React from "react";

import { useState, useEffect, useRef } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Music, Loader2, FileAudio, KeyboardMusic } from "lucide-react";
import { useAudioProcessing } from "@/contexts/audio-processing-context";
import * as Tone from "tone";
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
import { Play, Pause, Square, Download, Volume2, Settings } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { NoteVisualization } from "./NoteVisualization";
import { DeezerTrack } from "@/lib/deezer";
import { INSTRUMENTS, type Instrument } from "@/lib/instruments";
import Image from "next/image";

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
  const { getAudioMusicData, markAudioAsProcessed } = useAudioProcessing();

  const [audioSource, setAudioSource] = useState<AudioSource | null>(null);
  const [audioId, setAudioId] = useState<string | null>(null);

  // Initialize musicData from context if available
  const initialMusicData =
    isProcessed && audioId ? getAudioMusicData(audioId) : null;
  const [musicData, setMusicData] = useState<MusicData | null>(
    initialMusicData
  );

  const isInitialRender = useRef(true);
  const [isLoading, setIsLoading] = useState(!isProcessed);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [selectedInstrument, setSelectedInstrument] = useState(
    INSTRUMENTS[0].id
  );
  const [isInstrumentLoaded, setIsInstrumentLoaded] = useState(false);
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

  const sampler = useRef<Tone.Sampler | null>(null);
  const notesRef = useRef<Tone.Part | null>(null);
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  // Track-based audio
  useEffect(() => {
    if (track) {
      setIsLoading(true);
      setError(null);

      // Create a unique ID for this audio
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

  // Uploaded file
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

      // Clean up the URL when component unmounts
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
    if (!isProcessed && audioSource && !initialMusicData) {
      processAudio();
    }
  }, [isProcessed, audioSource, initialMusicData]);

  // Initialize the selected instrument
  useEffect(() => {
    if (!musicData) return;

    setIsInstrumentLoaded(false);

    // Find the selected instrument config
    const instrumentConfig = INSTRUMENTS.find(
      (inst) => inst.id === selectedInstrument
    );
    if (!instrumentConfig) return;

    // Dispose previous sampler if it exists
    if (sampler.current) {
      sampler.current.dispose();
    }

    if (instrumentConfig.type === "sampler") {
      // Create a new sampler with the selected instrument
      const newSampler = new Tone.Sampler({
        urls: instrumentConfig.urls,
        baseUrl: instrumentConfig.baseUrl,
        onload: () => {
          setIsInstrumentLoaded(true);
          console.log(`${instrumentConfig.name} loaded`);
        },
        onerror: (err: Error) => {
          console.error("Error loading instrument:", err);
          setError(`Failed to load ${instrumentConfig.name} samples`);
        },
      }).toDestination();
      sampler.current = newSampler;
    } else if (instrumentConfig.type === "synth") {
      // Create a new synth
      const newSynth = new Tone.Synth(instrumentConfig.options).toDestination();
      sampler.current = newSynth as unknown as Tone.Sampler;
      setIsInstrumentLoaded(true);
    } else if (instrumentConfig.type === "amSynth") {
      // Create a new AM synth
      const newSynth = new Tone.AMSynth(
        instrumentConfig.options
      ).toDestination();
      sampler.current = newSynth as unknown as Tone.Sampler;
      setIsInstrumentLoaded(true);
    } else if (instrumentConfig.type === "fmSynth") {
      // Create a new FM synth
      const newSynth = new Tone.FMSynth(
        instrumentConfig.options
      ).toDestination();
      sampler.current = newSynth as unknown as Tone.Sampler;
      setIsInstrumentLoaded(true);
    }

    // Set the volume
    if (sampler.current) {
      sampler.current.volume.value = Tone.gainToDb(volume);
    }

    // Clean up on unmount
    return () => {
      if (sampler.current) {
        sampler.current.dispose();
      }
    };
  }, [selectedInstrument, musicData]);

  // Update volume when it changes
  useEffect(() => {
    if (sampler.current) {
      sampler.current.volume.value = Tone.gainToDb(volume);
    }
  }, [volume]);

  // Set up the notes for playback
  useEffect(() => {
    if (!musicData || !isInstrumentLoaded || !sampler.current) return;

    // Dispose previous part if it exists
    if (notesRef.current) {
      notesRef.current.dispose();
    }

    // Create a new part with the notes
    notesRef.current = new Tone.Part(
      (time, note) => {
        // Convert MIDI pitch to note name
        const noteName = Tone.Frequency(note.pitch, "midi").toNote();

        // Calculate duration in seconds
        const duration = note.end - note.start;

        // Play the note
        if (sampler.current) {
          sampler.current.triggerAttackRelease(
            noteName,
            duration,
            time,
            note.velocity
          );
        }
      },
      musicData.notes.map((note) => ({
        time: note.start,
        ...note,
      }))
    ).start(0);

    // Set the tempo
    if (processingParams.tempo_override) {
      Tone.Transport.bpm.value = processingParams.tempo_override;
    }

    // Clean up on unmount
    return () => {
      if (notesRef.current) {
        notesRef.current.dispose();
      }
    };
  }, [musicData, isInstrumentLoaded, processingParams]);

  // Handle playback animation
  useEffect(() => {
    if (!isPlaying || !musicData) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      return;
    }

    // Start Tone.js transport if it's not started
    if (Tone.Transport.state !== "started") {
      Tone.Transport.start();
    }

    // Set the start time reference
    if (!startTimeRef.current) {
      startTimeRef.current = Tone.now() - currentTime;
    }

    // Animation loop for playback position
    const animate = () => {
      if (!startTimeRef.current || !musicData) return;

      const elapsed = Tone.now() - startTimeRef.current;
      setCurrentTime(elapsed);

      const totalDuration = calculateTotalDuration(musicData.notes);

      // Stop at the end
      if (elapsed >= totalDuration) {
        setIsPlaying(false);
        setCurrentTime(0);
        Tone.Transport.stop();
        startTimeRef.current = null;
        return;
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, musicData, currentTime]);

  // Toggle playback
  const togglePlayback = async () => {
    // Start audio context if it's not started
    if (Tone.context.state !== "running") {
      await Tone.start();
    }

    if (isPlaying) {
      Tone.Transport.pause();
      // Keep the current time position
    } else {
      if (!musicData) return;

      // If at the end, restart from beginning
      if (musicData && currentTime >= calculateTotalDuration(musicData.notes)) {
        setCurrentTime(0);
        startTimeRef.current = Tone.now();
      } else {
        // Resume from current position
        startTimeRef.current = Tone.now() - currentTime;
      }

      Tone.Transport.start();
    }

    setIsPlaying(!isPlaying);
  };

  // Stop playback
  const stopPlayback = () => {
    Tone.Transport.stop();
    setIsPlaying(false);
    setCurrentTime(0);
    startTimeRef.current = null;
  };

  // Handle seeking in the timeline
  const handleSeek = (value: number[]) => {
    const newTime = value[0];
    setCurrentTime(newTime);

    // Update the start time reference if playing
    if (isPlaying && startTimeRef.current) {
      startTimeRef.current = Tone.now() - newTime;
    }
  };

  // Process audio to extract notes
  const processAudio = async () => {
    if (!audioSource) return;

    setIsLoading(true);
    setError(null);
    setProcessingAudio(true);

    try {
      console.log("Starting to process audio:", audioSource.name);

      // Fetch the audio file from the URL
      const response = await fetch(audioSource.downloadLink);
      if (!response.ok) {
        throw new Error(`Failed to fetch audio: ${response.statusText}`);
      }
      console.log("Successfully fetched audio from:", audioSource.downloadLink);

      // Convert the response to a blob
      const blob = await response.blob();
      console.log("Converted response to blob, size:", blob.size);

      // Create a File object from the blob
      const file = new File([blob], `${audioSource.name}.mp3`, {
        type: "audio/mpeg",
      });

      // Create a FormData object
      const formData = new FormData();
      formData.append("file", file);

      // Add processing parameters to FormData only if they are not null
      Object.entries(processingParams).forEach(([key, value]) => {
        if (value !== null) {
          formData.append(key, value.toString());
        }
      });

      // Send to the audio processing API
      const apiResponse = await fetch("http://localhost:8000/process-audio/", {
        method: "POST",
        body: formData,
      });

      if (!apiResponse.ok) {
        throw new Error(`Server responded with status: ${apiResponse.status}`);
      }

      const data = await apiResponse.json();
      console.log("API Response:", data);

      // Validate the response data structure
      if (!data) {
        console.error("API returned empty data");
        setError("API returned empty data");
        return;
      }

      if (!data.notes) {
        console.error("API response is missing notes array:", data);
        setError("API response is missing notes array");
        return;
      }

      if (!Array.isArray(data.notes)) {
        console.error("API notes is not an array:", data.notes);
        setError("API response notes is not an array");
        return;
      }

      console.log(`Received ${data.notes.length} notes from API`);

      // Display the exact shape of the first few notes
      if (data.notes.length > 0) {
        console.log("Sample notes:", data.notes.slice(0, 3));
      }

      if (data.notes && Array.isArray(data.notes)) {
        console.log(`Received ${data.notes.length} notes from API`);

        // Use tempo override if provided, otherwise use detected tempo or default to 120
        const tempo = processingParams.tempo_override || data.tempo || 120;

        // Calculate total duration if not provided
        const totalDuration =
          data.total_duration ||
          (data.notes.length > 0
            ? Math.max(...data.notes.map((n: Note) => n.end)) + 1
            : 30);

        console.log("Calculated tempo:", tempo, "and duration:", totalDuration);

        // Create a complete new object for the musicData state
        const newMusicData: MusicData = {
          notes: data.notes,
          "X-Processing-Time-Seconds": data["X-Processing-Time-Seconds"] || 0,
        };

        // Log the exact fields we found
        console.log("API field mapping:", {
          "data.notes": data.notes,
          "data.X-Processing-Time-Seconds": data["X-Processing-Time-Seconds"],
        });

        console.log("Setting musicData:", newMusicData);

        // Reset the ref to ensure it renders correctly
        isInitialRender.current = true;

        // Use a function update to ensure we don't depend on the previous state
        setMusicData(() => ({ ...newMusicData }));

        // Immediately update loading state to trigger a rerender
        setIsLoading(false);

        // Save to context if we have an audioId
        if (audioId) {
          markAudioAsProcessed(audioId, newMusicData);
        }

        // Force a rerender - this is a hack but will ensure the component updates
        setTimeout(() => {
          if (onProcessed) {
            onProcessed(newMusicData);
          }
        }, 50);
      } else {
        console.error("Invalid API response format:", data);
        throw new Error(
          "Invalid response format from server: notes array is missing or not an array"
        );
      }
    } catch (error) {
      console.error("Error processing audio:", error);
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

  // Calculate total duration from notes
  const calculateTotalDuration = (notes: Note[]) => {
    return notes.length > 0 ? Math.max(...notes.map((n) => n.end)) + 1 : 30;
  };

  return (
    <Card className="w-full border border-black dark:border-white overflow-hidden">
      {showCardHeader && (
        <CardHeader className="border-b border-black dark:border-white">
          <CardTitle className="flex items-center text-lg">
            {track ? (
              <div className="flex items-center w-full">
                {track.album.cover_medium && (
                  <div className="mr-3 flex-shrink-0">
                    <Image
                      src={track.album.cover_medium || "/placeholder.svg"}
                      alt={track.album.title}
                      width={60}
                      height={60}
                      className="rounded-md"
                    />
                  </div>
                )}
                <div className="flex-grow min-w-0">
                  <div className="flex items-center gap-4">
                    <h3 className="font-semibold truncate">{track.title}</h3>
                    {musicData && (
                      <Badge
                        variant="secondary"
                        className="text-xs rounded-full"
                      >
                        {musicData.notes.length} notes
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground truncate">
                    {track.artist.name} • {track.album.title}
                  </p>
                </div>
                <audio src={track.preview} controls className="w-32 h-8 ml-2" />
              </div>
            ) : uploadedFile ? (
              <div className="flex items-center w-full">
                <div className="mr-3 flex-shrink-0 bg-muted/30 rounded-md p-3">
                  <FileAudio className="h-6 w-6" />
                </div>
                <div className="flex-grow min-w-0">
                  <div className="flex items-center gap-4">
                    <h3 className="font-semibold truncate">
                      {uploadedFile.name}
                    </h3>
                    {musicData && (
                      <Badge
                        variant="secondary"
                        className="text-xs rounded-full"
                      >
                        {musicData.notes.length} notes
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB •{" "}
                    {uploadedFile.type}
                  </p>
                </div>
                <audio
                  src={URL.createObjectURL(uploadedFile)}
                  controls
                  className="w-32 h-8 ml-2"
                />
              </div>
            ) : (
              <div className="flex items-center gap-3">
                {audioSource?.icon || <Music className="h-5 w-5" />}
                <div className="flex items-center gap-4">
                  <h3 className="font-semibold truncate">
                    {audioSource?.name}
                  </h3>
                  {musicData && (
                    <Badge variant="secondary" className="text-xs rounded-full">
                      {musicData.notes.length} notes
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </CardTitle>
        </CardHeader>
      )}

      <CardContent className="p-4 space-y-4">
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="relative">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Music className="h-5 w-5 text-primary" />
              </div>
            </div>
            <span className="ml-4 text-muted-foreground">
              Processing audio and extracting notes...
            </span>
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
            {!isProcessed && (
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
                  <div className="flex flex-col gap-4">
                    <NoteVisualization
                      notes={musicData.notes}
                      totalDuration={calculateTotalDuration(musicData.notes)}
                      isPlaying={isPlaying}
                      currentTime={currentTime}
                    />

                    {/* Playback controls */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Button
                            onClick={togglePlayback}
                            variant="outline"
                            size="icon"
                            disabled={!isInstrumentLoaded}
                            className="h-10 w-10 rounded-full border border-black/20 dark:border-white/20"
                          >
                            {isPlaying ? (
                              <Pause className="h-5 w-5" />
                            ) : (
                              <Play className="h-5 w-5" />
                            )}
                          </Button>
                          <Button
                            onClick={stopPlayback}
                            variant="outline"
                            size="icon"
                            disabled={!isPlaying}
                            className="h-10 w-10 rounded-full border border-black/20 dark:border-white/20"
                          >
                            <Square className="h-5 w-5" />
                          </Button>
                          <div className="text-sm font-medium ml-1">
                            {formatTime(currentTime)} /{" "}
                            {formatTime(
                              calculateTotalDuration(musicData.notes)
                            )}
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Volume2 className="h-4 w-4 text-muted-foreground" />
                          <Slider
                            value={[volume]}
                            min={0}
                            max={1}
                            step={0.01}
                            className="w-24"
                            onValueChange={(value) => setVolume(value[0])}
                          />
                        </div>
                      </div>

                      {/* Seek bar */}
                      <Slider
                        value={[currentTime]}
                        min={0}
                        max={calculateTotalDuration(musicData.notes)}
                        step={0.01}
                        className="w-full"
                        onValueChange={handleSeek}
                      />

                      <div className="space-y-2">
                        <Label className="text-sm font-medium">
                          Tempo:{" "}
                          {processingParams.tempo_override?.toFixed(1) || "120"}{" "}
                          BPM
                        </Label>
                        <Slider
                          value={[processingParams.tempo_override || 120]}
                          min={60}
                          max={200}
                          step={1}
                          onValueChange={(value) => {
                            setProcessingParams((prev) => ({
                              ...prev,
                              tempo_override: value[0],
                            }));
                            Tone.Transport.bpm.value = value[0];
                          }}
                        />
                      </div>
                    </div>

                    {!isInstrumentLoaded && (
                      <div className="flex items-center justify-center py-2 text-sm text-muted-foreground">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                        Loading instrument samples...
                      </div>
                    )}
                  </div>
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
