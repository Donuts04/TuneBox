import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const composer = formData.get("composer") as string;

    if (!file) {
      return NextResponse.json(
        { error: "No audio file provided" },
        { status: 400 }
      );
    }

    if (!composer) {
      return NextResponse.json(
        { error: "No composer style provided" },
        { status: 400 }
      );
    }

    const backendForm = new FormData();
    backendForm.append("file", file, file.name);
    backendForm.append("composer", composer);

    const backendResponse = await fetch(
      "http://127.0.0.1:8000/api/v1/generate-midi",
      {
        method: "POST",
        body: backendForm,
      }
    );

    if (!backendResponse.ok) {
      return NextResponse.json(
        { error: `Backend error: ${backendResponse.statusText}` },
        { status: backendResponse.status }
      );
    }

    const midiBuffer = await backendResponse.arrayBuffer();
    return new Response(midiBuffer, {
      status: 200,
      headers: {
        "Content-Type": "audio/midi",
        "Content-Disposition": `attachment; filename="generated.mid"`,
      },
    });
  } catch (error) {
    console.error("Error generating MIDI:", error);
    return NextResponse.json(
      { error: "Failed to generate MIDI file" },
      { status: 500 }
    );
  }
}
