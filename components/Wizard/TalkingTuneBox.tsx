"use client";

import Image from "next/image";
import { useState } from "react";
import { motion } from "framer-motion";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

type Step = {
  title: string;
  description: string;
};

interface TalkingTuneBoxProps {
  onClose: () => void;
}

export default function TalkingTuneBox({ onClose }: TalkingTuneBoxProps) {
  const [index, setIndex] = useState(0);

  const steps: Step[] = [
    {
      title: "Elo Mate!",
      description:
        "I'm Tuney, your music assistant! Ready to transform some tunes? Let me show you what I can do!",
    },
    {
      title: "First things first...",
      description:
        "You can either search for a song using music search, or upload your own audio file.",
    },
    {
      title: "Want to spice things up?",
      description:
        "I can speed up or slow down your song and add some awesome reverb effects. Perfect for creating different vibes!",
    },
    {
      title: "Here's where it gets fun...",
      description:
        "I can split your song into separate parts - vocals, drums, bass, and other instruments. Play them one by one or mix them like a DJ!",
    },
    {
      title: "And finally...",
      description:
        "I can convert your audio into musical notes, it is a hit or miss tho, some songs are goated others meh. Pretty cool, right?",
    },
  ];

  const goPrev = () => setIndex((i) => (i - 1 + steps.length) % steps.length);
  const goNext = () => setIndex((i) => (i + 1) % steps.length);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ type: "spring", stiffness: 260, damping: 22 }}
      className="fixed bottom-4 right-4 z-50 p-4 sm:p-0"
      role="dialog"
      aria-label="How to use TuneBox"
    >
      <div className="relative flex items-end gap-3">
        <motion.div
          key="bubble"
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="max-w-xs sm:max-w-sm bg-white dark:bg-black text-black dark:text-white border border-black dark:border-white shadow-lg p-4"
        >
          <div className="flex-1 min-w-0">
            <p className="font-semibold leading-snug truncate">
              {steps[index]?.title}
            </p>
            <p className="text-sm text-muted-foreground leading-snug break-words mt-0.5">
              {steps[index]?.description}
            </p>
          </div>

          <div className="flex items-center justify-between mt-3">
            <div className="text-xs text-muted-foreground">
              {index + 1} of {steps.length}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={goPrev}
                className="h-8 w-8 inline-flex items-center justify-center border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-zinc-900"
                aria-label="Previous step"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={goNext}
                className="h-8 w-8 inline-flex items-center justify-center  border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-zinc-900"
                aria-label="Next step"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 10, opacity: 0 }}
          transition={{ delay: 0.05 }}
          className="shrink-0 flex flex-col items-end gap-2 -mr-4 sm:mr-0"
        >
          <button
            aria-label="Close helper"
            onClick={onClose}
            className="inline-flex items-center justify-center h-7 w-7 bg-black text-white dark:bg-white dark:text-black shadow hover:opacity-90"
          >
            <X className="h-4 w-4" />
          </button>
          <Image
            src="https://storage.googleapis.com/tunebox-stuff/tuney/coolCross.png"
            alt="TuneBox Assistant"
            width={84}
            height={84}
            className="object-contain dark:invert"
            priority
          />
        </motion.div>
      </div>
    </motion.div>
  );
}
