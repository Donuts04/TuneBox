"use client";

import Navbar from "@/components/Navbar/Navbar";
import ProcessingOptions from "@/components/processing-options";
import { AudioProcessingProvider } from "@/contexts/audio-processing-context";
import {
  FileMusicIcon as MusicNotes,
  Layers,
  FileMusic,
  AudioWaveformIcon as Waveform,
} from "lucide-react";

import Spline from "@splinetool/react-spline";
export default function Home() {
  return (
    <AudioProcessingProvider>
      <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-black dark:to-black">
        <div className="w-full max-w-7xl mx-auto px-4 py-6">
          <Navbar />
        </div>

        {/* <div className="w-full h-screen">
          <Spline scene="https://prod.spline.design/X7cWw-ft2nR6OqhQ/scene.splinecode" />
        </div> */}

        <div className="container mx-auto px-4 max-w-7xl">
          <div className="py-16 md:py-24">
            <div className="flex flex-col items-center justify-center gap-4">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tighter px-12 text-center">
                Transform Your Music Experience
              </h1>
              <video
                className="w-96 h-96 object-cover"
                autoPlay
                muted
                loop
                playsInline
              >
                <source src="/musikBox.mp4" type="video/mp4" />
                Your browser does not support the video tag.
              </video>

              <p className="text-xl text-black/50 dark:text-white/50 max-w-md text-center font-gotham tracking-normal leading-tight">
                Separate audio tracks and convert them into musical notes with
                TuneBox!
              </p>
            </div>
          </div>

          <ProcessingOptions />

          {/* Features Section */}
          <div className="py-12 mt-16">
            <h2 className="text-2xl font-bold text-center mb-10">
              What You Can Do
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-card/50 p-6 rounded-xl border border-border/50 flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4">
                  <Layers className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2">
                  Separate Audio Stems
                </h3>
                <p className="text-muted-foreground">
                  Split songs into vocals, drums, bass, and other instruments
                  for remixing or practice.
                </p>
              </div>

              <div className="bg-card/50 p-6 rounded-xl border border-border/50 flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mb-4">
                  <FileMusic className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Convert to Notes</h3>
                <p className="text-muted-foreground">
                  Transform audio into musical notes and MIDI data to learn
                  songs or create sheet music.
                </p>
              </div>

              <div className="bg-card/50 p-6 rounded-xl border border-border/50 flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-4">
                  <Waveform className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Visualize Audio</h3>
                <p className="text-muted-foreground">
                  See your music visualized as waveforms and notes to better
                  understand its structure.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </AudioProcessingProvider>
  );
}
