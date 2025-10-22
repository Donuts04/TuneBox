"use client";
import Image from "next/image";
import {
  FaLinkedin,
  FaInstagram,
  FaSpotify,
  FaExternalLinkAlt,
} from "react-icons/fa";
import { Button } from "@/components/ui/button";
import OkLoader from "./loaders/ok-loader";

export function AboutSection() {
  return (
    <section id="about">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold sm:text-4xl text-center">About</h2>
      </div>

      <div>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          <div className="md:col-span-5 relative">
            <div className="relative w-full aspect-square border-[3px] border-black dark:border-white">
              <Image
                src="https://storage.googleapis.com/tunebox-stuff/logos/osamaSrs.png"
                alt="Osama Khalil"
                fill
                className="object-cover grayscale hover:grayscale-0 transition-all duration-500"
              />
              <div className="absolute -bottom-4 right-4 bg-white dark:bg-black border-[3px] border-black dark:border-white py-2 px-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">
                <h3 className="text-xl font-bold">Osama Khalil</h3>
                <p className="text-sm text-muted-foreground">
                  Full Stack Developer
                </p>
              </div>
            </div>
          </div>

          <div className="md:col-span-7 bg-white dark:bg-black border-[3px] border-black dark:border-white p-6 md:p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] space-y-6">
            <div className="flex flex-col gap-2">
              <h3 className="text-2xl font-bold">About This Website</h3>
              <p>
                Ever since I was a kid, I&apos;ve been fascinated by music boxes
                and the way they sound, and I love hearing the sound of
                instrumentals when listening to music. This platform lets you do
                things like converting songs into notes, as well as separating
                the vocals and instrumentals, with the ability to play around
                with the way the song plays, breaking it apart and rebuilding
                it.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <h4 className="text-xl font-semibold">About Me</h4>
              <p>
                I&apos;m a passionate developer with a love for music and
                technology. This platform combines both of my interests to
                create an interactive space.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sm:justify-start">
              <div className="flex gap-3 flex-1 sm:flex-none">
                <Button
                  variant="outline"
                  size="icon"
                  className="border-2 border-black dark:border-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black flex-1 sm:flex-none"
                  asChild
                >
                  <a
                    href="https://www.osama-khalil.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Website"
                  >
                    <FaExternalLinkAlt className="h-5 w-5" />
                  </a>
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="border-2 border-black dark:border-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black flex-1 sm:flex-none"
                  asChild
                >
                  <a
                    href="https://www.linkedin.com/in/osama-khalil-460144260/"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="LinkedIn"
                  >
                    <FaLinkedin className="h-5 w-5" />
                  </a>
                </Button>

                <Button
                  variant="outline"
                  size="icon"
                  className="border-2 border-black dark:border-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black flex-1 sm:flex-none"
                  asChild
                >
                  <a
                    href="https://www.instagram.com/osamaqadoumi_?igsh=dGR2cXRzaTduMWtr&utm_source=qr"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Instagram"
                  >
                    <FaInstagram className="h-5 w-5" />
                  </a>
                </Button>

                <Button
                  variant="outline"
                  size="icon"
                  className="border-2 border-black dark:border-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black flex-1 sm:flex-none"
                  asChild
                >
                  <a
                    href="https://open.spotify.com/user/31qxpb2rccdtajmtdtou3g6iq6t4?si=vg1PI3IxSr--N7QZj45O3w"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Spotify"
                  >
                    <FaSpotify className="h-5 w-5" />
                  </a>
                </Button>
              </div>

              <Button
                variant="outline"
                className="border-2 border-black dark:border-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black flex-1 min-w-[120px]"
                asChild
              >
                <a href="/disclaimer" aria-label="Disclaimer">
                  Disclaimer
                </a>
              </Button>
            </div>
            <div className="flex justify-start items-start w-full border-2 p-4 border-black dark:border-white bg-black dark:bg-white">
              <OkLoader />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
