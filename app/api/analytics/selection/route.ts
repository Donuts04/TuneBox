import { NextResponse } from "next/server";
import { trackUserSelection } from "@/lib/analytics-utils";
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
    const { audioSource, audioName, artistName } = body;

    if (!audioSource || !audioName) {
      return NextResponse.json(
        { error: "Missing required fields: audioSource, audioName" },
        { status: 400 }
      );
    }

    if (!["search", "file_upload"].includes(audioSource)) {
      return NextResponse.json(
        {
          error: "Invalid audioSource. Must be 'search' or 'file_upload'",
        },
        { status: 400 }
      );
    }

    await trackUserSelection(request, {
      audioSource,
      audioName,
      artistName: artistName || null,
    });

    return NextResponse.json({
      success: true,
      message: "Selection analytics recorded",
    });
  } catch (error) {
    console.error("Error recording selection analytics:", error);
    return NextResponse.json(
      { error: "Failed to record analytics" },
      { status: 500 }
    );
  }
}
