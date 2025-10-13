import { NextResponse } from "next/server";
import { trackFeatured } from "@/lib/analytics-utils";
import { validateRequest } from "@/lib/security";

export async function POST(request: Request) {
  try {
    const requestValidation = validateRequest(request);
    if (!requestValidation.isValid) {
      return NextResponse.json(
        { error: requestValidation.error },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { songId, songTitle, artist } = body;

    if (!songId || !songTitle || !artist) {
      return NextResponse.json(
        { error: "Missing required fields: songId, songTitle, artist" },
        { status: 400 }
      );
    }

    await trackFeatured(request, {
      songId,
      songTitle,
      artist,
    });

    return NextResponse.json({
      success: true,
      message: "Featured analytics recorded",
    });
  } catch (error) {
    console.error("Error recording featured analytics:", error);
    return NextResponse.json(
      { error: "Failed to record analytics" },
      { status: 500 }
    );
  }
}
