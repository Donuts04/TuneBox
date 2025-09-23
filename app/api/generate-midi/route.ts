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
      `${process.env.API_URL}/api/v1/generate-midi`,
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
