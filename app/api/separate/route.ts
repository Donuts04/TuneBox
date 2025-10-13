import { NextResponse } from "next/server";
import { trackAudioProcessing } from "@/lib/analytics-utils";
import { validateRequest } from "@/lib/security";

export async function POST(request: Request) {
  const startTime = Date.now();

  try {
    const requestValidation = validateRequest(request);
    if (!requestValidation.isValid) {
      return NextResponse.json(
        { error: requestValidation.error },
        { status: 403 }
      );
    }
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const songName = formData.get("songName") as string;
    const songType = formData.get("songType") as string;

    if (!file) {
      return NextResponse.json(
        { error: "Missing file or model parameter" },
        { status: 400 }
      );
    }

    const backendForm = new FormData();
    backendForm.append("file", file, file.name);

    const backendResponse = await fetch(
      `${process.env.API_URL}/api/v1/separate-sources`,
      {
        method: "POST",
        body: backendForm,
      }
    );

    if (!backendResponse.ok) {
      // Track failed processing
      const processingTimeMs = Date.now() - startTime;
      await trackAudioProcessing(request, {
        audioSource: songType === "deezer" ? "deezer_search" : "file_upload",
        audioName: songName || file.name,
        artistName:
          songType === "deezer" ? (formData.get("artistName") as string) : null,
        processingType: "separation",
        processingSuccess: false,
        processingTimeMs,
        errorMessage: `Backend error: ${backendResponse.statusText}`,
      });

      return NextResponse.json(
        { error: `Backend error: ${backendResponse.statusText}` },
        { status: backendResponse.status }
      );
    }

    const processingTimeMs = Date.now() - startTime;
    await trackAudioProcessing(request, {
      audioSource: songType === "deezer" ? "deezer_search" : "file_upload",
      audioName: songName || file.name,
      artistName:
        songType === "deezer" ? (formData.get("artistName") as string) : null,
      processingType: "separation",
      processingSuccess: true,
      processingTimeMs,
      errorMessage: null,
    });

    const result = await backendResponse.json();

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error proxying audio separation:", error);
    return NextResponse.json(
      { error: "Failed to process audio file" },
      { status: 500 }
    );
  }
}
