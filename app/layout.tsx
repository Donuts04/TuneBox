import type React from "react";
import type { Metadata } from "next";
import localFont from "next/font/local";
import { Poppins } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-poppins",
});

const comfortaa = localFont({
  src: [
    {
      path: "../public/fonts/Comfortaa-light.ttf",
      weight: "300",
      style: "normal",
    },
    {
      path: "../public/fonts/Comfortaa-regular.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/fonts/Comfortaa-bold.ttf",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-comfortaa",
});

const gotham = localFont({
  src: [
    {
      path: "../public/fonts/D-DINExp.otf",
      weight: "500",
      style: "normal",
    },
  ],
  variable: "--font-gotham",
});

const helvetica = localFont({
  src: [
    {
      path: "../public/fonts/HelveticaNeueLight.otf",
      weight: "300",
      style: "normal",
    },
    {
      path: "../public/fonts/HelveticaNeueBold.otf",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-helvetica",
});

export const metadata: Metadata = {
  title: "Promises",
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
      <body className={`${poppins.className} bg-white dark:bg-black`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
