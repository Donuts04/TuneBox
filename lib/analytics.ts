"use client";

import { getClientSessionId } from "@/lib/session";

export async function trackFeaturedDetails(
  songId: string,
  songTitle: string,
  artist: string
): Promise<void> {
  try {
    await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/analytics/featured`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Session-Id": getClientSessionId(),
        },
        body: JSON.stringify({
          song_id: songId,
          song_title: songTitle,
          artist,
        }),
        credentials: "include",
      }
    );
  } catch (error) {
    console.error("Failed to track featured analytics:", error);
  }
}

export async function trackDeezerSelection(
  songName: string,
  artistName?: string
): Promise<void> {
  try {
    await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/analytics/selection`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Session-Id": getClientSessionId(),
        },
        body: JSON.stringify({
          audio_source: "search",
          audio_name: songName,
          artist_name: artistName,
        }),
        credentials: "include",
      }
    );
  } catch (error) {
    console.error("Failed to track Deezer selection analytics:", error);
  }
}

export async function trackUploadSelection(fileName: string): Promise<void> {
  try {
    await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/analytics/selection`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Session-Id": getClientSessionId(),
        },
        body: JSON.stringify({
          audio_source: "file_upload",
          audio_name: fileName,
        }),
        credentials: "include",
      }
    );
  } catch (error) {
    console.error("Failed to track upload selection analytics:", error);
  }
}
