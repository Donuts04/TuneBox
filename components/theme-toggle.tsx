"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch by only rendering after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const isDark = theme === "dark";

  return (
    <div className="relative inline-flex items-center cursor-pointer">
      <input
        type="checkbox"
        className="sr-only peer"
        checked={isDark}
        onChange={() => setTheme(isDark ? "light" : "dark")}
        id="theme-toggle"
      />
      <label
        htmlFor="theme-toggle"
        className="relative w-14 h-7 bg-black dark:bg-white rounded-full transition-colors duration-300 ease-in-out overflow-hidden cursor-pointer"
      >
        <div className="absolute left-1.5 top-1/2 -translate-y-1/2 text-white dark:text-black">
          <Sun className="h-4 w-4" />
        </div>

        <div className="absolute right-1.5 top-1/2 -translate-y-1/2 text-white dark:text-black">
          <Moon className="h-4 w-4" />
        </div>

        <motion.div
          className="absolute top-1 w-5 h-5 bg-white dark:bg-black rounded-full shadow-md"
          initial={false}
          animate={{
            x: isDark ? 32 : 4,
            boxShadow: isDark
              ? "0 1px 3px rgba(0,0,0,0.2)"
              : "0 1px 3px rgba(0,0,0,0.2)",
          }}
          transition={{
            type: "spring",
            stiffness: 400,
            damping: 22,
            mass: 1,
          }}
        />
      </label>
    </div>
  );
}
