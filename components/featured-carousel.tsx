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
  Loader2,
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
import { analytics } from "@/lib/analytics";
import { useAudio } from "@/contexts/audio-context";
import { toast } from "sonner";

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
  midi: string | null;
}

const featuredSongs: Song[] = [
  {
    id: "1",
    title: "Pretty Boy",
    artist: "The Neighbourhood",
    coverImage:
      "https://storage.googleapis.com/tunebox-stuff/featured/prettyBoy/prettyBoy.jpg",
    audioUrl:
      "https://storage.googleapis.com/tunebox-stuff/featured/prettyBoy/original.mp3",
    audioUrls: {
      vocals:
        "https://storage.googleapis.com/tunebox-stuff/featured/prettyBoy/vocals.mp3",
      drums:
        "https://storage.googleapis.com/tunebox-stuff/featured/prettyBoy/drums.mp3",
      bass: "https://storage.googleapis.com/tunebox-stuff/featured/prettyBoy/bass.mp3",
      other:
        "https://storage.googleapis.com/tunebox-stuff/featured/prettyBoy/other.mp3",
    },
    audioEffects: {
      speed: 0.85,
      reverb: 0.8,
      delay: 7.0,
    },
    // midi: "https://storage.googleapis.com/tunebox-stuff/featured/prettyBoy/converted_piano.mid",
    midi: null,
  },

  {
    id: "2",
    title: "Sunsetz",
    artist: "Cigarettes After Sex",
    coverImage:
      "https://storage.googleapis.com/tunebox-stuff/featured/sunsetz/sunsetz.jpg",
    audioUrl:
      "https://storage.googleapis.com/tunebox-stuff/featured/sunsetz/original.mp3",
    audioUrls: {
      vocals:
        "https://storage.googleapis.com/tunebox-stuff/featured/sunsetz/vocals.mp3",
      drums:
        "https://storage.googleapis.com/tunebox-stuff/featured/sunsetz/drums.mp3",
      bass: "https://storage.googleapis.com/tunebox-stuff/featured/sunsetz/bass.mp3",
      other:
        "https://storage.googleapis.com/tunebox-stuff/featured/sunsetz/other.mp3",
    },
    audioEffects: {
      speed: 1.2,
      reverb: 0.7,
      delay: 4.0,
    },
    midi: null,
    // midi: "https://storage.googleapis.com/tunebox-stuff/featured/sunsetz/converted_piano.mid",
  },

  {
    id: "3",
    title: "About You",
    artist: "The 1975",
    coverImage:
      "https://storage.googleapis.com/tunebox-stuff/featured/aboutYou/aboutYou.jpg",
    audioUrl:
      "https://storage.googleapis.com/tunebox-stuff/featured/aboutYou/original.mp3",
    audioUrls: {
      vocals:
        "https://storage.googleapis.com/tunebox-stuff/featured/aboutYou/vocals.mp3",
      drums:
        "https://storage.googleapis.com/tunebox-stuff/featured/aboutYou/drums.mp3",
      bass: "https://storage.googleapis.com/tunebox-stuff/featured/aboutYou/bass.mp3",
      other:
        "https://storage.googleapis.com/tunebox-stuff/featured/aboutYou/other.mp3",
    },
    audioEffects: {
      speed: 1.3,
      reverb: 0.65,
      delay: 5.0,
    },
    midi: "https://storage.googleapis.com/tunebox-stuff/featured/aboutYou/converted_piano.mid",
  },

  {
    id: "4",
    title: "Somewhere Only We Know",
    artist: "Keane",
    coverImage:
      "https://storage.googleapis.com/tunebox-stuff/featured/somewhereOnlyWeKnow/somewhereOnlyWeKnow.jpg",
    audioUrl:
      "https://storage.googleapis.com/tunebox-stuff/featured/somewhereOnlyWeKnow/original.mp3",
    audioUrls: {
      vocals:
        "https://storage.googleapis.com/tunebox-stuff/featured/somewhereOnlyWeKnow/vocals.mp3",
      drums:
        "https://storage.googleapis.com/tunebox-stuff/featured/somewhereOnlyWeKnow/drums.mp3",
      bass: "https://storage.googleapis.com/tunebox-stuff/featured/somewhereOnlyWeKnow/bass.mp3",
      other:
        "https://storage.googleapis.com/tunebox-stuff/featured/somewhereOnlyWeKnow/other.mp3",
    },
    audioEffects: {
      speed: 1.4,
      reverb: 0.8,
      delay: 6.5,
    },
    midi: "https://storage.googleapis.com/tunebox-stuff/featured/somewhereOnlyWeKnow/converted_piano.mid",
  },

  {
    id: "5",
    title: "The Way You'd Love Her",
    artist: "Mac DeMarco",
    coverImage:
      "https://storage.googleapis.com/tunebox-stuff/featured/theWayYoudLoveHer/theWayYoudLoveHer.jpg",
    audioUrl:
      "https://storage.googleapis.com/tunebox-stuff/featured/theWayYoudLoveHer/original.mp3",
    audioUrls: {
      vocals:
        "https://storage.googleapis.com/tunebox-stuff/featured/theWayYoudLoveHer/vocals.mp3",
      drums:
        "https://storage.googleapis.com/tunebox-stuff/featured/theWayYoudLoveHer/drums.mp3",
      bass: "https://storage.googleapis.com/tunebox-stuff/featured/theWayYoudLoveHer/bass.mp3",
      other:
        "https://storage.googleapis.com/tunebox-stuff/featured/theWayYoudLoveHer/other.mp3",
    },
    audioEffects: {
      speed: 0.8,
      reverb: 1.0,
      delay: 10.0,
    },
    midi: "https://storage.googleapis.com/tunebox-stuff/featured/theWayYoudLoveHer/converted_piano.mid",
  },

  {
    id: "6",
    title: "Stargazing",
    artist: "The Neighbourhood",
    coverImage:
      "https://storage.googleapis.com/tunebox-stuff/featured/stargazing/stargazing.jpg",
    audioUrl:
      "https://storage.googleapis.com/tunebox-stuff/featured/stargazing/original.mp3",
    audioUrls: {
      vocals:
        "https://storage.googleapis.com/tunebox-stuff/featured/stargazing/vocals.mp3",
      drums:
        "https://storage.googleapis.com/tunebox-stuff/featured/stargazing/drums.mp3",
      bass: "https://storage.googleapis.com/tunebox-stuff/featured/stargazing/bass.mp3",
      other:
        "https://storage.googleapis.com/tunebox-stuff/featured/stargazing/other.mp3",
    },
    audioEffects: {
      speed: 1.2,
      reverb: 0.85,
      delay: 5.5,
    },
    midi: null,
    // midi: "https://storage.googleapis.com/tunebox-stuff/featured/stargazing/converted_piano.mid",
  },

  {
    id: "7",
    title: "My Love Mine All Mine",
    artist: "Mitski",
    coverImage:
      "https://storage.googleapis.com/tunebox-stuff/featured/myLoveMineAllMine/myLoveMineAllMine.jpg",
    audioUrl:
      "https://storage.googleapis.com/tunebox-stuff/featured/myLoveMineAllMine/original.mp3",
    audioUrls: {
      vocals:
        "https://storage.googleapis.com/tunebox-stuff/featured/myLoveMineAllMine/vocals.mp3",
      drums:
        "https://storage.googleapis.com/tunebox-stuff/featured/myLoveMineAllMine/drums.mp3",
      bass: "https://storage.googleapis.com/tunebox-stuff/featured/myLoveMineAllMine/bass.mp3",
      other:
        "https://storage.googleapis.com/tunebox-stuff/featured/myLoveMineAllMine/other.mp3",
    },
    audioEffects: {
      speed: 1.3,
      reverb: 0.5,
      delay: 3.0,
    },
    midi: null,
    // midi: "https://storage.googleapis.com/tunebox-stuff/featured/myLoveMineAllMine/converted_piano.mid",
  },

  {
    id: "8",
    title: "I'm Not Them",
    artist: "Them & I",
    coverImage:
      "https://storage.googleapis.com/tunebox-stuff/featured/imNotThem/imNotThem.jpg",
    audioUrl:
      "https://storage.googleapis.com/tunebox-stuff/featured/imNotThem/original.mp3",
    audioUrls: {
      vocals:
        "https://storage.googleapis.com/tunebox-stuff/featured/imNotThem/vocals.mp3",
      drums:
        "https://storage.googleapis.com/tunebox-stuff/featured/imNotThem/drums.mp3",
      bass: "https://storage.googleapis.com/tunebox-stuff/featured/imNotThem/bass.mp3",
      other:
        "https://storage.googleapis.com/tunebox-stuff/featured/imNotThem/other.mp3",
    },
    audioEffects: {
      speed: 0.95,
      reverb: 1.0,
      delay: 10.0,
    },
    midi: null,
    // midi: "https://storage.googleapis.com/tunebox-stuff/featured/imNotThem/converted_piano.mid",
  },

  {
    id: "9",
    title: "One Last Time",
    artist: "Summer Salt",
    coverImage:
      "https://storage.googleapis.com/tunebox-stuff/featured/oneLastTime/oneLastTime.jpg",
    audioUrl:
      "https://storage.googleapis.com/tunebox-stuff/featured/oneLastTime/original.mp3",
    audioUrls: {
      vocals:
        "https://storage.googleapis.com/tunebox-stuff/featured/oneLastTime/vocals.mp3",
      drums:
        "https://storage.googleapis.com/tunebox-stuff/featured/oneLastTime/drums.mp3",
      bass: "https://storage.googleapis.com/tunebox-stuff/featured/oneLastTime/bass.mp3",
      other:
        "https://storage.googleapis.com/tunebox-stuff/featured/oneLastTime/other.mp3",
    },
    audioEffects: {
      speed: 0.9,
      reverb: 0.8,
      delay: 5.5,
    },
    midi: null,
    // midi: "https://storage.googleapis.com/tunebox-stuff/featured/oneLastTime/converted_piano.mid",
  },

  {
    id: "10",
    title: "Heseeny",
    artist: "TUL8TE",
    coverImage:
      "https://storage.googleapis.com/tunebox-stuff/featured/heseeny/heseeny.jpg",
    audioUrl:
      "https://storage.googleapis.com/tunebox-stuff/featured/heseeny/original.mp3",
    audioUrls: {
      vocals:
        "https://storage.googleapis.com/tunebox-stuff/featured/heseeny/vocals.mp3",
      drums:
        "https://storage.googleapis.com/tunebox-stuff/featured/heseeny/drums.mp3",
      bass: "https://storage.googleapis.com/tunebox-stuff/featured/heseeny/bass.mp3",
      other:
        "https://storage.googleapis.com/tunebox-stuff/featured/heseeny/other.mp3",
    },
    audioEffects: {
      speed: 0.9,
      reverb: 0.65,
      delay: 5.0,
    },
    // midi: null,
    midi: "https://storage.googleapis.com/tunebox-stuff/featured/heseeny/converted_piano.mid",
  },
];

