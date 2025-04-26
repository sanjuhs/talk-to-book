import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(req: NextRequest) {
  try {
    const { image, prompt, apiKey } = await req.json();
    
    // Initialize the OpenAI client with the provided API key or the default one
    const openai = new OpenAI({
      apiKey: apiKey || process.env.OPENAI_API_KEY,
    });

    if (!image) {
      return NextResponse.json(
        { error: "Image data is required" },
        { status: 400 }
      );
    }
    
    // Check if API key is available
    if (!apiKey && !process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "No API key provided. Please provide a custom API key or set the OPENAI_API_KEY environment variable." },
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
  } catch (error) {
    console.error("OpenAI API error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to transcribe image";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
