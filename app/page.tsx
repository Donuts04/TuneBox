"use client";

import Navbar from "@/components/Navbar/Navbar";
import TuneWizard from "@/components/Wizard/TuneWizard";
import Image from "next/image";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FeaturedCarousel } from "@/components/featured-carousel";
import { MusicBoxComposer } from "@/components/MusicBoxComposer";
import { AboutSection } from "@/components/about-section";
import Footer from "@/components/footer";
import LoopSamples from "@/components/LoopSamples";
import TalkingTuneBox from "@/components/Wizard/TalkingTuneBox";
import { cn } from "@/lib/utils";

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
              <Button
                variant="outline"
                className={cn(
                  "mb-3 bg-white text-black border border-black hover:bg-black hover:text-white dark:bg-black dark:text-white dark:border-white dark:hover:bg-white dark:hover:text-black transition-colors",
                  !buttonPressed &&
                    "shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] dark:shadow-[5px_5px_0px_0px_rgba(255,255,255,1)]"
                )}
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
