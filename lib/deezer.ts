"use server";

export interface DeezerTrack {
  id: number;
  title: string;
  artist: {
    id: number;
    name: string;
  };
  album: {
    id: number;
    title: string;
    cover: string;
    cover_small: string;
    cover_medium: string;
  };
  preview: string;
  duration: number;
  link: string;
}

export interface DeezerSearchResponse {
  data: DeezerTrack[];
  total: number;
  next?: string;
}

export async function searchTracks(query: string): Promise<DeezerTrack[]> {
  if (!query.trim()) {
    return [];
  }

  try {
    const response = await fetch(
      `https://api.deezer.com/search?q=${encodeURIComponent(query)}&limit=10`,
      {
        headers: {
          Accept: "application/json",
        },
        cache: "no-store",
      }
    );

    if (!response.ok) {
      throw new Error(`Deezer API error: ${response.statusText}`);
    }

    const data: DeezerSearchResponse = await response.json();

    console.log(JSON.stringify(data, null, 2));

    return data.data;
  } catch (error) {
    console.error("Error searching Deezer tracks:", error);
    throw error;
  }
}

export async function getTrack(trackId: number): Promise<DeezerTrack> {
  try {
    const response = await fetch(`https://api.deezer.com/track/${trackId}`, {
      headers: {
        Accept: "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Deezer API error: ${response.statusText}`);
    }

    return response.json();
  } catch (error) {
    console.error("Error fetching Deezer track:", error);
    throw error;
  }
}
