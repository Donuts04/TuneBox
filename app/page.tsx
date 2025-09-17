"use client";

import Navbar from "@/components/Navbar/Navbar";
import ProcessingOptions from "@/components/processing-options";
import { AudioProcessingProvider } from "@/contexts/audio-processing-context";
import {
  Search,
  SplitSquareVertical,
  Music,
  Sparkles,
  Piano,
  Clock,
  Mic2,
  Drum,
  Info,
} from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { motion } from "framer-motion";
import { FeaturedCarousel } from "@/components/featured-carousel";
import { MusicBoxComposer } from "@/components/MusicBoxComposer";
import { AboutSection } from "@/components/about-section";
import Footer from "@/components/footer";
import AudioHeader from "@/components/AudioCard.tsx/AudioHeader";

export default function Home() {
  const [showDialog, setShowDialog] = useState(false);

  const steps = [
    {
      icon: <Search className="h-6 w-6" />,
      title: "Find Your Music",
      description: "Search for a song or upload your own audio file",
    },
    {
      icon: <SplitSquareVertical className="h-6 w-6" />,
      title: "Choose Your Path",
      description:
        "Decide whether to separate your audio or convert it to notes",
    },
    {
      icon: <Music className="h-6 w-6" />,
      title: "Transform Your Sound",
      description: "Watch as TuneBox works its magic on your audio",
    },
    {
      icon: <Sparkles className="h-6 w-6" />,
      title: "Enjoy & Create",
      description: "Download your processed audio and get creative!",
    },
  ];

  const separationModels = [
    {
      id: "spleeter-2",
      name: "Basic",
      description: "Vocals + Accompaniment",
      icon: <Mic2 className="h-5 w-5" />,
    },
    {
      id: "spleeter-4",
      name: "Basic +",
      description: "Vocals + Drums + Bass + Other",
      icon: <Drum className="h-5 w-5" />,
    },
    {
      id: "spleeter-5",
      name: "Extended",
      description: "Vocals + Drums + Bass + Piano + Other",
      icon: <Piano className="h-5 w-5" />,
    },
    {
      id: "demucs",
      name: "Advanced Separation",
      description: "Vocals + Drums + Bass + Other (High Quality)",
      icon: <Clock className="h-5 w-5" />,
      note: "This model takes longer to process (watch the hamster run while you wait)",
    },
  ];

  return (
    <AudioProcessingProvider>
      <main className="min-h-screen bg-white dark:bg-black mx-auto">
        <div className="w-full max-w-7xl mx-auto px-4 py-6">
          <Navbar />
        </div>

        <div className="container mx-auto px-4 max-w-7xl space-y-32 py-16 md:py-24">
          <div>
            <div className="flex flex-col items-center justify-center">
              <h1 className="text-5xl font-bold tracking-tighter px-5 md:px-12 text-center">
                Transform Your Music Experience
              </h1>

              <Image
                src="/tuneboxLogo.png"
                alt="TuneBox Logo"
                width={450}
                height={450}
                className="object-cover dark:invert w-[300px] h-[300px] md:w-[450px] md:h-[450px]"
                priority
              />

              <p className="text-base md:text-xl text-gray-700 dark:text-gray-300 max-w-md text-center tracking-normal leading-tight">
                Separate audio tracks and convert them into musical notes with
                TuneBox!
              </p>
            </div>
          </div>

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
                className="rounded-full mb-3 border-black/50 dark:border-white/50 text-black dark:text-white hover:text-white hover:dark:text-black bg-transparent hover:bg-black dark:hover:bg-white transition-colors"
                onClick={() => setShowDialog(true)}
              >
                How To Use
              </Button>
            </div>
            <ProcessingOptions />
          </div>

          <MusicBoxComposer />
          {/* <ArtworkGallery /> */}
          <AboutSection />
          <Footer />
        </div>

        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className="sm:max-w-md md:max-w-lg max-h-[90vh] flex flex-col bg-white dark:bg-black border border-gray-200 dark:border-gray-800 shadow-xl">
            <div className="w-full flex justify-center">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
              >
                <Image
                  src="/tuney/coolCross.png"
                  alt="TuneBox How To Use"
                  width={150}
                  height={150}
                  className="object-contain dark:invert"
                />
              </motion.div>
            </div>

            <DialogHeader className="flex-shrink-0">
              <DialogTitle className="text-2xl flex items-center gap-2 justify-center font-bold">
                <motion.span
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  How to Use TuneBox
                </motion.span>
              </DialogTitle>
            </DialogHeader>

            <div className="py-4 overflow-y-auto flex-grow pr-1">
              <div className="space-y-6">
                <div className="relative">
                  <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-black dark:bg-white"></div>

                  {steps.map((step, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.15 }}
                      className="flex items-start gap-4 relative mb-6"
                    >
                      <div className="w-10 h-10 rounded-full bg-black dark:bg-white flex items-center justify-center flex-shrink-0 z-10 text-white dark:text-black">
                        {step.icon}
                      </div>
                      <div className="flex-grow">
                        <h3 className="font-semibold text-lg">{step.title}</h3>
                        <p className="text-muted-foreground">
                          {step.description}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                  className="mt-4"
                >
                  <div className="p-4">
                    <div className="flex items-center gap-2 font-semibold mb-2">
                      <Info className="h-5 w-5" /> Pro Tip
                    </div>
                    <p>
                      For best results, try separating your audio first, then
                      convert one of them to notes. This gives you cleaner and
                      more accurate note detection ;)
                    </p>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="mt-6"
                >
                  <div className="p-3 flex justify-center gap-2">
                    <h3 className="font-semibold text-lg">Separation Models</h3>
                  </div>
                  <div className="bg-white dark:bg-black p-4">
                    <div className="grid grid-cols-1 gap-3">
                      {separationModels.map((model, index) => (
                        <div key={index} className="flex items-start gap-3 p-2">
                          <div className="w-8 h-8 rounded-full bg-black dark:bg-white flex items-center justify-center flex-shrink-0 z-10 text-white dark:text-black">
                            {model.icon}
                          </div>
                          <div>
                            <p className="font-medium">{model.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {model.description}
                            </p>
                            {model.note && (
                              <p className="text-sm text-muted-foreground pt-1">
                                {model.note}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                  className="mt-4"
                >
                  <div className="p-3 flex justify-center gap-2">
                    <h3 className="font-semibold text-lg">
                      Note Playback Sounds
                    </h3>
                  </div>
                  <div className="bg-white dark:bg-black p-4">
                    <p>
                      Choose from various sound options such as piano, synth,
                      and even meow meow cat sounds!
                    </p>
                  </div>
                </motion.div>
              </div>
            </div>

            <DialogFooter className="flex items-center justify-between sm:justify-between mt-4 flex-shrink-0 border-t border-gray-200 dark:border-gray-800 pt-4">
              <p className="text-sm text-muted-foreground">Ready to start?</p>
              <Button
                onClick={() => setShowDialog(false)}
                className="bg-black hover:bg-gray-800 text-white dark:bg-white dark:hover:bg-gray-200 dark:text-black"
              >
                YIPPIE!
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </AudioProcessingProvider>
  );
}
