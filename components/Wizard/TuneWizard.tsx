"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, Search, ArrowLeft } from "lucide-react";
import DeezerSearch from "./deezer-search";
import { DeezerTrack } from "@/lib/deezer";
import Image from "next/image";
type Step =
  | "initial"
  | "search"
  | "upload"
  | "upload-options"
  | "process"
  | "separate"
  | "convert"
  | "effects";
import ProcessView from "@/components/Process/process-view";
import UploadDropzone from "./upload-dropzone";
import StepHeader from "./StepHeader";

export default function TuneWizard() {
  const [currentStep, setCurrentStep] = useState<Step>("initial");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [selectedTrack, setSelectedTrack] = useState<DeezerTrack | null>(null);

  const resetFlow = () => {
    setCurrentStep("initial");
    setUploadedFile(null);
    setSelectedTrack(null);
  };

  // TODO: Add a how to use dialog
  if (currentStep === "initial") {
    return (
      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-8 md:gap-0 w-full mx-auto">
        <div className="flex flex-col h-full">
          <Card
            className="border border-black/50 dark:border-white/50 hover:border-black/80 dark:hover:border-white/80 transition-all cursor-pointer h-full bg-transparent"
            onClick={() => setCurrentStep("search")}
          >
            <CardContent className="p-8 flex flex-col items-center justify-center text-center h-full group">
              <div className="w-20 h-20 rounded-full border border-black dark:border-white flex items-center justify-center mb-6 group-hover:bg-black dark:group-hover:bg-white transition-colors">
                <Search className="h-10 w-10 text-black dark:text-white group-hover:text-white dark:group-hover:text-black transition-colors" />
              </div>
              <h2 className="text-2xl font-semibold mb-3 text-black dark:text-white tracking-tight">
                Find a Song
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-6 tracking-normal leading-tight">
                Search for songs to process or separate. Choose from millions of
                tracks to analyze.
              </p>
              <Button
                size="lg"
                className="flex items-center justify-center gap-2 mt-auto border border-black/50 dark:border-white/50 text-black dark:text-white group-hover:text-white group-hover:dark:text-black bg-transparent group-hover:bg-black dark:group-hover:bg-white transition-colors"
              >
                <Search className="h-5 w-5" />
                Search Songs
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="flex items-center justify-center px-8">
          <Image
            src="/tuney/dance.png"
            alt="TuneBox Logo"
            width={150}
            height={150}
            className="object-cover dark:invert"
            priority
          />
        </div>

        <div className="flex flex-col h-full">
          <Card
            className="border border-black/50 dark:border-white/50 hover:border-black/80 dark:hover:border-white/80 transition-all cursor-pointer h-full bg-transparent"
            onClick={() => setCurrentStep("upload")}
          >
            <CardContent className="p-8 flex flex-col items-center justify-center text-center h-full group">
              <div className="w-20 h-20 rounded-full border border-black dark:border-white flex items-center justify-center mb-6 group-hover:bg-black dark:group-hover:bg-white transition-colors">
                <Upload className="h-10 w-10 text-black dark:text-white group-hover:text-white dark:group-hover:text-black transition-colors" />
              </div>
              <h2 className="text-2xl font-semibold mb-3 text-black dark:text-white tracking-tight">
                Upload Audio
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-6 tracking-normal leading-tight">
                Search for songs to process or separate. Choose from millions of
                tracks to analyze.
              </p>
              <Button
                size="lg"
                className="flex items-center justify-center gap-2 mt-auto border border-black/50 dark:border-white/50 text-black dark:text-white group-hover:text-white group-hover:dark:text-black bg-transparent group-hover:bg-black dark:group-hover:bg-white transition-colors"
              >
                <Upload className="h-5 w-5" />
                Upload Audio
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (currentStep === "search") {
    return (
      <div className="space-y-4 mx-auto">
        <StepHeader title="Find Songs" onBack={resetFlow} />

        <DeezerSearch
          onSelect={(track) => {
            setSelectedTrack(track);
            setCurrentStep("process");
          }}
        />
      </div>
    );
  }

  if (currentStep === "upload") {
    return (
      <div className="space-y-4 mx-auto">
        <StepHeader
          title="Upload Audio"
          onBack={() => setCurrentStep("initial")}
        />

        <UploadDropzone
          onFileSelected={(file) => {
            setUploadedFile(file);
            setCurrentStep("process");
          }}
        />
      </div>
    );
  }

  if (currentStep === "process") {
    return (
      <div className="space-y-4 mx-auto">
        <StepHeader title="Start Processing" onBack={resetFlow} />

        <ProcessView uploadedFile={uploadedFile} track={selectedTrack} />
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
