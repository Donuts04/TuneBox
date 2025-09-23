// "use client";

// import type React from "react";

// import { useState, useEffect } from "react";
// import { Alert, AlertDescription } from "@/components/ui/alert";
// import { Music, Loader2, KeyboardMusic, Speaker } from "lucide-react";

// import { Button } from "@/components/ui/button";
// import { Card, CardContent } from "@/components/ui/card";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import { DeezerTrack } from "@/lib/deezer";
// import { INSTRUMENTS } from "@/lib/instruments";
// import CircleLoader from "../loaders/circleLoader";
// import { Midi } from "@tonejs/midi";
// import TonePlayer from "./TonePlayer";
// import AudioHeader from "../AudioCard.tsx/AudioHeader";

// interface AudioSource {
//   name: string;
//   downloadLink: string;
//   color: string;
//   icon: React.ReactNode;
// }

// interface ComposerOption {
//   id: string;
//   label: string;
// }

// const COMPOSER_OPTIONS: ComposerOption[] = [
//   { id: "composer1", label: "Classic Pop Ballad" },
//   { id: "composer2", label: "Jazz-Inspired Arrangement" },
//   { id: "composer3", label: "Upbeat Dance Style" },
//   { id: "composer4", label: "Acoustic Singer-Songwriter" },
//   { id: "composer5", label: "R&B Smooth Groove" },
//   { id: "composer6", label: "Rock Piano Version" },
//   { id: "composer7", label: "Minimalist Interpretation" },
//   { id: "composer8", label: "Orchestral Pop Fusion" },
//   { id: "composer9", label: "Soulful Expression" },
//   { id: "composer10", label: "Funky Rhythmic Style" },
//   { id: "composer11", label: "Electronic Remix" },
//   { id: "composer12", label: "Latin Pop Flavor" },
//   { id: "composer13", label: "Indie Pop Arrangement" },
//   { id: "composer14", label: "Gospel-Inspired Harmony" },
//   { id: "composer15", label: "Ambient Chill Version" },
//   { id: "composer16", label: "Retro 80s Vibe" },
//   { id: "composer17", label: "Country Ballad Style" },
//   { id: "composer18", label: "Experimental Fusion" },
//   { id: "composer19", label: "Cinematic Score Approach" },
//   { id: "composer20", label: "Bluesy Interpretation" },
//   { id: "composer21", label: "Contemporary Classical" },
// ];

// interface AudioConverterProps {
//   uploadedFile?: File | null;
//   stemKey?: string;
//   isProcessed?: boolean;
//   onProcessed?: (midiData: Midi) => void;
//   track?: DeezerTrack | null;
//   showCardHeader?: boolean;
//   audioUrl?: string;
// }

// export default function AudioConverter({
//   uploadedFile,
//   stemKey = "main",
//   isProcessed = false,
//   onProcessed,
//   track,
//   showCardHeader = true,
//   audioUrl,
// }: AudioConverterProps) {
//   const [audioSource, setAudioSource] = useState<AudioSource | null>(null);
//   const [selectedComposer, setSelectedComposer] = useState<string>("composer1");

//   const [midiData, setMidiData] = useState<Midi | null>(null);

//   const [isLoading, setIsLoading] = useState(!isProcessed);
//   const [error, setError] = useState<string | null>(null);
//   const [selectedInstrument, setSelectedInstrument] = useState(
//     INSTRUMENTS[0].id
//   );

//   useEffect(() => {
//     if (track) {
//       setIsLoading(true);
//       setError(null);

//       // Create audio source object
//       setAudioSource({
//         name: `${track.title} - ${track.artist.name}`,
//         downloadLink: track.preview,
//         color: "bg-blue-500 hover:bg-blue-600",
//         icon: <Music className="h-4 w-4" />,
//       });

//       setIsLoading(false);
//     }
//   }, [track, stemKey]);

//   useEffect(() => {
//     if (uploadedFile) {
//       setIsLoading(true);
//       setError(null);

//       // Create a URL for the uploaded file
//       const fileUrl = URL.createObjectURL(uploadedFile);

//       // Create audio source object
//       setAudioSource({
//         name: uploadedFile.name,
//         downloadLink: fileUrl,
//         color: "bg-amber-500 hover:bg-amber-600",
//         icon: <Music className="h-4 w-4" />,
//       });

//       setIsLoading(false);

//       return () => {
//         URL.revokeObjectURL(fileUrl);
//       };
//     }
//   }, [uploadedFile, stemKey]);

//   // Stem audio URL
//   useEffect(() => {
//     if (audioUrl) {
//       setIsLoading(true);
//       setError(null);

//       // Create audio source object
//       setAudioSource({
//         name: `Stem ${stemKey}`,
//         downloadLink: audioUrl,
//         color: "bg-purple-500 hover:bg-purple-600",
//         icon: <Music className="h-4 w-4" />,
//       });

//       setIsLoading(false);
//     }
//   }, [audioUrl, stemKey]);

//   // Process the audio when component mounts if not already processed
//   useEffect(() => {
//     if (!isProcessed && audioSource && !midiData) {
//       processAudio();
//     }
//   }, [isProcessed, audioSource, midiData]);

//   // Process audio to extract notes
//   const processAudio = async () => {
//     if (!audioSource) return;

//     setIsLoading(true);
//     setError(null);

//     try {
//       const response = await fetch(audioSource.downloadLink);
//       if (!response.ok) {
//         throw new Error(`Failed to fetch audio: ${response.statusText}`);
//       }

