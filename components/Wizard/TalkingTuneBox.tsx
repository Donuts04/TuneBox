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
      title: "Find Your Music",
      description: "Search for a song or upload your own audio file",
    },
    {
      title: "Choose Your Path",
      description:
        "Decide whether to separate your audio or convert it to notes",
    },
    {
      title: "Transform Your Sound",
      description: "Watch as TuneBox works its magic on your audio",
    },
    {
      title: "Enjoy & Create",
      description: "Download your processed audio and get creative!",
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
      className="fixed bottom-4 right-4 z-50"
      role="dialog"
      aria-label="How to use TuneBox"
    >
      <div className="relative flex items-end gap-3">
        <motion.div
          key="bubble"
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="max-w-xs sm:max-w-sm bg-white dark:bg-black text-black dark:text-white border border-gray-200 dark:border-gray-800 shadow-lg rounded-2xl p-4"
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
              Step {index + 1} of {steps.length}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={goPrev}
                className="h-8 w-8 inline-flex items-center justify-center rounded-full border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-zinc-900"
                aria-label="Previous step"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={goNext}
                className="h-8 w-8 inline-flex items-center justify-center rounded-full border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-zinc-900"
                aria-label="Next step"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div
            className="absolute -bottom-2 right-24 h-4 w-4 rotate-45 bg-white dark:bg-black border-r border-b border-gray-200 dark:border-gray-800"
            aria-hidden="true"
          />
        </motion.div>

        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 10, opacity: 0 }}
          transition={{ delay: 0.05 }}
          className="shrink-0 flex flex-col items-end gap-2"
        >
          <button
            aria-label="Close helper"
            onClick={onClose}
            className="inline-flex items-center justify-center h-7 w-7 rounded-full bg-black text-white dark:bg-white dark:text-black shadow hover:opacity-90"
          >
            <X className="h-4 w-4" />
          </button>
          <Image
            src="/tuney/coolCross.png"
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
