"use client";

import { useTheme } from "next-themes";
import { Toaster as Sonner, ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      style={
        {
          "--normal-bg": "hsl(var(--popover))",
          "--normal-text": "hsl(var(--popover-foreground))",
          "--normal-border": "hsl(var(--foreground))",
          "--border-radius": "0px",
          "--shadow": "none",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          actionButton:
            "!bg-black !text-white !px-2 !py-4 !font-medium !border !border-black !rounded-none hover:!bg-gray-800 hover:!border-gray-800",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
