import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

// Initialize the OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const { image, prompt } = await req.json();

    if (!image) {
      return NextResponse.json(
        { error: "Image data is required" },
        { status: 400 }
      );
    }

    // Extract base64 image data (remove the data URL prefix if present)
    const base64Image = image.includes("data:image/")
      ? image.split(",")[1]
      : image;

    // Call OpenAI API for transcription
    const response = await openai.chat.completions.create({
      model: "gpt-4.1-mini", //gpt-4o // gpt-4.1-mini-2025-04-14 // this iwll mean it can work with latest endpoint
      messages: [
        {
          role: "system",
          content:
            "You are a highly accurate image transcription assistant. Transcribe the content of the given image into well-formatted markdown, preserving the structure and layout as much as possible.",
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text:
                prompt ||
                "Please transcribe this image as accurately as possible into a markdown document.",
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/png;base64,${base64Image}`,
              },
            },
          ],
        },
      ],
      // max_tokens: 4000,
    });

    // Return the transcription
    return NextResponse.json({
      transcription: response.choices[0].message.content,
    });
  } catch (error: any) {
    console.error("OpenAI API error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to transcribe image" },
      { status: 500 }
    );
  }
}
