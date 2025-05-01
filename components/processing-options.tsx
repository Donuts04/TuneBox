"use client";

import type React from "react";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Layers,
  FileMusic,
  Music,
  Upload,
  Search,
  ArrowLeft,
  ListMusic,
  BoomBox,
} from "lucide-react";
import DeezerSearch from "./deezer-search";
import AudioSeparator from "./AudioSeperator/audio-separator";
import AudioConverter from "./ConvertToNotes/audio-converter";
import { DeezerTrack } from "@/lib/deezer";

type Step = "initial" | "search" | "upload-options" | "separate" | "convert";

interface ProcessingOptionsProps {
  onThemeToggle?: () => void;
}

export default function ProcessingOptions({
  onThemeToggle,
}: ProcessingOptionsProps) {
  const [currentStep, setCurrentStep] = useState<Step>("initial");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [selectedTrack, setSelectedTrack] = useState<DeezerTrack | null>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploadedFile(file);
    setCurrentStep("upload-options");
  };

  const resetFlow = () => {
    setCurrentStep("initial");
    setUploadedFile(null);
    setSelectedTrack(null);
  };

  // TODO: Add a how to use dialog
  if (currentStep === "initial") {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
        <div className="flex flex-col h-full">
          <Card
            className="border border-black/50 dark:border-white/50 hover:border-black/80 dark:hover:border-white/80 transition-all cursor-pointer h-full"
            onClick={() => setCurrentStep("search")}
          >
            <CardContent className="p-8 flex flex-col items-center justify-center text-center h-full group">
              <div className="w-20 h-20 rounded-full border border-black dark:border-white flex items-center justify-center mb-6 group-hover:bg-black dark:group-hover:bg-white transition-colors">
                <Search className="h-10 w-10 text-black dark:text-white group-hover:text-white dark:group-hover:text-black transition-colors" />
              </div>
              <h2 className="text-2xl font-bold mb-3 text-black dark:text-white tracking-tighter">
                Find a Song
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-6 font-gotham tracking-normal leading-tight">
                Search for songs to process or separate. Choose from millions of
                tracks to analyze.
              </p>
              <Button
                size="lg"
                className="flex items-center justify-center gap-2 font-gotham mt-auto border border-black/50 dark:border-white/50 text-black dark:text-white group-hover:text-white group-hover:dark:text-black bg-transparent group-hover:bg-black dark:group-hover:bg-white transition-colors"
              >
                <Search className="h-5 w-5" />
                Search Songs
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col h-full">
          <Card className="border border-black/50 dark:border-white/50 hover:border-black/80 dark:hover:border-white/80 transition-all cursor-pointer h-full">
            <CardContent className="p-8 flex flex-col items-center justify-center text-center h-full group">
              <div className="w-20 h-20 rounded-full border border-black dark:border-white flex items-center justify-center mb-6 group-hover:bg-black dark:group-hover:bg-white transition-colors">
                <Upload className="h-10 w-10 text-black dark:text-white group-hover:text-white dark:group-hover:text-black transition-colors" />
              </div>
              <h2 className="text-2xl font-bold mb-3 text-black dark:text-white tracking-tighter">
                Upload Audio
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-6 font-gotham tracking-normal leading-tight">
                Upload your own audio files to process. Works with MP3, WAV, and
                other common audio formats.
              </p>
              <Button
                size="lg"
                className="flex items-center justify-center gap-2 font-gotham mt-auto border border-black/50 dark:border-white/50 text-black dark:text-white hover:text-white hover:dark:text-black bg-transparent hover:bg-black dark:hover:bg-white transition-colors"
                asChild
              >
                <label className="cursor-pointer flex items-center">
                  <Upload className="h-5 w-5 mr-2" />
                  Upload File
                  <input
                    type="file"
                    className="hidden"
                    accept="audio/*"
                    onChange={handleFileUpload}
                  />
                </label>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (currentStep === "upload-options" && uploadedFile) {
    return (
      <div className="space-y-4 max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6 border border-black dark:border-white p-4 rounded-lg">
          <h2 className="text-xl font-bold flex items-center gap-2 font-gotham">
            <BoomBox className="h-5 w-5 text-black dark:text-white" />
            Choose an Option
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={resetFlow}
            className="hover:dark:bg-white hover:bg-black hover:text-white hover:dark:text-black text-black dark:text-white font-gotham flex gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Start
          </Button>
        </div>

        <div className="p-6 border border-black dark:border-white rounded-lg mb-6">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full flex items-center justify-center mr-4 border border-black dark:border-white">
              <Music className="h-5 w-5 text-black dark:text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Selected file
              </p>
              <p className="font-semibold text-black dark:text-white">
                {uploadedFile.name}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card
            className="border border-black dark:border-white transition-all cursor-pointer"
            onClick={() => setCurrentStep("separate")}
          >
            <CardContent className="p-8 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4 border border-black dark:border-white">
                <Layers className="h-8 w-8 text-black dark:text-white" />
              </div>
              <h2 className="text-xl font-bold mb-2 text-black dark:text-white">
                Separate Audio
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Split the audio into individual stems (vocals, drums, bass,
                etc.)
              </p>
              <Button className="mt-2 bg-black hover:bg-black/90 dark:bg-white/10 dark:hover:bg-white/20 border border-white/20 text-white dark:text-white">
                <Layers className="h-4 w-4 mr-2" />
                Separate
              </Button>
            </CardContent>
          </Card>

          <Card
            className="border border-black dark:border-white transition-all cursor-pointer"
            onClick={() => setCurrentStep("convert")}
          >
            <CardContent className="p-8 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4 border border-black dark:border-white">
                <FileMusic className="h-8 w-8 text-black dark:text-white" />
              </div>
              <h2 className="text-xl font-bold mb-2 text-black dark:text-white">
                Convert to Notes
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Extract musical notes and create a MIDI representation
              </p>
              <Button className="mt-2 bg-black hover:bg-black/90 dark:bg-white/10 dark:hover:bg-white/20 border border-white/20 text-white dark:text-white">
                <FileMusic className="h-4 w-4 mr-2" />
                Convert
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (currentStep === "search") {
    return (
      <div className="space-y-4 max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6 border border-black dark:border-white p-4 rounded-lg">
          <h2 className="text-xl font-bold flex items-center gap-2 font-gotham">
            <ListMusic className="h-5 w-5 text-black dark:text-white" />
            Find Songs
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={resetFlow}
            className="hover:dark:bg-white hover:bg-black hover:text-white hover:dark:text-black text-black dark:text-white font-gotham flex gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Start
          </Button>
        </div>

        <DeezerSearch
          onSelectForSeparation={(track) => {
            setSelectedTrack(track);
            setCurrentStep("separate");
          }}
          onSelectForConversion={(track) => {
            setSelectedTrack(track);
            setCurrentStep("convert");
          }}
        />
      </div>
    );
  }

  if (currentStep === "separate") {
    return (
      <div className="space-y-4 max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6 border border-black dark:border-white p-4 rounded-lg">
          <h2 className="text-xl font-bold flex items-center gap-2 font-gotham">
            <Layers className="h-5 w-5 text-black dark:text-white" />
            Audio Separator
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={resetFlow}
            className="hover:dark:bg-white hover:bg-black hover:text-white hover:dark:text-black text-black dark:text-white font-gotham flex gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Start
          </Button>
        </div>

        <AudioSeparator uploadedFile={uploadedFile} track={selectedTrack} />
      </div>
    );
  }

  if (currentStep === "convert") {
    return (
      <div className="space-y-4 max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6 border border-black dark:border-white p-4 rounded-lg">
          <h2 className="text-xl font-bold flex items-center gap-2 font-gotham">
            <FileMusic className="h-5 w-5 text-black dark:text-white" />
            Notes Converter
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={resetFlow}
            className="hover:dark:bg-white hover:bg-black hover:text-white hover:dark:text-black text-black dark:text-white font-gotham flex gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Start
          </Button>
        </div>
        <AudioConverter uploadedFile={uploadedFile} track={selectedTrack} />
      </div>
    );
  }

  // Default case - should not reach here normally
  return (
    <div className="text-center py-12 border border-black dark:border-white p-8 rounded-lg">
      <Button
        onClick={resetFlow}
        className="bg-black hover:bg-black/90 dark:bg-white/10 dark:hover:bg-white/20 border border-white/20 text-white dark:text-white"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Start
      </Button>
    </div>
  );
}
