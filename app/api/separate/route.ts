import { NextResponse } from "next/server";
import { Client } from "@gradio/client";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("audio_file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No audio file provided" },
        { status: 400 }
      );
    }

    // Convert the file to a buffer
    const buffer = await file.arrayBuffer();
    const blob = new Blob([buffer], { type: file.type });

    // Connect to the Gradio client
    const client = await Client.connect("Donutss/spleeter");

    // Make the prediction
    const result = await client.predict("/predict", {
      audio_file: blob,
    });

    console.log("Separation result:", result.data);

    return NextResponse.json({ data: result.data });
  } catch (error) {
    console.error("Error processing audio:", error);
    return NextResponse.json(
      { error: "Failed to process audio file" },
      { status: 500 }
    );
  }
}
