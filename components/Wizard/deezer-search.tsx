"use client";

import { useState, useRef, useEffect } from "react";
import { searchTracks, type DeezerTrack } from "@/lib/deezer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Music, Play, Pause, BoomBox } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { formatTime } from "@/lib/utils";
import { useAudio } from "@/contexts/audio-context";

interface DeezerSearchProps {
  onSelect: (track: DeezerTrack) => void;
}

export default function DeezerSearch({ onSelect }: DeezerSearchProps) {
  // Get audio context for global audio management
  const { registerPlayer, unregisterPlayer, stopOtherPlayers, startAudio } =
    useAudio();

  const [query, setQuery] = useState("");
  const [tracks, setTracks] = useState<DeezerTrack[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Register this player with the global audio management system
  useEffect(() => {
    const stopCallback = () => {
      if (audioRef.current) {
        audioRef.current.pause();
        setCurrentlyPlaying(null);
      }
    };

    registerPlayer("deezerSearch", stopCallback);

    return () => {
      unregisterPlayer("deezerSearch");
    };
  }, [registerPlayer, unregisterPlayer]);

  useEffect(() => {
    audioRef.current = new Audio();

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!query.trim()) {
      setTracks([]);
      setLoading(false);
      return;
    }

    setTracks([]);
    setLoading(true);

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const results = await searchTracks(query);
        setTracks(results);
        setError(null);
      } catch {
        setError("Failed to search 😔 Please try again.");
        setTracks([]);
      } finally {
        setLoading(false);
      }
    }, 500);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [query]);

  const togglePlayPreview = async (track: DeezerTrack) => {
    if (!track.preview) {
      setError("No preview available for this track 😔");
      return;
    }

    if (currentlyPlaying === track.id) {
      audioRef.current?.pause();
      setCurrentlyPlaying(null);
    } else {
      // Stop other players before starting this one
      stopOtherPlayers("deezerSearch");

      if (audioRef.current) {
        audioRef.current.pause();
      }

      audioRef.current = new Audio(track.preview);

      try {
        await startAudio();
        await audioRef.current.play();
        setCurrentlyPlaying(track.id);
      } catch {
        setError("Failed to play preview 😔");
      }

      audioRef.current.onended = () => {
        setCurrentlyPlaying(null);
      };
    }
  };

  const selectTrack = (track: DeezerTrack) => {
    if (!track.preview) {
      setError("No preview available for this track 😔");
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
      setCurrentlyPlaying(null);
    }

    onSelect(track);
  };

  return (
    <div className="space-y-4">
      <div className="border border-black dark:border-white relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-black dark:text-white" />
        <Input
          type="text"
          placeholder="Search for a song!"
          className="pl-12 pr-4 h-14 text-base bg-transparent border-none focus:ring-1 focus:ring-black/20 dark:focus:ring-white/20 placeholder-black/50 dark:placeholder-white/50 text-black dark:text-white"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {!query.trim() ? (
        <div className="flex justify-center pt-6">
          <Image
            src="https://storage.googleapis.com/tunebox-stuff/tuney/tuney.svg"
            alt="Tuney"
            width={150}
            height={150}
            className="object-cover dark:invert"
            priority
          />
        </div>
      ) : error ? (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <Alert
              variant="destructive"
              className="animate-in fade-in-50 border border-red-300 dark:border-red-800"
            >
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </motion.div>
        </AnimatePresence>
      ) : loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{
                opacity: 1,
                scale: 1,
                transition: { delay: i * 0.1, duration: 0.3, ease: "easeOut" },
              }}
            >
              <div className="group border border-black dark:border-white">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 overflow-hidden">
                  <div className="flex items-center w-full sm:w-auto">
                    <div className="relative flex-shrink-0 mr-4">
                      <Skeleton className="h-14 w-14 bg-black/10 dark:bg-white/10 rounded-none" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <Skeleton className="h-5 w-full sm:w-96 lg:w-[28rem] xl:w-[32rem] mb-2 bg-black/10 dark:bg-white/10 rounded-none" />
                      <div className="flex items-center">
                        <Skeleton className="h-4 w-full sm:w-64 lg:w-80 xl:w-96 bg-black/10 dark:bg-white/10 rounded-none" />
                        <Skeleton className="h-3 w-1 mx-2 bg-black/10 dark:bg-white/10 rounded-none" />
                        <Skeleton className="h-4 w-12 bg-black/10 dark:bg-white/10 rounded-none" />
                      </div>
                    </div>
                  </div>
                  <Skeleton className="h-9 w-full sm:w-24 rounded-none bg-black/10 dark:bg-white/10" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : tracks.length === 0 && query.trim() !== "" ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="text-center py-12 border border-black dark:border-white"
        >
          <div className="text-6xl mb-4">😔</div>
          <p className="text-black/70 dark:text-white/70">
            No tracks found. Try a different search term.
          </p>
        </motion.div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {tracks.map((track, index) => (
              <motion.div
                key={track.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  transition: {
                    delay: index * 0.05,
                    duration: 0.3,
                    ease: "easeOut",
                  },
                }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="group border border-black dark:border-white hover:shadow-md transition-all"
              >
                <div
                  className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 overflow-hidden cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors"
                  onClick={() => track.preview && selectTrack(track)}
                >
                  <div className="flex items-center w-full sm:w-auto">
                    <div
                      className="relative flex-shrink-0 mr-4 cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        togglePlayPreview(track);
                      }}
                    >
                      {track.album.cover_medium ? (
                        <div className="relative w-14 h-14 overflow-hidden border border-black dark:border-white">
                          <Image
                            src={track.album.cover_medium || "/placeholder.svg"}
                            alt={track.album.title}
                            fill
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-14 h-14 bg-black/10 dark:bg-white/10 rounded-md flex items-center justify-center border border-white/20">
                          <Music className="h-6 w-6 text-black dark:text-white" />
                        </div>
                      )}

                      <Button
                        variant="default"
                        size="icon"
                        className="absolute -bottom-2 -right-2 h-7 w-7 bg-white dark:bg-black border border-black dark:border-white hover:bg-black dark:hover:bg-white  text-black dark:text-white hover:text-white dark:hover:text-black"
                        onClick={(e) => {
                          e.stopPropagation();
                          togglePlayPreview(track);
                        }}
                      >
                        {currentlyPlaying === track.id ? (
                          <Pause className="h-4 w-4" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                      </Button>
                    </div>

                    <div className="flex-1 min-w-0">
                      <p
                        className="font-medium text-black dark:text-white break-words line-clamp-2"
                        title={track.title}
                      >
                        {track.title}
                      </p>
                      <div className="flex items-center">
                        <p className="text-sm text-gray-700 dark:text-gray-300 truncate">
                          {track.artist.name}
                        </p>
                        <span className="mx-2 text-gray-500 dark:text-gray-400">
                          •
                        </span>
                        <span className="text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
                          {formatTime(track.duration)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {track.preview ? (
                    <>
                      <Button
                        className="w-full sm:w-auto h-9 flex items-center justify-center gap-2 border border-black dark:border-white text-black dark:text-white hover:text-white hover:dark:text-black bg-transparent hover:bg-black dark:hover:bg-white transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          selectTrack(track);
                        }}
                      >
                        <BoomBox className="h-4 w-4" />
                        <span>Select</span>
                      </Button>
                    </>
                  ) : (
                    <Badge variant="outline">
                      No preview, I can&apos;t get the track 😔
                    </Badge>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
