"use client";

import type React from "react";

import { useState, useEffect, useRef } from "react";
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
import {
  Play,
  Pause,
  Square,
  Download,
  Volume2,
  Music,
  Loader2,
  Settings,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useAudioProcessing } from "@/contexts/audio-processing-context";

// Define types for the API response
interface Note {
  start: number;
  end: number;
  pitch: number;
  velocity: number;
}

interface MusicData {
  notes: Note[];
  tempo: number;
  total_duration: number;
  sample_rate: number;
  midi_download_link?: string;
  piano_audio_download_link?: string;
}

interface AudioSource {
  name: string;
  downloadLink: string;
  color: string;
  icon: React.ReactNode;
}

// Interface for audio processing parameters
interface AudioProcessingParams {
  onset_threshold: number;
  frame_threshold: number;
  minimum_note_length: number;
  minimum_frequency: number | null;
  maximum_frequency: number | null;
  multiple_pitch_bends: boolean;
  tempo_override: number | null;
}

// Define available instruments
const INSTRUMENTS = [
  {
    id: "piano",
    name: "Piano",
    urls: {
      C4: "C4.mp3",
      "D#4": "Ds4.mp3",
      "F#4": "Fs4.mp3",
      A4: "A4.mp3",
    },
    baseUrl: "https://tonejs.github.io/audio/salamander/",
  },
  {
    id: "guitar",
    name: "Guitar",
    urls: {
      A2: "A2.mp3",
      A3: "A3.mp3",
      A4: "A4.mp3",
      A5: "A5.mp3",
    },
    baseUrl: "https://tonejs.github.io/audio/guitar-acoustic/",
  },
  {
    id: "bass",
    name: "Bass",
    urls: {
      A1: "A1.mp3",
      A2: "A2.mp3",
    },
    baseUrl: "https://tonejs.github.io/audio/bass/",
  },
  {
    id: "xylophone",
    name: "Xylophone",
    urls: {
      C5: "C5.mp3",
      C6: "C6.mp3",
      C7: "C7.mp3",
    },
    baseUrl: "https://tonejs.github.io/audio/xylophone/",
  },
  {
    id: "casio",
    name: "Casio",
    urls: {
      A1: "A1.mp3",
      A2: "A2.mp3",
    },
    baseUrl: "https://tonejs.github.io/audio/casio/",
  },
];

interface AudioToNotesProps {
  audioSource: AudioSource;
  audioId: string;
  isProcessed?: boolean;
  onProcessed?: (musicData: any) => void;
}

