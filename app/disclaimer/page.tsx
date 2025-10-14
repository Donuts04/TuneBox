"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function DisclaimerPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl flex flex-col gap-4">
        <Link href="/">
          <Button
            variant="outline"
            className="border border-black dark:border-white flex gap-2 bg-white dark:bg-black text-black dark:text-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </Link>

        <div className="bg-white dark:bg-black border-[3px] border-black dark:border-white p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)]">
          <h1 className="text-4xl font-bold mb-8 text-center">
            TuneBox Disclaimer
          </h1>

          <div className="space-y-6 text-justify">
            <div>
              <h2 className="text-2xl font-semibold mb-4">Disclaimer:</h2>
              <p className="text-lg leading-relaxed">
                TuneBox is a personal, non-commercial project created for
                experimental, educational, and entertainment purposes only.
              </p>
            </div>

            <div>
              <p className="text-lg leading-relaxed">
                The website is intended to explore audio processing concepts and
                effects such as reverb and stem separation in a learning
                environment. TuneBox does not claim ownership of any music or
                sound content accessed through external sources or APIs.
              </p>
            </div>

            <div>
              <p className="text-lg leading-relaxed">
                All copyrights, trademarks, and intellectual property rights
                remain the property of their respective owners. Any use of
                copyrighted material is solely for demonstration and
                experimentation, and no files are stored, redistributed, or
                monetized through this site.
              </p>
            </div>

            <div>
              <p className="text-lg leading-relaxed">
                If you are a rights holder and believe your content has been
                used improperly, please contact me and the material will be
                removed immediately.
              </p>
            </div>

            <div>
              <p className="text-lg leading-relaxed">
                By using this website, you acknowledge that TuneBox is provided
                “as is” without any guarantee, and that it exists purely as a
                personal hobby project for learning and creative exploration.
              </p>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-black dark:border-white">
            <p className="text-sm text-muted-foreground text-center">
              Last updated: {new Date().toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