//       const blob = await response.blob();

//       const file = new File([blob], `${audioSource.name}.mp3`, {
//         type: "audio/mpeg",
//       });

//       const formData = new FormData();
//       formData.append("file", file);
//       formData.append("composer", selectedComposer);

//       const apiResponse = await fetch("/api/generate-midi", {
//         method: "POST",
//         body: formData,
//       });

//       if (!apiResponse.ok) {
//         throw new Error(`Server responded with status: ${apiResponse.status}`);
//       }

//       const midiBlob = await apiResponse.blob();
//       const arrayBuffer = await midiBlob.arrayBuffer();
//       const midi = new Midi(arrayBuffer);
//       setMidiData(midi);

//       if (onProcessed) {
//         onProcessed(midi);
//       }
//     } catch (error) {
//       setError(
//         error instanceof Error
//           ? error.message
//           : "Unknown error processing audio"
//       );
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   useEffect(() => {
//     if (audioSource && selectedComposer) {
//       processAudio();
//     }
//   }, [selectedComposer]);

//   return (
//     <Card className="w-full border border-black dark:border-white overflow-hidden bg-transparent">
//       {showCardHeader && (
//         <AudioHeader uploadedFile={uploadedFile} track={track} />
//       )}

//       <CardContent className="p-4 space-y-4 bg-transparent">
//         {isLoading ? (
//           <div className="flex justify-center items-center py-12">
//             <CircleLoader />
//           </div>
//         ) : error ? (
//           <div className="space-y-4">
//             <Alert variant="destructive" className="animate-in fade-in-50">
//               <AlertDescription>{error}</AlertDescription>
//             </Alert>
//             <Button
//               onClick={processAudio}
//               className="border border-black/20 dark:border-white/20 bg-transparent hover:bg-black/5 dark:hover:bg-white/5 text-black dark:text-white"
//             >
//               Try Again
//             </Button>
//           </div>
//         ) : !audioSource ? (
//           <div className="flex flex-col items-center justify-center py-12 space-y-4 text-center">
//             <div className="bg-muted/20 rounded-full p-4">
//               <Music className="h-12 w-12 text-muted-foreground" />
//             </div>
//             <p className="text-muted-foreground">
//               No audio selected for conversion.
//             </p>
//           </div>
//         ) : (
//           <div className="space-y-4">
//             <div className="flex items-center gap-4 w-full md:flex-row flex-col">
//               <div className="flex items-center gap-2 w-full">
//                 <KeyboardMusic className="h-5 w-5 flex-shrink-0 text-black dark:text-white" />
//                 <Select
//                   value={selectedInstrument}
//                   onValueChange={setSelectedInstrument}
//                   disabled={isLoading}
//                 >
//                   <SelectTrigger className="w-full min-w-0 border-black/50 dark:border-white/50">
//                     <SelectValue
//                       placeholder="Select an instrument"
//                       className="truncate"
//                     />
//                   </SelectTrigger>
//                   <SelectContent>
//                     {INSTRUMENTS.map((instrument) => (
//                       <SelectItem key={instrument.id} value={instrument.id}>
//                         {instrument.name}
//                       </SelectItem>
//                     ))}
//                   </SelectContent>
//                 </Select>
//               </div>

//               <div className="flex items-center gap-2 w-full">
//                 <Speaker className="h-5 w-5 flex-shrink-0 text-black dark:text-white" />
//                 <Select
//                   value={selectedComposer}
//                   onValueChange={setSelectedComposer}
//                   disabled={isLoading}
//                 >
//                   <SelectTrigger className="w-full min-w-0 border-black/50 dark:border-white/50">
//                     <SelectValue placeholder="Select a composer style" />
//                   </SelectTrigger>
//                   <SelectContent>
//                     {COMPOSER_OPTIONS.map((composer) => (
//                       <SelectItem key={composer.id} value={composer.id}>
//                         {composer.label}
//                       </SelectItem>
//                     ))}
//                   </SelectContent>
//                 </Select>
//               </div>
//             </div>

//             {midiData ? (
//               <div>
//                 <div className="w-full">
//                   <TonePlayer
//                     midiData={midiData}
//                     selectedInstrument={selectedInstrument}
//                     originalAudioUrl={audioSource.downloadLink}
//                   />
//                 </div>
//               </div>
//             ) : (
//               <div className="flex flex-col items-center justify-center py-12 space-y-4 text-center">
//                 <div className="bg-muted/20 rounded-full p-4">
//                   <Music className="h-12 w-12 text-muted-foreground" />
//                 </div>
//                 <div>
//                   <p className="text-muted-foreground">
//                     No MIDI data available. Please process the audio first.
//                   </p>
//                   {!isProcessed && (
//                     <Button
//                       onClick={processAudio}
//                       disabled={isLoading}
//                       className="mt-4 border border-black/20 dark:border-white/20 bg-transparent hover:bg-black/5 dark:hover:bg-white/5 text-black dark:text-white"
//                     >
//                       {isLoading ? (
//                         <>
//                           <Loader2 className="h-4 w-4 mr-2 animate-spin" />
//                           Processing...
//                         </>
//                       ) : (
//                         "Process Now"
//                       )}
//                     </Button>
//                   )}
//                 </div>
//               </div>
//             )}
//           </div>
//         )}
//       </CardContent>
//     </Card>
//   );
// }
