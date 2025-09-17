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
} from "@/components/ui/carousel";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import AudioSeparator from "@/components/AudioSeperator/audio-separator";

interface AudioSource {
  name: string;
  color: string;
  icon: React.ReactNode;
  audioUrl: string;
  downloadLink: string;
}

interface Stem {
  name: string;
  color: string;
  icon: React.ReactNode;
  audioUrl: string;
}

interface Song {
  id: string;
  title: string;
  artist: string;
  coverImage: string;
  audioUrl: string;
  separations: string[];
  notes: string;
  stems?: Record<string, Stem>;
}

const featuredSongs: Song[] = [
  {
    id: "1",
    title: "Stargazing",
    artist: "The Neighbourhood",
    coverImage: "/featured/stargazing/stargazing.jpg",
    audioUrl: "/featured/stargazing/original.mp3",
    separations: ["Instrumental", "Vocals", "Bass", "Drums"],
    notes: "Calm",
    stems: {
      instrumental: {
        name: "Instrumental",
        color: "bg-purple-500 hover:bg-purple-600",
        icon: <Disc className="h-4 w-4" />,
        audioUrl: "/featured/stargazing/instrumental.mp3",
      },
      vocals: {
        name: "Vocals",
        color: "bg-green-500 hover:bg-green-600",
        icon: <Disc className="h-4 w-4" />,
        audioUrl: "/featured/stargazing/vocals.mp3",
      },
      bass: {
        name: "Bass",
        color: "bg-blue-500 hover:bg-blue-600",
        icon: <Disc className="h-4 w-4" />,
        audioUrl: "/featured/stargazing/bass.mp3",
      },
      drums: {
        name: "Drums",
        color: "bg-red-500 hover:bg-red-600",
        icon: <Disc className="h-4 w-4" />,
        audioUrl: "/featured/stargazing/drums.mp3",
      },
    },
  },
  {
    id: "2",
    title: "Mystery of Love",
    artist: "Sufjan Stevens",
    coverImage: "/featured/mysteryOfLove/mysteryOfLove.jpg",
    audioUrl: "/featured/mysteryOfLove/original.mp3",
    separations: ["Instrumental", "Vocals", "Bass", "Drums"],
    notes: "Calm",
    stems: {
      instrumental: {
        name: "Instrumental",
        color: "bg-purple-500 hover:bg-purple-600",
        icon: <Disc className="h-4 w-4" />,
        audioUrl: "/featured/mysteryOfLove/instrumental.mp3",
      },
      vocals: {
        name: "Vocals",
        color: "bg-green-500 hover:bg-green-600",
        icon: <Disc className="h-4 w-4" />,
        audioUrl: "/featured/mysteryOfLove/vocals.mp3",
      },
      bass: {
        name: "Bass",
        color: "bg-blue-500 hover:bg-blue-600",
        icon: <Disc className="h-4 w-4" />,
        audioUrl: "/featured/mysteryOfLove/bass.mp3",
      },
      drums: {
        name: "Drums",
        color: "bg-red-500 hover:bg-red-600",
        icon: <Disc className="h-4 w-4" />,
        audioUrl: "/featured/mysteryOfLove/drums.mp3",
      },
    },
  },
  {
    id: "3",
    title: "Sunsetz",
    artist: "Cigarettes After Sex",
    coverImage: "/featured/sunsetz/sunsetz.jpg",
    audioUrl: "/featured/sunsetz/original.mp3",
    separations: ["Instrumental", "Vocals", "Bass", "Drums"],
    notes: "CAS",
    stems: {
      instrumental: {
        name: "Instrumental",
        color: "bg-amber-500 hover:bg-amber-600",
        icon: <Disc className="h-4 w-4" />,
        audioUrl: "/featured/sunsetz/instrumental.mp3",
      },
      vocals: {
        name: "Vocals",
        color: "bg-purple-500 hover:bg-purple-600",
        icon: <Disc className="h-4 w-4" />,
        audioUrl: "/featured/sunsetz/vocals.mp3",
      },
      bass: {
        name: "Bass",
        color: "bg-blue-500 hover:bg-blue-600",
        icon: <Disc className="h-4 w-4" />,
        audioUrl: "/featured/sunsetz/bass.mp3",
      },
      drums: {
        name: "Drums",
        color: "bg-red-500 hover:bg-red-600",
        icon: <Disc className="h-4 w-4" />,
        audioUrl: "/featured/sunsetz/drums.mp3",
      },
    },
  },
  {
    id: "4",
    title: "My Love Mine All Mine",
    artist: "Mitski",
    coverImage: "/featured/myLoveMineAllMine/myLoveMineAllMine.jpg",
    audioUrl: "/featured/myLoveMineAllMine/original.mp3",
    separations: ["Instrumental", "Vocals", "Bass", "Drums"],
    notes:
      "A synthwave-inspired track with retro electronic sounds and modern production techniques.",
    stems: {
      instrumental: {
        name: "Instrumental",
        color: "bg-purple-500 hover:bg-purple-600",
        icon: <Disc className="h-4 w-4" />,
        audioUrl: "/featured/mysteryOfLove/instrumental.mp3",
      },
      vocals: {
        name: "Vocals",
        color: "bg-green-500 hover:bg-green-600",
        icon: <Disc className="h-4 w-4" />,
        audioUrl: "/featured/mysteryOfLove/vocals.mp3",
      },
      bass: {
        name: "Bass",
        color: "bg-blue-500 hover:bg-blue-600",
        icon: <Disc className="h-4 w-4" />,
        audioUrl: "/featured/mysteryOfLove/bass.mp3",
      },
      drums: {
        name: "Drums",
        color: "bg-red-500 hover:bg-red-600",
        icon: <Disc className="h-4 w-4" />,
        audioUrl: "/featured/mysteryOfLove/drums.mp3",
      },
    },
  },
  {
    id: "5",
    title: "Glue Song",
    artist: "Beabadoobee",
    coverImage: "/featured/glueSong/glueSong.jpg",
    audioUrl: "/featured/glueSong/original.mp3",
    separations: ["Instrumental", "Vocals", "Bass", "Drums"],
    notes:
      "A gentle acoustic ballad with warm cello lines and delicate piano accompaniment.",
    stems: {
      instrumental: {
        name: "Instrumental",
        color: "bg-purple-500 hover:bg-purple-600",
        icon: <Disc className="h-4 w-4" />,
        audioUrl: "/featured/mysteryOfLove/instrumental.mp3",
      },
      vocals: {
        name: "Vocals",
        color: "bg-green-500 hover:bg-green-600",
        icon: <Disc className="h-4 w-4" />,
        audioUrl: "/featured/mysteryOfLove/vocals.mp3",
      },
      bass: {
        name: "Bass",
        color: "bg-blue-500 hover:bg-blue-600",
        icon: <Disc className="h-4 w-4" />,
        audioUrl: "/featured/mysteryOfLove/bass.mp3",
      },
      drums: {
        name: "Drums",
        color: "bg-red-500 hover:bg-red-600",
        icon: <Disc className="h-4 w-4" />,
        audioUrl: "/featured/mysteryOfLove/drums.mp3",
      },
    },
  },
  {
    id: "6",
    title: "I'm Not Them",
    artist: "Them & I",
    coverImage: "/featured/imNotThem/imNotThem.jpg",
    audioUrl: "/featured/imNotThem/original.mp3",
    separations: ["Instrumental", "Vocals", "Bass", "Drums"],
    notes:
      "A fusion of urban sounds and electronic beats with layered vocal samples.",
    stems: {
      instrumental: {
        name: "Instrumental",
        color: "bg-purple-500 hover:bg-purple-600",
        icon: <Disc className="h-4 w-4" />,
        audioUrl: "/featured/mysteryOfLove/instrumental.mp3",
      },
      vocals: {
        name: "Vocals",
        color: "bg-green-500 hover:bg-green-600",
        icon: <Disc className="h-4 w-4" />,
        audioUrl: "/featured/mysteryOfLove/vocals.mp3",
      },
      bass: {
        name: "Bass",
        color: "bg-blue-500 hover:bg-blue-600",
        icon: <Disc className="h-4 w-4" />,
        audioUrl: "/featured/mysteryOfLove/bass.mp3",
      },
      drums: {
        name: "Drums",
        color: "bg-red-500 hover:bg-red-600",
        icon: <Disc className="h-4 w-4" />,
        audioUrl: "/featured/mysteryOfLove/drums.mp3",
      },
    },
  },

  // {
  //   id: "6",
  //   title: "Pretty Boy",
  //   artist: "The Neighbourhood",
  //   coverImage: "/featured/prettyBoy/prettyBoy.jpg",
  //   audioUrl: "/featured/prettyBoy/original.mp3",
  //   separations: ["Instrumental", "Vocals", "Bass", "Drums"],
  //   notes:
  //     "A relaxing ambient piece inspired by the sounds of the ocean and coastal landscapes.",
  //   stems: {
  //     instrumental: {
  //       name: "Instrumental",
  //       color: "bg-purple-500 hover:bg-purple-600",
  //       icon: <Disc className="h-4 w-4" />,
  //       audioUrl: "/featured/mysteryOfLove/instrumental.mp3",
  //     },
  //     vocals: {
  //       name: "Vocals",
  //       color: "bg-green-500 hover:bg-green-600",
  //       icon: <Disc className="h-4 w-4" />,
  //       audioUrl: "/featured/mysteryOfLove/vocals.mp3",
  //     },
  //     bass: {
  //       name: "Bass",
  //       color: "bg-blue-500 hover:bg-blue-600",
  //       icon: <Disc className="h-4 w-4" />,
  //       audioUrl: "/featured/mysteryOfLove/bass.mp3",
  //     },
  //     drums: {
  //       name: "Drums",
  //       color: "bg-red-500 hover:bg-red-600",
  //       icon: <Disc className="h-4 w-4" />,
  //       audioUrl: "/featured/mysteryOfLove/drums.mp3",
  //     },
  //   },
  // },
  {
    id: "7",
    title: "Lost",
    artist: "Frank Ocean",
    coverImage: "/featured/lost/lost.jpg",
    audioUrl: "/featured/lost/original.mp3",
    separations: ["Instrumental", "Vocals", "Bass", "Drums"],
    notes: "Calm",
    stems: {
      instrumental: {
        name: "Instrumental",
        color: "bg-purple-500 hover:bg-purple-600",
        icon: <Disc className="h-4 w-4" />,
        audioUrl: "/featured/stargazing/instrumental.mp3",
      },
      vocals: {
        name: "Vocals",
        color: "bg-green-500 hover:bg-green-600",
        icon: <Disc className="h-4 w-4" />,
        audioUrl: "/featured/mysteryOfLove/vocals.mp3",
      },
      bass: {
        name: "Bass",
        color: "bg-blue-500 hover:bg-blue-600",
        icon: <Disc className="h-4 w-4" />,
        audioUrl: "/featured/mysteryOfLove/bass.mp3",
      },
      drums: {
        name: "Drums",
        color: "bg-red-500 hover:bg-red-600",
        icon: <Disc className="h-4 w-4" />,
        audioUrl: "/featured/mysteryOfLove/drums.mp3",
      },
    },
  },
];

