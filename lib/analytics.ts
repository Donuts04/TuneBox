// Featured analytics
export async function trackFeaturedDetails(
  songId: string,
  songTitle: string,
  artist: string
): Promise<void> {
  try {
    await fetch("/projects/tunebox/api/analytics/featured", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        songId,
        songTitle,
        artist,
      }),
    });
  } catch (error) {
    console.error("Failed to track featured analytics:", error);
  }
}

// Selection analytics
export async function trackDeezerSelection(
  songName: string,
  artistName?: string
): Promise<void> {
  try {
    await fetch("/projects/tunebox/api/analytics/selection", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        audioSource: "deezer_search",
        audioName: songName,
        artistName,
      }),
    });
  } catch (error) {
    console.error("Failed to track Deezer selection analytics:", error);
  }
}

export async function trackUploadSelection(fileName: string): Promise<void> {
  try {
    await fetch("/projects/tunebox/api/analytics/selection", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        audioSource: "file_upload",
        audioName: fileName,
        artistName: null,
      }),
    });
  } catch (error) {
    console.error("Failed to track upload selection analytics:", error);
  }
}

// Convenience object for easy access
export const analytics = {
  trackFeaturedDetails,
  trackDeezerSelection,
  trackUploadSelection,
};
