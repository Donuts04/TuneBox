import type React from "react";
import type { Metadata } from "next";
import localFont from "next/font/local";
import { Poppins } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { AudioProvider } from "@/contexts/audio-context";
import { Analytics } from "@vercel/analytics/next";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-poppins",
});

const comfortaa = localFont({
  src: [
    {
      path: "./fonts/Comfortaa-Light.ttf",
      weight: "300",
      style: "normal",
    },
    {
      path: "./fonts/Comfortaa-Regular.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "./fonts/Comfortaa-Bold.ttf",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-comfortaa",
});

const gotham = localFont({
  src: [
    {
      path: "./fonts/D-DINExp.otf",
      weight: "500",
      style: "normal",
    },
  ],
  variable: "--font-gotham",
});

const helvetica = localFont({
  src: [
    {
      path: "./fonts/HelveticaNeueLight.otf",
      weight: "300",
      style: "normal",
    },
    {
      path: "./fonts/HelveticaNeueBold.otf",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-helvetica",
});

export const metadata: Metadata = {
  title: "TuneBox",
  description: "A side project",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${poppins.variable} ${comfortaa.variable} ${gotham.variable} ${helvetica.variable}`}
    >
      <link rel="icon" href="/tuney.png" sizes="any" />
      <link rel="preload" as="image" href="/TuneBoxLogo.png" />
      <link rel="preload" as="image" href="/TuneBoxLogoClean.png" />
      <link rel="preload" as="image" href="/tuney/pointRight.png" />
      <link rel="preload" as="image" href="/tuney/tuney.svg" />
      <link rel="preload" as="image" href="/tuney/dance.png" />
      <link rel="preload" as="image" href="/tuney/pointDown.png" />
      <link rel="preload" as="image" href="/tuney/coolCross.png" />
      <body className="bg-white dark:bg-black">
        <AudioProvider>{children}</AudioProvider>
        <Analytics />
        <Toaster />
        {/* Silent audio element for iOS silent mode unblock */}
        <audio
          id="silent-audio"
          src="/1-minute-of-silence.mp3"
          preload="auto"
          loop
          style={{ display: "none" }}
          x-webkit-airplay="deny"
        />
      </body>
    </html>
  );
}