export function FeaturedCarousel() {
  const [currentlyPlaying, setCurrentlyPlaying] = React.useState<string | null>(
    null
  );
  const [selectedSong, setSelectedSong] = React.useState<Song | null>(null);
  const [showSeparator, setShowSeparator] = React.useState(false);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

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
    setSelectedSong(song);
    setShowSeparator(true);
  };

  const handleBack = () => {
    setShowSeparator(false);
    setSelectedSong(null);
  };

  // Convert song to DeezerTrack format for AudioSeparator
  const convertToDeezerTrack = (song: Song) => {
    return {
      id: parseInt(song.id),
      title: song.title,
      preview: song.audioUrl,
      artist: {
        id: 0, // Placeholder ID since we don't have it
        name: song.artist,
      },
      album: {
        id: 0, // Placeholder ID since we don't have it
        title: song.title,
        cover: song.coverImage,
        cover_small: song.coverImage,
        cover_medium: song.coverImage,
      },
      duration: 180, // Default duration of 3 minutes
      link: song.audioUrl, // Using audioUrl as the link
    };
  };

  // Convert stems to AudioSource format for AudioSeparator
  const convertStems = (stems: Record<string, Stem> | undefined) => {
    if (!stems) return {};

    const convertedStems: Record<string, AudioSource> = {};

    Object.entries(stems).forEach(([key, stem]) => {
      convertedStems[key] = {
        name: stem.name,
        color: stem.color,
        icon: stem.icon,
        audioUrl: stem.audioUrl,
        downloadLink: stem.audioUrl,
      };
    });

    return convertedStems;
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
              }}
              className="w-full"
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
                              <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 bg-white text-black dark:bg-black dark:text-white border border-2 border-black dark:border-white px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 z-20">
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
                                "absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[17%] h-[17%] rounded-full bg-white text-black border border-black hover:bg-black hover:text-white dark:bg-black dark:text-white dark:border-white dark:hover:bg-white dark:hover:text-black transition-colors flex items-center justify-center"
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

                        <div className="mt-6 text-center px-2">
                          <h3 className="font-bold text-xl tracking-tight line-clamp-1">
                            {song.title}
                          </h3>
                          <p className="text-muted-foreground text-base mt-2">
                            {song.artist}
                          </p>

                          <Button
                            size="sm"
                            className="mt-4 rounded-full bg-white text-black border border-black hover:bg-black hover:text-white dark:bg-black dark:text-white dark:border-white dark:hover:bg-white dark:hover:text-black transition-colors"
                            onClick={() => handleShowDetails(song)}
                          >
                            <Info className="h-3.5 w-3.5 mr-1.5" />
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
        </>
      ) : (
        <div className="space-y-4 w-full">
          <div className="flex items-center justify-between gap-2">
            <Button
              variant="outline"
              size="sm"
              className="rounded-full border border-black dark:border-white flex gap-1 bg-white dark:bg-black text-black dark:text-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors"
              onClick={handleBack}
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Featured
            </Button>
            <h2 className="text-xl font-semibold">Track Details</h2>
          </div>

          {selectedSong && (
            <AudioSeparator
              track={convertToDeezerTrack(selectedSong)}
              preloadedStems={convertStems(selectedSong.stems)}
              featured={true}
            />
          )}
        </div>
      )}

      <audio ref={audioRef} className="hidden" />
    </section>
  );
}
