import { createClient } from "@supabase/supabase-js";
import { NextRequest } from "next/server";
import { sanitizeString } from "./security";

// Get session ID from request cookies (middleware ensures it exists)
function getSessionIdFromRequest(request: Request): string | null {
  // Cast to NextRequest to access cookies
  const nextRequest = request as NextRequest;
  return nextRequest.cookies.get("tunebox-session-id")?.value || null;
}

// Create Supabase client for analytics
function createAnalyticsClient() {
  const supabaseUrl = process.env.SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// Track user selection analytics
export async function trackUserSelection(
  request: Request,
  data: {
    audioSource: "deezer_search" | "file_upload";
    audioName: string;
    artistName?: string | null;
  }
): Promise<void> {
  if (process.env.DISABLE_ANALYTICS === "true") {
    console.log("Analytics disabled - skipping user selection tracking");
    return;
  }

  try {
    const supabase = createAnalyticsClient();

    await supabase.from("user_selection_analytics").insert({
      audio_source: data.audioSource,
      audio_name: sanitizeString(data.audioName, 255),
      artist_name: sanitizeString(data.artistName, 255),
      user_agent: sanitizeString(request.headers.get("user-agent"), 500),
      ip_address: sanitizeString(
        request.headers.get("x-forwarded-for") ||
          request.headers.get("x-real-ip") ||
          "Unknown",
        45
      ),
      session_id: getSessionIdFromRequest(request),
    });
  } catch (error) {
    console.error("Failed to track user selection analytics:", error);
  }
}

// Track featured analytics
export async function trackFeatured(
  request: Request,
  data: {
    songId: string;
    songTitle: string;
    artist: string;
  }
): Promise<void> {
  if (process.env.DISABLE_ANALYTICS === "true") {
    console.log("Analytics disabled - skipping featured tracking");
    return;
  }

  try {
    const supabase = createAnalyticsClient();

    await supabase.from("featured_analytics").insert({
      song_id: sanitizeString(data.songId, 50),
      song_title: sanitizeString(data.songTitle, 255),
      artist: sanitizeString(data.artist, 255),
      user_agent: sanitizeString(request.headers.get("user-agent"), 500),
      ip_address: sanitizeString(
        request.headers.get("x-forwarded-for") ||
          request.headers.get("x-real-ip") ||
          "Unknown",
        45
      ),
      session_id: getSessionIdFromRequest(request),
    });
  } catch (error) {
    console.error("Failed to track featured analytics:", error);
  }
}

// Track audio processing analytics
export async function trackAudioProcessing(
  request: Request,
  data: {
    audioSource: "deezer_search" | "file_upload";
    audioName: string;
    artistName?: string | null;
    processingType: "separation" | "conversion";
    processingSuccess: boolean;
    processingTimeMs: number;
    errorMessage?: string | null;
  }
): Promise<void> {
  if (process.env.DISABLE_ANALYTICS === "true") {
    console.log("Analytics disabled - skipping audio processing tracking");
    return;
  }

  try {
    console.log("Tracking audio processing analytics:", data);
    const supabase = createAnalyticsClient();

    await supabase.from("audio_processing_analytics").insert({
      source: "tunebox_website",
      audio_source: data.audioSource,
      audio_name: sanitizeString(data.audioName, 255),
      artist_name: sanitizeString(data.artistName, 255),
      processing_type: data.processingType,
      processing_success: data.processingSuccess,
      processing_time_ms: data.processingTimeMs,
      error_message: sanitizeString(data.errorMessage, 1000),
      user_agent: sanitizeString(request.headers.get("user-agent"), 500),
      ip_address: sanitizeString(
        request.headers.get("x-forwarded-for") ||
          request.headers.get("x-real-ip") ||
          "Unknown",
        45
      ),
      session_id: getSessionIdFromRequest(request),
    });
  } catch (error) {
    console.error("Failed to track audio processing analytics:", error);
  }
}