export function FeaturedCarousel() {
  // Get audio context for global audio management
  const { registerPlayer, unregisterPlayer, stopOtherPlayers, startAudio } =
    useAudio();

  const [currentlyPlaying, setCurrentlyPlaying] = React.useState<string | null>(
    null
  );
  const [selectedSong, setSelectedSong] = React.useState<Song | null>(null);
  const [showSeparator, setShowSeparator] = React.useState(false);
  const [currentSlide, setCurrentSlide] = React.useState(0);
  const [loadedMidi, setLoadedMidi] = React.useState<Midi | null>(null);
  const [loadingSongs, setLoadingSongs] = React.useState<Set<string>>(
    new Set()
  );
  const audioRefs = React.useRef<Map<string, HTMLAudioElement>>(new Map());
  const eventListenersRef = React.useRef<Map<string, Map<string, () => void>>>(
    new Map()
  );
  const carouselApi = React.useRef<CarouselApi | null>(null);

  // Simple function to load MIDI from URL
  const loadMidiFromUrl = React.useCallback(async (url: string) => {
    try {
      const midi = await Midi.fromUrl(url);
      setLoadedMidi(midi);
    } catch {
      setLoadedMidi(null);
      toast.error("Failed to load MIDI file");
    }
  }, []);

  // Helper function to create audio element with proper event listener management
  const createAudioElement = React.useCallback(
    (song: Song): HTMLAudioElement => {
      const audio = new Audio(song.audioUrl);

      // Event handlers
      const handlePlay = () => setCurrentlyPlaying(song.id);
      const handlePause = () =>
        setCurrentlyPlaying((current) =>
          current === song.id ? null : current
        );
      const handleEnded = () => setCurrentlyPlaying(null);
      const handleError = () => {
        setLoadingSongs((prev) => {
          const newSet = new Set(prev);
          newSet.delete(song.id);
          return newSet;
        });
        setCurrentlyPlaying((current) =>
          current === song.id ? null : current
        );
        toast.error("Failed to load audio");
      };
      const handleCanPlay = () => {
        setLoadingSongs((prev) => {
          const newSet = new Set(prev);
          newSet.delete(song.id);
          return newSet;
        });
      };

      // Store event listeners for cleanup
      const listeners = new Map<string, () => void>();

      const removePlayListener = () =>
        audio.removeEventListener("play", handlePlay);
      const removePauseListener = () =>
        audio.removeEventListener("pause", handlePause);
      const removeEndedListener = () =>
        audio.removeEventListener("ended", handleEnded);
      const removeErrorListener = () =>
        audio.removeEventListener("error", handleError);
      const removeCanPlayListener = () =>
        audio.removeEventListener("canplay", handleCanPlay);

      listeners.set("play", removePlayListener);
      listeners.set("pause", removePauseListener);
      listeners.set("ended", removeEndedListener);
      listeners.set("error", removeErrorListener);
      listeners.set("canplay", removeCanPlayListener);

      // Add event listeners
      audio.addEventListener("play", handlePlay);
      audio.addEventListener("pause", handlePause);
      audio.addEventListener("ended", handleEnded);
      audio.addEventListener("error", handleError);
      audio.addEventListener("canplay", handleCanPlay);

      // Store listeners for cleanup
      eventListenersRef.current.set(song.id, listeners);

      return audio;
    },
    []
  );

  // Register this player with the global audio management system
  React.useEffect(() => {
    const stopCallback = () => {
      audioRefs.current.forEach((audio) => {
        if (audio) {
          audio.pause();
        }
      });
      setCurrentlyPlaying(null);
    };

    registerPlayer("featuredCarousel", stopCallback);

    return () => {
      unregisterPlayer("featuredCarousel");
    };
  }, [registerPlayer, unregisterPlayer]);

  // Cleanup audio elements and event listeners on unmount
  React.useEffect(() => {
    // Capture refs at effect time to avoid stale closure warnings
    const currentAudioRefs = audioRefs.current;
    const currentEventListenersRef = eventListenersRef.current;

    return () => {
      currentAudioRefs.forEach((audio, songId) => {
        if (audio) {
          // Remove event listeners
          const listeners = currentEventListenersRef.get(songId);
          if (listeners) {
            listeners.forEach((removeListener) => removeListener());
          }

          // Cleanup audio
          audio.pause();
          audio.src = "";
        }
      });
      currentAudioRefs.clear();
      currentEventListenersRef.clear();
    };
  }, []);

  const handlePlay = async (song: Song) => {
    let audio = audioRefs.current.get(song.id);

    // Create audio element if it doesn't exist
    if (!audio) {
      try {
        setLoadingSongs((prev) => new Set(prev).add(song.id));
        audio = createAudioElement(song);
        audioRefs.current.set(song.id, audio);
      } catch (error) {
        console.error("Error creating audio:", error);
        setLoadingSongs((prev) => {
          const newSet = new Set(prev);
          newSet.delete(song.id);
          return newSet;
        });
        toast.error("Failed to load audio");
        return;
      }
    }

    if (currentlyPlaying === song.id) {
      // If the same song is clicked, toggle play/pause
      if (audio.paused) {
        try {
          setLoadingSongs((prev) => new Set(prev).add(song.id));
          await startAudio();
          await audio.play();
        } catch (err) {
          console.error("Error playing audio:", err);
          toast.error("Failed to play audio");
        } finally {
          setLoadingSongs((prev) => {
            const newSet = new Set(prev);
            newSet.delete(song.id);
            return newSet;
          });
        }
      } else {
        audio.pause();
        setCurrentlyPlaying(null);
      }
    } else {
      // Stop other players before starting this one
      stopOtherPlayers("featuredCarousel");

      // Pause all other audio elements
      audioRefs.current.forEach((otherAudio, otherId) => {
        if (otherId !== song.id && otherAudio) {
          otherAudio.pause();
        }
      });

      try {
        setLoadingSongs((prev) => new Set(prev).add(song.id));
        await startAudio();
        await audio.play();
        setCurrentlyPlaying(song.id);
      } catch (err) {
        console.error("Error playing audio:", err);
        toast.error("Failed to play audio");
      } finally {
        setLoadingSongs((prev) => {
          const newSet = new Set(prev);
          newSet.delete(song.id);
          return newSet;
        });
      }
    }
  };

  const handleShowDetails = (song: Song) => {
    // Stop any currently playing audio
    audioRefs.current.forEach((audio) => {
      if (audio) {
        audio.pause();
      }
    });
    setCurrentlyPlaying(null);

    // Track analytics for featured song details view
    analytics.trackFeaturedDetails(song.id.toString(), song.title, song.artist);

    setSelectedSong(song);
    setShowSeparator(true);

    // Load MIDI if available
    if (song.midi) {
      loadMidiFromUrl(song.midi);
    } else {
      setLoadedMidi(null);
    }
  };

  const handleBack = () => {
    setShowSeparator(false);
    setSelectedSong(null);
    // Keep the current slide position when going back
  };

  return (
    <section
      className="flex flex-col items-center justify-center w-full"
      id="featured"
    >
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
              className="w-full select-none"
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
                            !loadingSongs.has(song.id) && (
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
                                  !loadingSongs.has(song.id)
                                    ? "spin 20s linear infinite"
                                    : "none",
                              }}
                            />

                            <Button
                              className={cn(
                                "absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[15%] h-[15%] bg-white text-black border border-black hover:bg-black hover:text-white dark:bg-black dark:text-white dark:border-white dark:hover:bg-white dark:hover:text-black transition-colors flex items-center justify-center"
                              )}
                              disabled={loadingSongs.has(song.id)}
                            >
                              {loadingSongs.has(song.id) ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                              ) : currentlyPlaying === song.id ? (
                                <Pause className="h-5 w-5" />
                              ) : (
                                <Play className="h-5 w-5" />
                              )}
                              <span className="sr-only">
                                {loadingSongs.has(song.id)
                                  ? `Loading ${song.title}`
                                  : currentlyPlaying === song.id
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
                playerId="featured-audioHeader"
              />

              <AudioEffects
                audioUrl={selectedSong.audioUrl}
                initialSpeed={selectedSong.audioEffects?.speed}
                initialReverbWet={selectedSong.audioEffects?.reverb}
                initialReverbDecay={selectedSong.audioEffects?.delay}
                playerId="featured-audioEffects"
              />

              <StemPlayer
                audioUrls={selectedSong.audioUrls || {}}
                playerId="featured-stemPlayer"
              />

              {loadedMidi && (
                <MidiPlayer
                  midi={loadedMidi}
                  originalAudioUrl={selectedSong.audioUrl}
                  playerId="featured-midiPlayer"
                />
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
