import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    if (!file) {
      return NextResponse.json(
        { error: "No audio file provided" },
        { status: 400 }
      );
    }

    const backendForm = new FormData();
    backendForm.append("file", file, file.name);

    const backendResponse = await fetch(
      "https://donutss-demucs.hf.space/transcribe",
      {
        method: "POST",
        headers: {
          Authorization: "Bearer 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",
        },
        body: backendForm,
      }
    );

    if (!backendResponse.ok) {
      return NextResponse.json(
        { error: `Backend error: ${backendResponse.statusText}` },
        { status: backendResponse.status }
      );
    }

    const data = await backendResponse.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error proxying audio transcription:", error);
    return NextResponse.json(
      { error: "Failed to transcribe audio file" },
      { status: 500 }
    );
  }
}
