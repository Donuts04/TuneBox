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

export default function Home() {
  const [showHelper, setShowHelper] = useState(false);

  return (
    <main className="min-h-screen bg-white dark:bg-black">
      <div className="w-full max-w-7xl mx-auto px-4 py-6">
        <Navbar />
      </div>

      <section className="h-screen w-full max-w-7xl mx-auto px-4 h-full">
        <div className="flex h-full flex-col items-center justify-center text-center gap-6">
          <h1 className="text-5xl font-bold tracking-tight">
            Transform Your Music Experience
          </h1>
          <Image
            src="/TuneBoxLogo.png"
            alt="TuneBox Logo"
            width={450}
            height={450}
            className="dark:invert w-[300px] h-[300px] md:w-[450px] md:h-[450px]"
            priority
          />
          <p className="text-base md:text-xl text-muted-foreground max-w-md">
            Separate audio tracks and convert them into musical notes with
            TuneBox!
          </p>
        </div>
      </section>

      <div className="container mx-auto px-4 max-w-7xl space-y-32 py-16 md:py-24">
        <FeaturedCarousel />

        <div>
          <div className="flex items-end justify-between gap-4">
            <Image
              src="/tuney/pointRight.png"
              alt="TuneBox Logo"
              width={150}
              height={150}
              className="object-cover dark:invert"
              priority
            />

            <Button
              variant="outline"
              className="mb-3 border-black/50 dark:border-white/50 text-black dark:text-white hover:text-white hover:dark:text-black bg-transparent hover:bg-black dark:hover:bg-white transition-colors"
              onClick={() => setShowHelper(true)}
            >
              How To Use
            </Button>
          </div>
          <TuneWizard />
        </div>

        <MusicBoxComposer />
        <LoopSamples
          items={[
            {
              text: "Loop The Cigarette Duet",
              audioUrl: "/featured/samples/cigaretteDuet.wav",
            },
            {
              text: "Loop Goodbye Weekend",
              audioUrl: "/featured/samples/goodbyeWeekend.wav",
            },
            {
              text: "Loop Moon River",
              audioUrl: "/featured/samples/moonRiver.wav",
            },
            { text: "Loop Swan", audioUrl: "/featured/samples/swan.wav" },
            {
              text: "Loop Brooklyn Bridge To Chorus",
              audioUrl: "/featured/samples/brooklynBridgeToChorus.wav",
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
