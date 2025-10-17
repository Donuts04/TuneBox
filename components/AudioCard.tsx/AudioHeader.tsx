import { Pause, Play, Music, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Slider } from "@/components/ui/slider";
import { useEffect, useRef, useState } from "react";
import { formatTime } from "@/lib/utils";
import { useAudio } from "@/contexts/audio-context";
import { toast } from "sonner";

interface AudioHeaderProps {
  title: string;
  subtitle?: string;
  imageUrl?: string;
  audioUrl?: string;
  playerId?: string; // Unique identifier for audio management
}

export default function AudioHeader({
  title,
  subtitle,
  imageUrl,
  audioUrl,
  playerId = "audioHeader",
}: AudioHeaderProps) {
  // Get audio context for global audio management
  const { registerPlayer, unregisterPlayer, stopOtherPlayers, startAudio } =
    useAudio();

  const [isHeaderPlaying, setIsHeaderPlaying] = useState(false);
  const [headerAudioDuration, setHeaderAudioDuration] = useState(0);
  const headerAudioRef = useRef<HTMLAudioElement | null>(null);
  const [headerCurrentTime, setHeaderCurrentTime] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Register this player with the global audio management system
  useEffect(() => {
    const stopCallback = () => {
      const audioEl = headerAudioRef.current;
      if (audioEl) {
        audioEl.pause();
        setIsHeaderPlaying(false);
      }
    };

    registerPlayer(playerId, stopCallback);

    return () => {
      unregisterPlayer(playerId);
    };
  }, [registerPlayer, unregisterPlayer, playerId]);

  // Initialize simple header <audio> element independent of Tone.js
  useEffect(() => {
    // No audio source available
    if (!audioUrl) return;

    const audioEl = headerAudioRef.current;
    if (!audioEl) return;

    setIsLoading(true);
    audioEl.src = audioUrl;

    const onLoadStart = () => setIsLoading(true);
    const onLoaded = () => {
      const dur = audioEl.duration;
      if (Number.isFinite(dur) && dur > 0) setHeaderAudioDuration(dur);
      setIsLoading(false);
    };
    const onTime = () => setHeaderCurrentTime(audioEl.currentTime);
    const onEnded = () => setIsHeaderPlaying(false);
    const onError = (e: Event) => {
      setIsLoading(false);
      const target = e.target as HTMLAudioElement;
      const error = target.error;
      let errorMessage = "Failed to load audio";

      if (error) {
        switch (error.code) {
          case error.MEDIA_ERR_ABORTED:
            errorMessage = "Audio loading was aborted";
            break;
          case error.MEDIA_ERR_NETWORK:
            errorMessage = "Network error while loading audio";
            break;
          case error.MEDIA_ERR_DECODE:
            errorMessage = "Audio format not supported";
            break;
          case error.MEDIA_ERR_SRC_NOT_SUPPORTED:
            errorMessage = "Audio source not supported";
            break;
          default:
            errorMessage = "Unknown audio error";
        }
      }

      toast.error(errorMessage);
    };

    audioEl.addEventListener("loadstart", onLoadStart);
    audioEl.addEventListener("loadedmetadata", onLoaded);
    audioEl.addEventListener("timeupdate", onTime);
    audioEl.addEventListener("ended", onEnded);
    audioEl.addEventListener("error", onError);

    // Reset UI state
    setIsHeaderPlaying(false);
    setHeaderCurrentTime(0);

    return () => {
      audioEl.pause();
      audioEl.removeEventListener("loadstart", onLoadStart);
      audioEl.removeEventListener("loadedmetadata", onLoaded);
      audioEl.removeEventListener("timeupdate", onTime);
      audioEl.removeEventListener("ended", onEnded);
      audioEl.removeEventListener("error", onError);
      // Revoke blob URL if created
      if (audioUrl.startsWith("blob:")) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  const toggleHeaderPlayback = async () => {
    const audioEl = headerAudioRef.current;
    if (!audioEl) return;

    if (isHeaderPlaying) {
      audioEl.pause();
      setIsHeaderPlaying(false);
    } else {
      // Stop other players before starting this one
      stopOtherPlayers(playerId);

      try {
        // Start audio context if needed
        await startAudio();
        setIsLoading(true);
        await audioEl.play();
        setIsHeaderPlaying(true);
        setIsLoading(false);
      } catch {
        // Autoplay policies may block or other playback errors
        setIsLoading(false);
        toast.error("Failed to play audio");
      }
    }
  };

  const handleHeaderSeek = (value: number[]) => {
    let newTime = value[0];
    const end = headerAudioDuration || 0;
    if (end) newTime = Math.max(0, Math.min(newTime, end));
    setHeaderCurrentTime(newTime);
    const audioEl = headerAudioRef.current;
    if (audioEl) {
      audioEl.currentTime = newTime;
    }
  };

  return (
    <div className="border border-black dark:border-white p-4">
      <div className="flex flex-col md:flex-row items-start md:items-center text-lg gap-3 w-full">
        {title ? (
          <div className="flex flex-col md:flex-row items-start md:items-end justify-between w-full gap-4">
            <div className="flex items-end gap-2 flex-1 min-w-0 w-full">
              <div className="flex-shrink-0">
                {imageUrl ? (
                  <Image
                    src={imageUrl}
                    alt={title}
                    width={60}
                    height={60}
                    className="border border-black dark:border-white"
                  />
                ) : (
                  <div className="flex-shrink-0 bg-muted/30 p-3 border border-black dark:border-white">
                    <Music className="h-6 w-6" />
                  </div>
                )}
              </div>
              <div className="flex flex-col justify-between flex-1 min-w-0 w-0 max-w-full overflow-hidden">
                <h3 className="font-semibold truncate w-full">{title}</h3>
                {subtitle && (
                  <p className="text-sm font-medium text-muted-foreground truncate w-full">
                    {subtitle}
                  </p>
                )}
              </div>
            </div>

            {audioUrl && (
              <div className="flex items-center gap-2 w-full md:w-[300px] flex-shrink-0">
                <Button
                  className={`h-8 w-8 p-0 border border-black dark:border-white ${
                    isHeaderPlaying
                      ? "bg-black text-white hover:bg-black/90 dark:bg-white dark:text-black dark:hover:bg-white/90"
                      : "bg-white text-black hover:bg-black hover:text-white dark:bg-black dark:text-white dark:hover:bg-white dark:hover:text-black"
                  }`}
                  onClick={toggleHeaderPlayback}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : isHeaderPlaying ? (
                    <Pause className="h-3 w-3" />
                  ) : (
                    <Play className="h-3 w-3" />
                  )}
                </Button>

                <div className="flex items-center gap-2 bg-white dark:bg-black border border-black dark:border-white px-3 h-8 flex-grow">
                  <span className="text-xs font-mono whitespace-nowrap">
                    {formatTime(headerCurrentTime)}
                  </span>
                  <Slider
                    value={[headerCurrentTime]}
                    min={0}
                    max={headerAudioDuration || 100}
                    step={0.1}
                    onValueChange={handleHeaderSeek}
                    className="flex-grow"
                  />
                  <span className="text-xs font-mono w-8">
                    {formatTime(headerAudioDuration)}
                  </span>
                </div>
                <audio ref={headerAudioRef} style={{ display: "none" }} />
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
