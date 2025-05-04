"use client";

import * as React from "react";
import Image from "next/image";
import {
  Play,
  Pause,
  ChevronRight,
  Disc,
  ChevronLeft,
  Info,
} from "lucide-react";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Song {
  id: string;
  title: string;
  artist: string;
  coverImage: string;
  audioUrl: string;
  separations: string[];
  notes: string;
}

const featuredSongs: Song[] = [
  {
    id: "1",
    title: "Midnight Serenade",
    artist: "Luna Rivers",
    coverImage: "/placeholder.svg?key=t5wnu",
    audioUrl: "/songs/midnight-serenade.mp3",
    separations: ["Vocals", "Piano", "Strings", "Percussion"],
    notes:
      "This piece features a haunting melody with subtle string arrangements that build throughout the track.",
  },
  {
    id: "2",
    title: "Sunlight Dance",
    artist: "The Rhythm Collective",
    coverImage: "/placeholder.svg?key=g6osp",
    audioUrl: "/songs/sunlight-dance.mp3",
    separations: ["Vocals", "Guitar", "Bass", "Drums", "Synth"],
    notes:
      "An upbeat summer track with layered vocal harmonies and a catchy guitar hook.",
  },
  {
    id: "3",
    title: "Electric Dreams",
    artist: "Neon Pulse",
    coverImage: "/placeholder.svg?key=6yuqn",
    audioUrl: "/songs/electric-dreams.mp3",
    separations: [
      "Lead Vocals",
      "Backing Vocals",
      "Synth Bass",
      "Drums",
      "Lead Synth",
      "Pads",
    ],
    notes:
      "A synthwave-inspired track with retro electronic sounds and modern production techniques.",
  },
  {
    id: "4",
    title: "Autumn Leaves",
    artist: "Acoustic Ensemble",
    coverImage: "/placeholder.svg?key=zdq0a",
    audioUrl: "/songs/autumn-leaves.mp3",
    separations: [
      "Vocals",
      "Acoustic Guitar",
      "Cello",
      "Piano",
      "Light Percussion",
    ],
    notes:
      "A gentle acoustic ballad with warm cello lines and delicate piano accompaniment.",
  },
  {
    id: "5",
    title: "Urban Echoes",
    artist: "City Soundscape",
    coverImage: "/placeholder.svg?key=svtjf",
    audioUrl: "/songs/urban-echoes.mp3",
    separations: ["Vocals", "Beats", "Samples", "Synth", "Bass"],
    notes:
      "A fusion of urban sounds and electronic beats with layered vocal samples.",
  },
  {
    id: "6",
    title: "Ocean Waves",
    artist: "Coastal Vibes",
    coverImage: "/placeholder.svg?key=hyx4a",
    audioUrl: "/songs/ocean-waves.mp3",
    separations: ["Ambient Sounds", "Piano", "Synth Pads", "Percussion"],
    notes:
      "A relaxing ambient piece inspired by the sounds of the ocean and coastal landscapes.",
  },
];

