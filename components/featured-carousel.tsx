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
  ArrowLeft,
} from "lucide-react";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import StemPlayer from "@/components/AudioSeperator/StemPlayer";
import AudioEffects from "@/components/AudioEffects/AudioEffects";
import MidiPlayer from "@/components/ConvertToNotes/MidiPlayer";
import { Midi } from "@tonejs/midi";
import AudioHeader from "./AudioCard.tsx/AudioHeader";

interface AudioEffectsSettings {
  speed?: number;
  reverb?: number; // reverbWet
  delay?: number; // reverbDecay
  // Add more effects as needed
}

interface Song {
  id: string;
  title: string;
  artist: string;
  coverImage: string;
  audioUrl: string;
  audioUrls: Record<string, string>;
  audioEffects?: AudioEffectsSettings;
  midi: Midi | null;
}

const featuredSongs: Song[] = [
  {
    id: "1",
    title: "Stargazing",
    artist: "The Neighbourhood",
    coverImage: "/featured/stargazing/stargazing.jpg",
    audioUrl: "/featured/stargazing/original.mp3",
    audioUrls: {
      other: "/featured/stargazing/other.mp3",
      vocals: "/featured/stargazing/vocals.mp3",
      bass: "/featured/stargazing/bass.mp3",
      drums: "/featured/stargazing/drums.mp3",
    },
    audioEffects: {
      speed: 1.2,
      reverb: 0.85,
      delay: 5.5,
    },
    midi: null,
  },

  // {
  //   id: "2",
  //   title: "Mystery of Love",
  //   artist: "Sufjan Stevens",
  //   coverImage: "/featured/mysteryOfLove/mysteryOfLove.jpg",
  //   audioUrl: "/featured/mysteryOfLove/original.mp3",
  //   audioUrls: {
  //     other: "/featured/mysteryOfLove/other.mp3",
  //     vocals: "/featured/mysteryOfLove/vocals.mp3",
  //     bass: "/featured/mysteryOfLove/bass.mp3",
  //     drums: "/featured/mysteryOfLove/drums.mp3",
  //   },
  //   audioEffects: {
  //     speed: 0.9,
  //     reverb: 0.5,
  //     delay: 3.0,
  //   },
  //   midi: null,
  // },

  {
    id: "3",
    title: "Sunsetz",
    artist: "Cigarettes After Sex",
    coverImage: "/featured/sunsetz/sunsetz.jpg",
    audioUrl: "/featured/sunsetz/original.mp3",
    audioUrls: {
      other: "/featured/sunsetz/other.mp3",
      vocals: "/featured/sunsetz/vocals.mp3",
      bass: "/featured/sunsetz/bass.mp3",
      drums: "/featured/sunsetz/drums.mp3",
    },
    audioEffects: {
      speed: 1.2,
      reverb: 0.7,
      delay: 4.0,
    },
    midi: null,
  },
  {
    id: "4",
    title: "My Love Mine All Mine",
    artist: "Mitski",
    coverImage: "/featured/myLoveMineAllMine/myLoveMineAllMine.jpg",
    audioUrl: "/featured/myLoveMineAllMine/original.mp3",
    audioUrls: {
      other: "/featured/myLoveMineAllMine/other.mp3",
      vocals: "/featured/myLoveMineAllMine/vocals.mp3",
      bass: "/featured/myLoveMineAllMine/bass.mp3",
      drums: "/featured/myLoveMineAllMine/drums.mp3",
    },
    audioEffects: {
      speed: 1.3,
      reverb: 0.5,
      delay: 3.0,
    },
    midi: null,
  },
  {
    id: "5",
    title: "Glue Song",
    artist: "Beabadoobee",
    coverImage: "/featured/glueSong/glueSong.jpg",
    audioUrl: "/featured/glueSong/original.mp3",
    audioUrls: {
      other: "/featured/glueSong/other.mp3",
      vocals: "/featured/glueSong/vocals.mp3",
      bass: "/featured/glueSong/bass.mp3",
      drums: "/featured/glueSong/drums.mp3",
    },
    audioEffects: {
      speed: 0.75,
      reverb: 0.8,
      delay: 8.0,
    },
    midi: null,
  },
  {
    id: "6",
    title: "I'm Not Them",
    artist: "Them & I",
    coverImage: "/featured/imNotThem/imNotThem.jpg",
    audioUrl: "/featured/imNotThem/original.mp3",
    audioUrls: {
      other: "/featured/imNotThem/other.mp3",
      vocals: "/featured/imNotThem/vocals.mp3",
      bass: "/featured/imNotThem/bass.mp3",
      drums: "/featured/imNotThem/drums.mp3",
    },
    audioEffects: {
      speed: 1.2,
      reverb: 0.75,
      delay: 10.0,
    },
    midi: null,
  },
  // {
  //   id: "7",
  //   title: "Lost",
  //   artist: "Frank Ocean",
  //   coverImage: "/featured/lost/lost.jpg",
  //   audioUrl: "/featured/lost/original.mp3",
  //   audioUrls: {
  //     other: "/featured/lost/other.mp3",
  //     vocals: "/featured/lost/vocals.mp3",
  //     bass: "/featured/lost/bass.mp3",
  //     drums: "/featured/lost/drums.mp3",
  //   },
  //   midi: null,
  // },

  {
    id: "8",
    title: "About You",
    artist: "The 1975",
    coverImage: "/featured/aboutYou/aboutYou.jpg",
    audioUrl: "/featured/aboutYou/original.wav",
    audioUrls: {
      other: "/featured/aboutYou/other.wav",
      vocals: "/featured/aboutYou/vocals.wav",
      bass: "/featured/aboutYou/bass.wav",
      drums: "/featured/aboutYou/drums.wav",
    },
    audioEffects: {
      speed: 0.9,
      reverb: 0.65,
      delay: 5.0,
    },
    midi: null,
  },

  {
    id: "9",
    title: "Heseeny",
    artist: "TUL8TE",
    coverImage: "/featured/heseeny/heseeny.jpg",
    audioUrl: "/featured/heseeny/original.wav",
    audioUrls: {
      other: "/featured/heseeny/other.wav",
      vocals: "/featured/heseeny/vocals.wav",
      bass: "/featured/heseeny/bass.wav",
      drums: "/featured/heseeny/drums.wav",
    },
    audioEffects: {
      speed: 0.9,
      reverb: 0.65,
      delay: 5.0,
    },
    midi: null,
  },

  {
    id: "10",
    title: "One Last Time",
    artist: "Summer Salt",
    coverImage: "/featured/oneLastTime/oneLastTime.jpg",
    audioUrl: "/featured/oneLastTime/original.wav",
    audioUrls: {
      other: "/featured/oneLastTime/other.wav",
      vocals: "/featured/oneLastTime/vocals.wav",
      bass: "/featured/oneLastTime/bass.wav",
      drums: "/featured/oneLastTime/drums.wav",
    },
    audioEffects: {
      speed: 0.9,
      reverb: 0.8,
      delay: 5.5,
    },
    midi: null,
  },

  {
    id: "11",
    title: "Pretty Boy",
    artist: "The Neighbourhood",
    coverImage: "/featured/prettyBoy/prettyBoy.jpg",
    audioUrl: "/featured/prettyBoy/original.mp3",
    audioUrls: {
      other: "/featured/oneLastTime/other.wav",
      vocals: "/featured/oneLastTime/vocals.wav",
      bass: "/featured/oneLastTime/bass.wav",
      drums: "/featured/oneLastTime/drums.wav",
    },
    audioEffects: {
      speed: 0.85,
      reverb: 0.8,
      delay: 7.0,
    },
    midi: null,
  },

  {
    id: "12",
    title: "Nothing Compares 2 U",
    artist: "Prince (Lara's Pick)",
    coverImage: "/featured/nothingCompares2U/nothingCompares2U.jpg",
    audioUrl: "/featured/nothingCompares2U/original.wav",
    audioUrls: {
      other: "/featured/oneLastTime/other.wav",
      vocals: "/featured/oneLastTime/vocals.wav",
      bass: "/featured/oneLastTime/bass.wav",
      drums: "/featured/oneLastTime/drums.wav",
    },
    audioEffects: {
      speed: 0.85,
      reverb: 0.8,
      delay: 7.0,
    },
    midi: null,
  },
  {
    id: "13",
    title: "Hold Me Down",
    artist: "Daniel Caesar (Lara's Pick)",
    coverImage: "/featured/holdMeDown/holdMeDown.jpg",
    audioUrl: "/featured/holdMeDown/original.wav",
    audioUrls: {
      other: "/featured/oneLastTime/other.wav",
      vocals: "/featured/oneLastTime/vocals.wav",
      bass: "/featured/oneLastTime/bass.wav",
      drums: "/featured/oneLastTime/drums.wav",
    },
    audioEffects: {
      speed: 0.85,
      reverb: 0.8,
      delay: 7.0,
    },
    midi: null,
  },
];

