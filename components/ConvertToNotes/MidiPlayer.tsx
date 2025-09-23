"use client";

import { useState } from "react";
import { Music, KeyboardMusic } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { INSTRUMENTS } from "@/lib/constants";
import { Midi } from "@tonejs/midi";
import TonePlayer from "./TonePlayer";

interface MidiPlayerProps {
  midi?: Midi | null;
  originalAudioUrl?: string | null;
}

export default function MidiPlayer({
  midi,
  originalAudioUrl,
}: MidiPlayerProps) {
  const [selectedInstrument, setSelectedInstrument] = useState(
    INSTRUMENTS[0].id
  );

  return (
    <div className="w-full border border-black dark:border-white rounded-lg p-4 space-y-4">
      <div>
        <h2 className="text-2xl font-semibold">Notes Converter</h2>
        <p className="text-sm text-muted-foreground">
          Convert your audio to notes
        </p>
      </div>
      <div className="space-y-4">
        {!midi ? (
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
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
