"use client";

import Navbar from "@/components/Navbar/Navbar";
import TuneWizard from "@/components/Wizard/TuneWizard";
import Image from "next/image";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowDown } from "lucide-react";
import { FeaturedCarousel } from "@/components/featured-carousel";
import { MusicBoxComposer } from "@/components/MusicBoxComposer";
import { AboutSection } from "@/components/about-section";
import Footer from "@/components/footer";
import LoopSamples from "@/components/LoopSamples";
import TalkingTuneBox from "@/components/Wizard/TalkingTuneBox";

export default function Home() {
  const [showHelper, setShowHelper] = useState(false);
  const [buttonPressed, setButtonPressed] = useState(false);

  return (
    <main className="min-h-screen bg-white dark:bg-black">
      <div className="w-full max-w-7xl mx-auto px-4 py-6">
        <Navbar />
      </div>

      <section
        className="h-screen w-full max-w-7xl mx-auto px-4 h-full"
        id="home"
      >
        <div className="flex h-full flex-col items-center justify-center text-center gap-6">
          <h1 className="text-5xl font-bold tracking-tight">
            Transform Your Music Experience
          </h1>
          <Image
            src="https://storage.googleapis.com/tunebox-stuff/logos/TuneBoxLogo.png"
            alt="TuneBox Logo"
            width={450}
            height={450}
            className="dark:invert w-[300px] h-[300px] md:w-[450px] md:h-[450px]"
            priority
          />
          <p className="text-base md:text-xl text-muted-foreground max-w-2xl">
            Separate audio tracks, apply audio effects, and convert them into
            music box melodies with TuneBox!
          </p>
        </div>
      </section>

      <div className="container mx-auto px-4 max-w-7xl space-y-32 py-16 md:py-24">
        <FeaturedCarousel />

        <div id="start">
          <div className="flex items-end justify-between gap-4">
            <Image
              src="https://storage.googleapis.com/tunebox-stuff/tuney/pointRight.png"
              alt="TuneBox Logo"
              width={150}
              height={150}
              className="object-cover dark:invert"
              priority
            />

            <div className="relative">
              {!buttonPressed && (
                <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 flex gap-2">
                  <ArrowDown className="h-5 w-5 text-black dark:text-white animate-bounce" />
                </div>
              )}

              <Button
                variant="outline"
                className="mb-3 border-black/50 dark:border-white/50 text-black dark:text-white hover:text-white hover:dark:text-black bg-transparent hover:bg-black dark:hover:bg-white transition-colors"
                onClick={() => {
                  setShowHelper(true);
                  setButtonPressed(true);
                }}
              >
                How To Use
              </Button>
            </div>
          </div>
          <TuneWizard />
        </div>

        <MusicBoxComposer />
        <LoopSamples
          items={[
            {
              text: "Loop The Cigarette Duet",
              audioUrl:
                "https://storage.googleapis.com/tunebox-stuff/samples/cigaretteDuet.mp3",
            },
            {
              text: "Loop Goodbye Weekend",
              audioUrl:
                "https://storage.googleapis.com/tunebox-stuff/samples/goodbyeWeekend.mp3",
            },
            {
              text: "Loop Moon River",
              audioUrl:
                "https://storage.googleapis.com/tunebox-stuff/samples/moonRiver.mp3",
            },
            {
              text: "Loop Swan",
              audioUrl:
                "https://storage.googleapis.com/tunebox-stuff/samples/swan.mp3",
            },
            {
              text: "Loop Mr Loverman",
              audioUrl:
                "https://storage.googleapis.com/tunebox-stuff/samples/mrLoverman.mp3",
            },
            {
              text: "Loop Brooklyn Bridge To Chorus",
              audioUrl:
                "https://storage.googleapis.com/tunebox-stuff/samples/brooklynBridgeToChorus.mp3",
            },
          ]}
        />
        {/* <ArtworkGallery /> */}
        <AboutSection />
        <Footer />
      </div>

      {showHelper && <TalkingTuneBox onClose={() => setShowHelper(false)} />}
    </main>
  );
}