export function FeaturedCarousel() {
  const [currentlyPlaying, setCurrentlyPlaying] = React.useState<string | null>(
    null
  );
  const [selectedSong, setSelectedSong] = React.useState<Song | null>(null);
  const [showSeparator, setShowSeparator] = React.useState(false);
  const [currentSlide, setCurrentSlide] = React.useState(0);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  const carouselApi = React.useRef<CarouselApi | null>(null);

  // Initialize audio element and handle cleanup
  React.useEffect(() => {
    audioRef.current = new Audio();

    // Add event listeners
    const audio = audioRef.current;
    audio.addEventListener("ended", () => {
      setCurrentlyPlaying(null);
    });

    // Cleanup
    return () => {
      if (audio) {
        audio.pause();
        audio.removeEventListener("ended", () => {});
        audioRef.current = null;
      }
    };
  }, []);

  const handlePlay = (song: Song) => {
    if (!audioRef.current) return;

    const audio = audioRef.current;

    if (currentlyPlaying === song.id) {
      // If the same song is clicked, toggle play/pause
      if (audio.paused) {
        audio.play().catch((err) => {
          console.error("Error playing audio:", err);
        });
      } else {
        audio.pause();
        setCurrentlyPlaying(null);
      }
    } else {
      // Stop any currently playing audio
      audio.pause();

      // Update source and play new track
      audio.src = song.audioUrl;
      audio.load(); // Ensure the new source is loaded
      audio.play().catch((err) => {
        console.error("Error playing audio:", err);
      });
      setCurrentlyPlaying(song.id);
    }
  };

  const handleShowDetails = (song: Song) => {
    // Stop any currently playing audio
    if (audioRef.current) {
      audioRef.current.pause();
      setCurrentlyPlaying(null);
    }

    setSelectedSong(song);
    setShowSeparator(true);
  };

  const handleBack = () => {
    setShowSeparator(false);
    setSelectedSong(null);
    // Keep the current slide position when going back
  };

  return (
    <section className="flex flex-col items-center justify-center w-full">
      {!showSeparator ? (
        <>
          <h2 className="text-3xl font-bold sm:text-4xl text-center mb-10">
            Featured Tracks
          </h2>

          <div className="relative w-full">
            <Carousel
              opts={{
                align: "start",
                dragFree: true,
                containScroll: "trimSnaps",
              }}
              className="w-full"
              setApi={(api) => {
                carouselApi.current = api;
                if (api) {
                  // Set the current slide position when carousel is ready
                  api.scrollTo(currentSlide);

                  // Listen for slide changes to update currentSlide state
                  api.on("select", () => {
                    setCurrentSlide(api.selectedScrollSnap());
                  });
                }
              }}
            >
              <CarouselContent className="-ml-4 md:-ml-6 py-1">
                {featuredSongs.map((song) => (
                  <CarouselItem
                    key={song.id}
                    className="pl-2 md:pl-4 basis-full sm:basis-[45%] md:basis-[35%] lg:basis-[30%] xl:basis-[25%]"
                  >
                    <div className="group h-full">
                      <div className="relative h-full flex flex-col">
                        <div
                          className="relative cursor-pointer"
                          onClick={() => handlePlay(song)}
                        >
                          {currentlyPlaying === song.id &&
                            !audioRef.current?.paused && (
                              <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 bg-white text-black dark:bg-black dark:text-white border border-2 border-black dark:border-white px-2 py-0.5 text-xs font-medium flex items-center gap-1 z-20">
                                <Disc className="h-2.5 w-2.5 animate-spin" />
                                <span>Now Playing</span>
                              </div>
                            )}

                          <div className="relative mx-auto w-[90%] aspect-square">
                            <Image
                              src={song.coverImage || "/placeholder.svg"}
                              alt={`${song.title} by ${song.artist}`}
                              fill
                              className="object-cover transition-all duration-700 rounded-full border-2 border-black dark:border-white overflow-hidden"
                              style={{
                                animation:
                                  currentlyPlaying === song.id &&
                                  !audioRef.current?.paused
                                    ? "spin 20s linear infinite"
                                    : "none",
                              }}
                            />

                            <Button
                              className={cn(
                                "absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[15%] h-[15%] bg-white text-black border border-black hover:bg-black hover:text-white dark:bg-black dark:text-white dark:border-white dark:hover:bg-white dark:hover:text-black transition-colors flex items-center justify-center"
                              )}
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
                        </div>

                        <div className="mt-4 text-center px-2">
                          <h3 className="font-bold text-xl tracking-tight line-clamp-1">
                            {song.title}
                          </h3>
                          <p className="text-muted-foreground text-base">
                            {song.artist}
                          </p>

                          <Button
                            size="sm"
                            className={cn(
                              "mt-4 gap-4 bg-white text-black border border-black hover:bg-black hover:text-white dark:bg-black dark:text-white dark:border-white dark:hover:bg-white dark:hover:text-black transition-colors",
                              "shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)]"
                            )}
                            onClick={() => handleShowDetails(song)}
                          >
                            <Info className="h-3.5 w-3.5" />
                            Details
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>

              <div className="flex justify-center items-center gap-4 mt-8">
                <CarouselPrevious
                  className="static transform-none border border-black dark:border-white h-10 w-10 rounded-none
                    bg-white text-black hover:bg-black hover:text-white 
                    dark:bg-black dark:text-white dark:hover:bg-white dark:hover:text-black"
                >
                  <ChevronLeft className="h-5 w-5" />
                </CarouselPrevious>

                <CarouselNext
                  className="static transform-none border border-black dark:border-white h-10 w-10 rounded-none
                    bg-white text-black hover:bg-black hover:text-white 
                    dark:bg-black dark:text-white dark:hover:bg-white dark:hover:text-black"
                >
                  <ChevronRight className="h-5 w-5" />
                </CarouselNext>
              </div>
            </Carousel>
          </div>
        </>
      ) : (
        <div className="space-y-4 w-full">
          <div className="flex items-end justify-between gap-2">
            <Button
              variant="outline"
              size="sm"
              className="border border-black dark:border-white flex gap-1 bg-white dark:bg-black text-black dark:text-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors"
              onClick={handleBack}
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Featured
            </Button>
            <h2 className="text-xl font-semibold">Track Details</h2>
          </div>

          {selectedSong && (
            <div className="space-y-4">
              <AudioHeader
                title={selectedSong.title}
                subtitle={selectedSong.artist}
                imageUrl={selectedSong.coverImage}
                audioUrl={selectedSong.audioUrl}
              />

              <AudioEffects
                audioUrl={selectedSong.audioUrl}
                initialSpeed={selectedSong.audioEffects?.speed}
                initialReverbWet={selectedSong.audioEffects?.reverb}
                initialReverbDecay={selectedSong.audioEffects?.delay}
              />

              <StemPlayer audioUrls={selectedSong.audioUrls || {}} />

              <MidiPlayer
                midi={selectedSong.midi || null}
                originalAudioUrl={selectedSong.audioUrl}
              />
            </div>
          )}
        </div>
      )}

      <audio ref={audioRef} className="hidden" />
    </section>
  );
}
