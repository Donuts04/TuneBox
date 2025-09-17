import { FileAudio, Pause, Play, Upload } from "lucide-react";
import { Button } from "../ui/button";
import { CardHeader, CardTitle } from "../ui/card";
import Image from "next/image";
import { Slider } from "../ui/slider";
import { useEffect, useRef, useState } from "react";
import { DeezerTrack } from "@/lib/deezer";
import { formatTime } from "@/lib/utils";

interface AudioHeaderProps {
  uploadedFile?: File | null;
  track?: DeezerTrack | null;
}

export default function AudioHeader({ uploadedFile, track }: AudioHeaderProps) {
  const [isHeaderPlaying, setIsHeaderPlaying] = useState(false);
  const [headerAudioDuration, setHeaderAudioDuration] = useState(0);
  const headerAudioRef = useRef<HTMLAudioElement | null>(null);
  const [headerCurrentTime, setHeaderCurrentTime] = useState(0);

  // Initialize simple header <audio> element independent of Tone.js
  useEffect(() => {
    // No header source available
    if (!track && !uploadedFile) return;

    const url = track
      ? track.preview
      : uploadedFile
      ? URL.createObjectURL(uploadedFile)
      : "";
    if (!url) return;
    const audioEl = headerAudioRef.current;
    if (!audioEl) return;
    audioEl.src = url;
    const onLoaded = () => {
      const dur = audioEl.duration;
      if (Number.isFinite(dur) && dur > 0) setHeaderAudioDuration(dur);
    };
    const onTime = () => setHeaderCurrentTime(audioEl.currentTime);
    const onEnded = () => setIsHeaderPlaying(false);
    audioEl.addEventListener("loadedmetadata", onLoaded);
    audioEl.addEventListener("timeupdate", onTime);
    audioEl.addEventListener("ended", onEnded);
    // Reset UI state
    setIsHeaderPlaying(false);
    setHeaderCurrentTime(0);

    return () => {
      audioEl.pause();
      audioEl.removeEventListener("loadedmetadata", onLoaded);
      audioEl.removeEventListener("timeupdate", onTime);
      audioEl.removeEventListener("ended", onEnded);
      // Revoke blob URL if created
      if (uploadedFile && url.startsWith("blob:")) {
        URL.revokeObjectURL(url);
      }
    };
  }, [track, uploadedFile]);

  const toggleHeaderPlayback = async () => {
    const audioEl = headerAudioRef.current;
    if (!audioEl) return;
    if (isHeaderPlaying) {
      audioEl.pause();
      setIsHeaderPlaying(false);
    } else {
      try {
        await audioEl.play();
        setIsHeaderPlaying(true);
      } catch (err) {
        // Autoplay policies may block; ignore
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
    <CardHeader className="border-b border-black dark:border-white p-4">
      <CardTitle className="flex flex-col md:flex-row items-start md:items-center text-lg gap-3">
        {track ? (
          <div className="flex flex-col md:flex-row items-start md:items-end justify-between w-full gap-4">
            <div className="flex items-end gap-2 flex-1 min-w-0">
              {track.album.cover_medium && (
                <div className="flex-shrink-0">
                  <Image
                    src={track.album.cover_medium || "/placeholder.svg"}
                    alt={track.album.title}
                    width={60}
                    height={60}
                    className="rounded-md border border-black dark:border-white"
                  />
                </div>
              )}
              <div className="flex flex-col justify-between min-w-0">
                <h3 className="font-semibold truncate">{track.title}</h3>
                <p className="text-sm font-medium text-muted-foreground truncate">
                  {track.artist.name} • {track.album.title}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full md:w-[300px] flex-shrink-0">
              <Button
                className={`rounded-full transition-transform hover:scale-105 h-8 w-8 ${
                  isHeaderPlaying
                    ? "bg-black text-white hover:bg-black/90 dark:bg-white dark:text-black dark:hover:bg-white/90"
                    : "bg-white text-black border border-black hover:bg-black hover:text-white dark:bg-black dark:text-white dark:border-white dark:hover:bg-white dark:hover:text-black"
                }`}
                onClick={toggleHeaderPlayback}
              >
                {isHeaderPlaying ? (
                  <Pause className="h-3 w-3" />
                ) : (
                  <Play className="h-3 w-3" />
                )}
              </Button>

              <div className="flex items-center gap-2 bg-white dark:bg-black border border-black dark:border-white rounded-full px-3 py-1.5 flex-grow">
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
              {/* Hidden audio element used for header playback */}
              <audio ref={headerAudioRef} style={{ display: "none" }} />
            </div>
          </div>
        ) : uploadedFile ? (
          <div className="flex flex-col md:flex-row items-start md:items-end justify-between w-full gap-4">
            <div className="flex items-end gap-2 flex-1 min-w-0">
              <div className="flex-shrink-0 bg-muted/30 rounded-md p-3 border border-black dark:border-white">
                <FileAudio className="h-6 w-6" />
              </div>
              <div className="flex flex-col justify-between min-w-0">
                <h3 className="font-semibold truncate">{uploadedFile.name}</h3>
                <p className="text-sm font-medium text-muted-foreground truncate">
                  {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB •{" "}
                  {uploadedFile.type}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full md:w-[300px] flex-shrink-0">
              <Button
                className={`rounded-full transition-transform hover:scale-105 h-8 w-8 ${
                  isHeaderPlaying
                    ? "bg-black text-white hover:bg-black/90 dark:bg-white dark:text-black dark:hover:bg-white/90"
                    : "bg-white text-black border border-black hover:bg-black hover:text-white dark:bg-black dark:text-white dark:border-white dark:hover:bg-white dark:hover:text-black"
                }`}
                onClick={toggleHeaderPlayback}
              >
                {isHeaderPlaying ? (
                  <Pause className="h-3 w-3" />
                ) : (
                  <Play className="h-3 w-3" />
                )}
              </Button>

              <div className="flex items-center gap-2 bg-white dark:bg-black border border-black dark:border-white rounded-full px-3 py-1.5 flex-grow">
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
              <audio ref={headerAudioRef} className="hidden" />
            </div>
          </div>
        ) : (
          // make an onUpload function that will be passed as a prop
          <Button variant="outline">
            <Upload className="h-4 w-4" />
            Upload Audio
            <input
              type="file"
              className="hidden"
              accept="audio/*"
              // onChange={onUpload}
            />
          </Button>
        )}
      </CardTitle>
    </CardHeader>
  );
}
