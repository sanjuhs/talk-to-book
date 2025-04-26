import { NextResponse } from "next/server";

export async function GET() {
  try {
    console.log("Creating realtime session with OpenAI API");

    if (!process.env.OPENAI_API_KEY) {
      console.error("OPENAI_API_KEY is not set in environment variables");
      return NextResponse.json(
        { error: "API key not configured" },
        { status: 500 }
      );
    }

    // Log the first few characters of the API key to verify it's loaded (safely)
    // const apiKeyPrefix = process.env.OPENAI_API_KEY.substring(0, 5) + "...";
    // console.log(`API key loaded (starts with: ${apiKeyPrefix})`);

    const response = await fetch(
      "https://api.openai.com/v1/realtime/sessions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
          // "OpenAI-Beta": "realtime=v1",
        },
        body: JSON.stringify({
          // model: "gpt-4o-mini-realtime-preview-2024-12-17",
          model: "gpt-4o-realtime-preview-2024-12-17",
        }),
      }
    );

    console.log("Session API response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI API Error:", response.status, errorText);
      return NextResponse.json(
        {
          error: "OpenAI API Error",
          status: response.status,
          details: errorText,
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log("Session created successfully");

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in /session:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: String(error) },
      { status: 500 }
    );
  }
}
