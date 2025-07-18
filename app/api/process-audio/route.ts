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

    const onset_threshold = formData.get("onset_threshold");
    const frame_threshold = formData.get("frame_threshold");
    const minimum_note_length = formData.get("minimum_note_length");
    const minimum_frequency = formData.get("minimum_frequency");
    const maximum_frequency = formData.get("maximum_frequency");
    const multiple_pitch_bends = formData.get("multiple_pitch_bends");
    const tempo_override = formData.get("tempo_override");

    if (onset_threshold)
      backendForm.append("onset_threshold", onset_threshold.toString());
    if (frame_threshold)
      backendForm.append("frame_threshold", frame_threshold.toString());
    if (minimum_note_length)
      backendForm.append("minimum_note_length", minimum_note_length.toString());
    if (minimum_frequency)
      backendForm.append("minimum_frequency", minimum_frequency.toString());
    if (maximum_frequency)
      backendForm.append("maximum_frequency", maximum_frequency.toString());
    if (multiple_pitch_bends)
      backendForm.append(
        "multiple_pitch_bends",
        multiple_pitch_bends.toString()
      );
    if (tempo_override)
      backendForm.append("tempo_override", tempo_override.toString());

    const backendResponse = await fetch(
      "http://localhost:8000/process-audio/",
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

    const data = await backendResponse.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error processing audio:", error);
    return NextResponse.json(
      { error: "Failed to process audio file" },
      { status: 500 }
    );
  }
}