export default function AudioToNotes({
  audioSource,
  audioId,
  isProcessed = false,
  onProcessed,
}: AudioToNotesProps) {
  // Get the audio processing context
  const { getAudioMusicData } = useAudioProcessing();

  // Initialize musicData from context if available
  const initialMusicData = isProcessed ? getAudioMusicData(audioId) : null;
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
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [processingAudio, setProcessingAudio] = useState(false);

  // Audio processing parameters
  const [processingParams, setProcessingParams] =
    useState<AudioProcessingParams>({
      onset_threshold: 0.4,
      frame_threshold: 0.2,
      minimum_note_length: 100.0,
      minimum_frequency: null,
      maximum_frequency: null,
      multiple_pitch_bends: false,
      tempo_override: null,
    });

  const sampler = useRef<Tone.Sampler | null>(null);
  const notesRef = useRef<Tone.Part | null>(null);
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  // Process the audio when component mounts if not already processed
  useEffect(() => {
    if (!isProcessed && !initialMusicData) {
      processAudio();
    }
  }, [isProcessed, initialMusicData]);

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

    // Create a new sampler with the selected instrument
    sampler.current = new Tone.Sampler({
      urls: instrumentConfig.urls,
      baseUrl: instrumentConfig.baseUrl,
      onload: () => {
        setIsInstrumentLoaded(true);
        console.log(`${instrumentConfig.name} loaded`);
      },
      onerror: (err) => {
        console.error("Error loading instrument:", err);
        setError(`Failed to load ${instrumentConfig.name} samples`);
      },
    }).toDestination();

    // Set the volume
    sampler.current.volume.value = Tone.gainToDb(volume);

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
        sampler.current?.triggerAttackRelease(
          noteName,
          duration,
          time,
          note.velocity
        );
      },
      musicData.notes.map((note) => ({
        time: note.start,
        ...note,
      }))
    ).start(0);

    // Set the tempo
    if (musicData.tempo) {
      Tone.Transport.bpm.value = musicData.tempo;
    }

    // Clean up on unmount
    return () => {
      if (notesRef.current) {
        notesRef.current.dispose();
      }
    };
  }, [musicData, isInstrumentLoaded]);

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

      // Stop at the end
      if (elapsed >= musicData.total_duration) {
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
      if (currentTime >= musicData.total_duration) {
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

      // Add processing parameters to FormData
      formData.append(
        "onset_threshold",
        processingParams.onset_threshold.toString()
      );
      formData.append(
        "frame_threshold",
        processingParams.frame_threshold.toString()
      );
      formData.append(
        "minimum_note_length",
        processingParams.minimum_note_length.toString()
      );
      formData.append(
        "multiple_pitch_bends",
        processingParams.multiple_pitch_bends.toString()
      );

      // Add optional parameters if provided
      if (processingParams.minimum_frequency !== null) {
        formData.append(
          "minimum_frequency",
          processingParams.minimum_frequency.toString()
        );
      }

      if (processingParams.maximum_frequency !== null) {
        formData.append(
          "maximum_frequency",
          processingParams.maximum_frequency.toString()
        );
      }

      if (processingParams.tempo_override !== null) {
        formData.append(
          "tempo_override",
          processingParams.tempo_override.toString()
        );
      }

      console.log("Sending request to API with parameters:", {
        onset_threshold: processingParams.onset_threshold,
        frame_threshold: processingParams.frame_threshold,
        minimum_note_length: processingParams.minimum_note_length,
        multiple_pitch_bends: processingParams.multiple_pitch_bends,
        minimum_frequency: processingParams.minimum_frequency,
        maximum_frequency: processingParams.maximum_frequency,
        tempo_override: processingParams.tempo_override,
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
          tempo: tempo,
          total_duration: totalDuration,
          sample_rate: data.sample_rate || 44100,
          midi_download_link: data.midi_download_link,
          // Check all possible field names for piano audio
          piano_audio_download_link:
            data.piano_audio_link ||
            data.piano_audio_download_link ||
            data.piano_audio ||
            null,
        };

        // Log the exact fields we found
        console.log("API field mapping:", {
          "data.piano_audio_link": data.piano_audio_link,
          "data.piano_audio_download_link": data.piano_audio_download_link,
          "data.piano_audio": data.piano_audio,
          "final used value": newMusicData.piano_audio_download_link,
        });

        console.log("Setting musicData:", newMusicData);

        // Reset the ref to ensure it renders correctly
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

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Render the visualization of notes
  const renderNoteVisualization = () => {
    if (!musicData) return null;

    const totalDuration = musicData.total_duration;

    return (
      <div className="relative w-full h-[150px] bg-gray-100 dark:bg-gray-800 rounded-md overflow-hidden">
        {musicData.notes.map((note, index) => {
          // Calculate position and dimensions
          const left = (note.start / totalDuration) * 100;
          const width = ((note.end - note.start) / totalDuration) * 100;

          // Map MIDI pitch (usually 21-108) to vertical position
          // Higher notes at the top, lower notes at the bottom
          const pitchRange = 88; // Standard piano range
          const minPitch = 21; // A0
          const normalizedPitch = Math.min(
            Math.max(0, note.pitch - minPitch),
            pitchRange
          );
          const top = 100 - (normalizedPitch / pitchRange) * 100;

          // Determine color based on velocity
          const hue = 220; // Blue
          const lightness = Math.max(40, 70 - note.velocity * 40);

          // Check if note is currently playing
          const isActive =
            isPlaying && currentTime >= note.start && currentTime <= note.end;

          return (
            <div
              key={index}
              className={`absolute rounded-sm border ${
                isActive ? "ring-2 ring-white" : ""
              }`}
              style={{
                left: `${left}%`,
                top: `${top}%`,
                width: `${width}%`,
                height: "8%",
                backgroundColor: `hsl(${hue}, 80%, ${lightness}%)`,
                borderColor: `hsl(${hue}, 80%, ${lightness - 20}%)`,
              }}
            />
          );
        })}

        {/* Playback position indicator */}
        {currentTime > 0 && (
          <div
            className="absolute top-0 h-full border-l-2 border-red-500 z-10"
            style={{ left: `${(currentTime / totalDuration) * 100}%` }}
          />
        )}
      </div>
    );
  };

  // Add a useEffect to log when musicData changes
  useEffect(() => {
    if (musicData) {
      console.log("musicData changed:", {
        hasData: !!musicData,
        notesCount: musicData.notes?.length || 0,
        tempo: musicData.tempo,
        duration: musicData.total_duration,
        piano_audio_link: musicData.piano_audio_download_link,
        isInitialRender: isInitialRender.current,
      });

      // If no notes were found, log an explicit message
      if (!musicData.notes || musicData.notes.length === 0) {
        console.warn("musicData has no notes!");
      }
    } else {
      console.log("musicData is null");
    }
  }, [musicData]);

  useEffect(() => {
    // Force a rerender when processing is completed
    if (!isLoading && !error && isInitialRender.current) {
      isInitialRender.current = false;
    }
  }, [isLoading, error]);

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center">
          {audioSource.icon}
          <span className="ml-2">{audioSource.name} Notes</span>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {!isProcessed && !isLoading && (
          <Accordion type="single" collapsible className="mb-4">
            <AccordionItem value="processing-settings">
              <AccordionTrigger className="py-2">
                <div className="flex items-center">
                  <Settings className="h-4 w-4 mr-2" />
                  Processing Settings
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4 pt-2">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="onset-threshold">
                        Onset Threshold:{" "}
                        {processingParams.onset_threshold.toFixed(2)}
                      </Label>
                    </div>
                    <Slider
                      id="onset-threshold"
                      value={[processingParams.onset_threshold]}
                      min={0.1}
                      max={1.0}
                      step={0.05}
                      onValueChange={(value) =>
                        handleParamChange("onset_threshold", value[0])
                      }
                    />
                    <div className="text-xs text-muted-foreground">
                      Controls how sensitive the detection is to note starts.
                      Lower values detect more notes.
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="frame-threshold">
                        Frame Threshold:{" "}
                        {processingParams.frame_threshold.toFixed(2)}
                      </Label>
                    </div>
                    <Slider
                      id="frame-threshold"
                      value={[processingParams.frame_threshold]}
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
                      <Label htmlFor="min-note-length">
                        Minimum Note Length (ms):{" "}
                        {processingParams.minimum_note_length}
                      </Label>
                    </div>
                    <Slider
                      id="min-note-length"
                      value={[processingParams.minimum_note_length]}
                      min={10}
                      max={300}
                      step={10}
                      onValueChange={(value) =>
                        handleParamChange("minimum_note_length", value[0])
                      }
                    />
                    <div className="text-xs text-muted-foreground">
                      Notes shorter than this will be filtered out. Helps reduce
                      noise and false detections.
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="min-freq">Minimum Frequency (Hz)</Label>
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
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="max-freq">Maximum Frequency (Hz)</Label>
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
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tempo-override">Tempo Override (BPM)</Label>
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
                    />
                    <div className="text-xs text-muted-foreground">
                      Leave empty to let the system detect tempo automatically.
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="pitch-bends"
                      checked={processingParams.multiple_pitch_bends}
                      onCheckedChange={(checked) =>
                        handleParamChange("multiple_pitch_bends", checked)
                      }
                    />
                    <Label htmlFor="pitch-bends">Enable Pitch Bends</Label>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-center text-muted-foreground">
              Processing audio and extracting notes...
              <br />
              This may take a moment.
            </p>
          </div>
        ) : error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : musicData && musicData.notes && musicData.notes.length > 0 ? (
          <>
            {console.log("Rendering with musicData:", musicData)}
            {/* Rest of the component with musicData */}

            {/* Instrument selector */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Instrument</label>
              <Select
                value={selectedInstrument}
                onValueChange={setSelectedInstrument}
                disabled={isPlaying}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select an instrument" />
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

            {/* Note visualization */}
            {renderNoteVisualization()}

            {/* Rest of the component remains the same */}
            {/* Playback controls */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Button
                    onClick={togglePlayback}
                    variant="outline"
                    size="icon"
                    disabled={!isInstrumentLoaded}
                    className="h-10 w-10"
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
                    className="h-10 w-10"
                  >
                    <Square className="h-5 w-5" />
                  </Button>
                  <div className="text-sm font-medium">
                    {formatTime(currentTime)} /{" "}
                    {formatTime(musicData.total_duration)}
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
                max={musicData.total_duration}
                step={0.01}
                className="w-full"
                onValueChange={handleSeek}
              />

              {/* Tempo control */}
              <div className="flex items-center space-x-4">
                <Label className="whitespace-nowrap">
                  Tempo: {musicData.tempo.toFixed(1)} BPM
                </Label>
                <Slider
                  value={[musicData.tempo]}
                  min={60}
                  max={200}
                  step={1}
                  className="flex-1"
                  onValueChange={(value) => {
                    setMusicData((prev) =>
                      prev ? { ...prev, tempo: value[0] } : null
                    );
                    if (Tone.Transport) {
                      Tone.Transport.bpm.value = value[0];
                    }
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

            {/* Song info */}
            <div className="flex justify-between text-sm text-muted-foreground">
              <div>
                {musicData.notes.length} notes • Tempo:{" "}
                {musicData.tempo.toFixed(1)} BPM
              </div>
              <div className="flex space-x-2">
                {musicData.midi_download_link && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={musicData.midi_download_link} download>
                      <Download className="h-4 w-4 mr-1" />
                      MIDI
                    </a>
                  </Button>
                )}
                {musicData.piano_audio_download_link && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={musicData.piano_audio_download_link} download>
                      <Music className="h-4 w-4 mr-1" />
                      Piano Audio
                    </a>
                  </Button>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 space-y-4 text-center">
            <Music className="h-16 w-16 text-muted-foreground" />
            <p className="text-muted-foreground">
              No notes data available. Please process the audio first.
              {console.log(
                "Rendering 'No notes data available' state, musicData is:",
                musicData,
                "isLoading:",
                isLoading,
                "error:",
                error
              )}
            </p>
            {!isProcessed && (
              <Button onClick={processAudio} disabled={isLoading}>
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
        )}
        {!isLoading && !error && !musicData && processingAudio && (
          <div className="mt-4 p-4 border rounded bg-yellow-50 dark:bg-yellow-900/20">
            <h4 className="font-medium mb-2">Raw API Response Debug View</h4>
            <div className="text-xs overflow-auto max-h-[200px] bg-white dark:bg-gray-800 p-2 rounded">
              <pre>
                {JSON.stringify(
                  {
                    isLoading,
                    error,
                    hasMusicData: !!musicData,
                    processingAudio,
                    isProcessed,
                  },
                  null,
                  2
                )}
              </pre>
            </div>
            <div className="mt-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  // Force re-process as a last resort
                  if (processingAudio) {
                    processAudio();
                  }
                }}
              >
                Re-process audio
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
