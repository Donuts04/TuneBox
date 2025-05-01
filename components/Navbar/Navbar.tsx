"use client";

import Image from "next/image";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";

const Navbar = () => {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 w-full flex justify-center py-6">
      {/* Navbar container with glow effect */}
      <div className="relative">
        {/* Glow effect */}
        <div className="absolute -inset-1 bg-primary/30 rounded-full blur-xl opacity-70"></div>

        {/* Navbar content */}
        <nav className="relative z-10 bg-black rounded-full px-6 py-3">
          <div className="flex items-center gap-4">
            <a href="#home" className="flex items-center">
              <Image
                src="/TuneBoxLogo.png"
                alt="TuneBox Logo"
                width={150}
                height={50}
                className="h-10 w-auto"
              />
            </a>

            <div className="hidden md:flex items-center gap-2 mx-4">
              <a href="#features">
                <Button
                  variant="ghost"
                  className="text-white/90 hover:text-white hover:bg-white/10 rounded-full px-4"
                >
                  Features
                </Button>
              </a>

              <a href="#convert">
                <Button
                  variant="ghost"
                  className="text-white/90 hover:text-white hover:bg-white/10 rounded-full px-4"
                >
                  Convert
                </Button>
              </a>

              <a href="#separate">
                <Button
                  variant="ghost"
                  className="text-white/90 hover:text-white hover:bg-white/10 rounded-full px-4"
                >
                  Separate
                </Button>
              </a>
            </div>

            <ThemeToggle />
          </div>
        </nav>
      </div>
    </div>
  );
};

export default Navbar;
