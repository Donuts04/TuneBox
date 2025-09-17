"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Music, Loader2, KeyboardMusic, Speaker } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { INSTRUMENTS, COMPOSER_OPTIONS } from "@/lib/constants";
import CircleLoader from "../loaders/circleLoader";
import { Midi } from "@tonejs/midi";
import TonePlayer from "./TonePlayer";

interface AudioConverterProps {
  midi?: Midi | null;
  originalAudioUrl?: string | null;
  isLoading?: boolean;
  error?: string | null;
  onRequestConvert?: (composer: string) => void;
}

export default function AudioConverter({
  midi,
  originalAudioUrl,
  isLoading = false,
  error,
  onRequestConvert,
}: AudioConverterProps) {
  const [selectedComposer, setSelectedComposer] = useState<string>("composer1");
  const [selectedInstrument, setSelectedInstrument] = useState(
    INSTRUMENTS[0].id
  );

  // Request conversion when composer changes
  useEffect(() => {
    onRequestConvert?.(selectedComposer);
  }, [selectedComposer, onRequestConvert]);

  return (
    <Card className="w-full border border-black dark:border-white overflow-hidden bg-transparent rounded-lg">
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
              onClick={() => onRequestConvert?.(selectedComposer)}
              className="border border-black/20 dark:border-white/20 bg-transparent hover:bg-black/5 dark:hover:bg-white/5 text-black dark:text-white"
            >
              Try Again
            </Button>
          </div>
        ) : !midi ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-4 text-center">
            <div className="bg-muted/20 rounded-full p-4">
              <Music className="h-12 w-12 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">
              No MIDI data available. Please convert the audio.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
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
            </div>

            {midi ? (
              <div>
                <div className="w-full">
                  <TonePlayer
                    midiData={midi}
                    selectedInstrument={selectedInstrument}
                    originalAudioUrl={originalAudioUrl || undefined}
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
                    No MIDI data available. Please process the audio first.
                  </p>
                  <Button
                    onClick={() => onRequestConvert?.(selectedComposer)}
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
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
