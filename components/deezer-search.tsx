"use client";

import { useState, useRef, useEffect } from "react";
import { searchTracks, type DeezerTrack } from "@/lib/deezer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  Music,
  Play,
  Pause,
  Layers,
  FileMusic,
  HeartCrack,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { useTheme } from "next-themes";

interface DeezerSearchProps {
  onSelectPreviewUrl?: (url: string, trackName: string) => void;
  onSelectForSeparation?: (track: DeezerTrack) => void;
  onSelectForConversion?: (track: DeezerTrack) => void;
}

export default function DeezerSearch({
  onSelectForSeparation,
  onSelectForConversion,
}: DeezerSearchProps) {
  const [query, setQuery] = useState("");
  const [tracks, setTracks] = useState<DeezerTrack[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);
  const { theme } = useTheme();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Create audio element
  useEffect(() => {
    audioRef.current = new Audio();

    // Clean up on unmount
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Handle search with debounce
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!query.trim()) {
      setTracks([]);
      return;
    }

    setTracks([]);
    setLoading(true);

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const results = await searchTracks(query);
        setTracks(results);
        setError(null);
      } catch (err) {
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

  // Play/pause preview
  const togglePlayPreview = (track: DeezerTrack) => {
    if (!track.preview) {
      setError("No preview available for this track 😔");
      return;
    }

    if (currentlyPlaying === track.id) {
      // Pause current track
      audioRef.current?.pause();
      setCurrentlyPlaying(null);
    } else {
      // Stop any currently playing audio
      if (audioRef.current) {
        audioRef.current.pause();
      }

      // Play new track
      audioRef.current = new Audio(track.preview);
      audioRef.current.play().catch((err) => {
        setError("Failed to play preview 😔");
      });

      // Set currently playing track
      setCurrentlyPlaying(track.id);

      // Handle when audio ends
      audioRef.current.onended = () => {
        setCurrentlyPlaying(null);
      };
    }
  };

  // Select track for separation
  const selectTrackForSeparation = (track: DeezerTrack) => {
    if (!track.preview || !onSelectForSeparation) {
      setError("No preview available for this track 😔");
      return;
    }

    // Stop any currently playing audio
    if (audioRef.current) {
      audioRef.current.pause();
      setCurrentlyPlaying(null);
    }

    onSelectForSeparation(track);
  };

  // Select track for conversion
  const selectTrackForConversion = (track: DeezerTrack) => {
    if (!track.preview || !onSelectForConversion) {
      setError("No preview available for this track 😔");
      return;
    }

    // Stop any currently playing audio
    if (audioRef.current) {
      audioRef.current.pause();
      setCurrentlyPlaying(null);
    }

    onSelectForConversion(track);
  };

  // Format duration from seconds to MM:SS
  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  return (
    <div className="space-y-6">
      <div className="border border-black dark:border-white rounded-lg relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-black dark:text-white" />
        <Input
          type="text"
          placeholder="Search for a song!"
          className="pl-12 pr-4 h-14 text-base bg-transparent border-none focus:ring-1 focus:ring-black/20 dark:focus:ring-white/20 placeholder-black/50 dark:placeholder-white/50 text-black dark:text-white"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {mounted && !query.trim() && (
        <div className="flex justify-center">
          <Image
            src="/tuney/think.png"
            alt="TuneBox Logo"
            width={150}
            height={150}
            className={`object-cover ${theme === "dark" ? "invert" : ""}`}
            priority
          />
        </div>
      )}

      <AnimatePresence>
        {error && (
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
        )}
      </AnimatePresence>

      {loading && (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{
                opacity: 1,
                y: 0,
                transition: { delay: i * 0.1 },
              }}
            >
              <div className="flex items-center p-4 rounded-lg border border-black dark:border-white">
                <Skeleton className="h-14 w-14 rounded-md mr-4 bg-black/10 dark:bg-white/10" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-3/4 mb-2 bg-black/10 dark:bg-white/10" />
                  <Skeleton className="h-3 w-1/2 bg-black/10 dark:bg-white/10" />
                </div>
                <div className="flex space-x-2">
                  <Skeleton className="h-9 w-24 rounded-md bg-black/10 dark:bg-white/10" />
                  <Skeleton className="h-9 w-24 rounded-md bg-black/10 dark:bg-white/10" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {!loading && tracks.length === 0 && query.trim() !== "" && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="text-center py-12 border border-black dark:border-white rounded-lg"
        >
          <HeartCrack className="h-16 w-16 mx-auto text-black dark:text-white mb-4" />
          <p className="text-black/70 dark:text-white/70">
            No tracks found 😔 Try a different search term 😉
          </p>
        </motion.div>
      )}

      <div className="space-y-3">
        <AnimatePresence>
          {tracks.map((track, index) => (
            <motion.div
              key={track.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{
                opacity: 1,
                y: 0,
                transition: { delay: index * 0.05 },
              }}
              exit={{ opacity: 0, y: -20 }}
              className="group rounded-lg border border-black dark:border-white hover:shadow-md transition-all"
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center p-4 overflow-hidden">
                <div className="flex items-center mb-3 sm:mb-0 w-full sm:w-auto">
                  <div
                    className="relative flex-shrink-0 mr-4 cursor-pointer"
                    onClick={() => togglePlayPreview(track)}
                  >
                    {track.album.cover_medium ? (
                      <div className="relative w-14 h-14 rounded-md overflow-hidden border border-black dark:border-white">
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
                      className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full bg-white dark:bg-black border border-black dark:border-white hover:bg-black dark:hover:bg-white  text-black dark:text-white hover:text-white dark:hover:text-black"
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
                      className="font-medium text-black dark:text-white  break-words line-clamp-2"
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
                        {formatDuration(track.duration)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 mt-2 sm:mt-0 sm:ml-auto w-full sm:w-auto">
                  {track.preview ? (
                    <>
                      {onSelectForSeparation && (
                        <Button
                          className="w-full h-9 flex items-center justify-center gap-2 mt-auto border border-black dark:border-white text-black dark:text-white hover:text-white hover:dark:text-black bg-transparent hover:bg-black dark:hover:bg-white transition-colors"
                          onClick={() => selectTrackForSeparation(track)}
                        >
                          <Layers className="h-4 w-4" />
                          <span>Separate</span>
                        </Button>
                      )}

                      {onSelectForConversion && (
                        <Button
                          className="w-full h-9 flex items-center justify-center gap-2 mt-auto border border-black dark:border-white text-black dark:text-white hover:text-white hover:dark:text-black bg-transparent hover:bg-black dark:hover:bg-white transition-colors"
                          onClick={() => selectTrackForConversion(track)}
                        >
                          <FileMusic className="h-4 w-4" />
                          <span>Convert</span>
                        </Button>
                      )}
                    </>
                  ) : (
                    <Badge
                      variant="outline"
                      className="text-md text-gray-700 border-gray-300 dark:border-gray-700 dark:text-gray-300 rounded-full"
                    >
                      No preview, I can't get the track 😔
                    </Badge>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