export function FeaturedCarousel() {
  const [currentlyPlaying, setCurrentlyPlaying] = React.useState<string | null>(
    null
  );
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  const handlePlay = (song: Song) => {
    if (audioRef.current) {
      if (currentlyPlaying === song.id) {
        // If the same song is clicked, toggle play/pause
        if (audioRef.current.paused) {
          audioRef.current.play();
        } else {
          audioRef.current.pause();
        }
      } else {
        // If a different song is clicked, update the audio source and play
        audioRef.current.src = song.audioUrl;
        audioRef.current.play();
        setCurrentlyPlaying(song.id);
      }
    }
  };

  return (
    <section className="py-10">
      <div className="container">
        <h2 className="text-3xl font-bold sm:text-4xl text-center mb-10">
          Featured Tracks
        </h2>

        <div className="relative">
          <Carousel
            opts={{
              align: "start",
            }}
            className="w-full"
          >
            <CarouselContent className="-ml-4 md:-ml-6">
              {featuredSongs.map((song) => (
                <CarouselItem
                  key={song.id}
                  className="pl-4 md:pl-6 basis-full xs:basis-3/4 sm:basis-3/5 md:basis-2/5 lg:basis-1/3 xl:basis-1/4"
                >
                  <div className="group h-full">
                    {/* Split design card */}
                    <div className="relative h-full flex flex-col">
                      {/* Top half - Image and play button */}
                      <div className="relative">
                        {/* Circular image container */}
                        <div className="relative mx-auto w-[90%] aspect-square overflow-hidden rounded-full border-[4px] border-black dark:border-white">
                          <Image
                            src={song.coverImage || "/placeholder.svg"}
                            alt={`${song.title} by ${song.artist}`}
                            fill
                            className={cn(
                              "object-cover grayscale transition-all duration-700",
                              currentlyPlaying === song.id &&
                                !audioRef.current?.paused
                                ? "animate-[spin_20s_linear_infinite]"
                                : ""
                            )}
                          />

                          {/* Center hole */}
                          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[15%] h-[15%] rounded-full bg-black dark:bg-white border border-white dark:border-black z-10"></div>
                        </div>

                        {/* Play button */}
                        <Button
                          className={cn(
                            "absolute bottom-0 right-0 h-12 w-12 rounded-full bg-white text-black border-2 border-black hover:bg-black hover:text-white dark:bg-black dark:text-white dark:border-white dark:hover:bg-white dark:hover:text-black transition-colors shadow-md",
                            currentlyPlaying === song.id
                              ? "bg-black text-white dark:bg-white dark:text-black"
                              : ""
                          )}
                          onClick={() => handlePlay(song)}
                        >
                          {currentlyPlaying === song.id &&
                          !audioRef.current?.paused ? (
                            <Pause className="h-5 w-5" />
                          ) : (
                            <Play className="h-5 w-5" />
                          )}
                          <span className="sr-only">
                            {currentlyPlaying === song.id &&
                            !audioRef.current?.paused
                              ? `Pause ${song.title}`
                              : `Play ${song.title}`}
                          </span>
                        </Button>
                      </div>

                      {/* Bottom half - Text and details */}
                      <div className="mt-6 text-center px-2">
                        <h3 className="font-bold text-xl tracking-tight line-clamp-1">
                          {song.title}
                        </h3>
                        <p className="text-muted-foreground text-base mt-2">
                          {song.artist}
                        </p>

                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              size="sm"
                              className="mt-4 rounded-full bg-white text-black border border-black hover:bg-black hover:text-white dark:bg-black dark:text-white dark:border-white dark:hover:bg-white dark:hover:text-black transition-colors"
                            >
                              <Info className="h-3.5 w-3.5 mr-1.5" />
                              Details
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-md border border-black dark:border-white rounded-none">
                            <DialogHeader>
                              <DialogTitle className="text-2xl">
                                {song.title}
                              </DialogTitle>
                              <DialogDescription className="text-base">
                                By {song.artist}
                              </DialogDescription>
                            </DialogHeader>

                            <div className="grid gap-6 py-4">
                              <div className="flex items-start gap-6">
                                <div className="relative h-36 w-36 overflow-hidden rounded-full border-2 border-black dark:border-white">
                                  <Image
                                    src={song.coverImage || "/placeholder.svg"}
                                    alt={`${song.title} by ${song.artist}`}
                                    fill
                                    className="object-cover grayscale"
                                  />
                                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[15%] h-[15%] rounded-full bg-black dark:bg-white z-10"></div>
                                </div>
                                <div className="flex-1">
                                  <h4 className="text-base font-bold uppercase tracking-wider mb-3">
                                    Separations
                                  </h4>
                                  <div className="flex flex-wrap gap-2">
                                    {song.separations.map((separation) => (
                                      <Badge
                                        key={separation}
                                        className="text-sm rounded-none bg-white text-black border border-black dark:bg-black dark:text-white dark:border-white"
                                      >
                                        {separation}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              </div>

                              <div>
                                <h4 className="text-base font-bold uppercase tracking-wider mb-3">
                                  Notes
                                </h4>
                                <p className="text-base text-muted-foreground">
                                  {song.notes}
                                </p>
                              </div>

                              <div className="flex justify-end">
                                <Button
                                  onClick={() => handlePlay(song)}
                                  className="gap-2 rounded-none bg-white text-black border border-black hover:bg-black hover:text-white dark:bg-black dark:text-white dark:border-white dark:hover:bg-white dark:hover:text-black transition-colors h-10 px-5 text-base"
                                >
                                  {currentlyPlaying === song.id &&
                                  !audioRef.current?.paused ? (
                                    <>
                                      <Pause className="h-4 w-4" />
                                      Pause
                                    </>
                                  ) : (
                                    <>
                                      <Play className="h-4 w-4" />
                                      Play Track
                                    </>
                                  )}
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>

                        {currentlyPlaying === song.id &&
                          !audioRef.current?.paused && (
                            <div className="mt-3 flex items-center justify-center gap-2 text-sm">
                              <Disc className="h-4 w-4 animate-spin" />
                              <span>Now Playing</span>
                            </div>
                          )}
                      </div>
                    </div>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>

            {/* Custom navigation controls at the bottom */}
            <div className="flex justify-center items-center gap-4 mt-8">
              <CarouselPrevious
                className="static transform-none border border-black dark:border-white h-10 w-10 rounded-full 
                bg-white text-black hover:bg-black hover:text-white 
                dark:bg-black dark:text-white dark:hover:bg-white dark:hover:text-black"
              >
                <ChevronLeft className="h-5 w-5" />
              </CarouselPrevious>

              <CarouselNext
                className="static transform-none border border-black dark:border-white h-10 w-10 rounded-full
                bg-white text-black hover:bg-black hover:text-white 
                dark:bg-black dark:text-white dark:hover:bg-white dark:hover:text-black"
              >
                <ChevronRight className="h-5 w-5" />
              </CarouselNext>
            </div>
          </Carousel>
        </div>

        {/* Hidden audio element for playback */}
        <audio ref={audioRef} className="hidden" />
      </div>
    </section>
  );
}
