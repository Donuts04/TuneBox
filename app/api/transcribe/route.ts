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
    backendForm.append("artist", "The Neighbourhood");
    backendForm.append("title", "Stargazing");

    const backendResponse = await fetch(
      "http://127.0.0.1:8000/api/v1/transcribe",
      {
        method: "POST",
        body: backendForm,
      }
    );

    console.log(backendResponse);
    if (!backendResponse.ok) {
      return NextResponse.json(
        { error: `Backend error: ${backendResponse.statusText}` },
        { status: backendResponse.status }
      );
    }

    const data = await backendResponse.json();
    console.log(data);
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error proxying audio transcription:", error);
    return NextResponse.json(
      { error: "Failed to transcribe audio file" },
      { status: 500 }
    );
  }
}
