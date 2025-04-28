import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    console.log("Creating realtime session");

    const {
      provider = "outspeed",
      model,
      apiKey,
      instructions,
    } = await req.json();

    // Determine which API key to use
    let API_KEY;
    if (apiKey) {
      API_KEY = apiKey;
    } else {
      API_KEY =
        provider === "outspeed"
          ? process.env.OUTSPEED_API_KEY
          : process.env.OPENAI_API_KEY;
    }

    if (!API_KEY) {
      console.error(
        `${provider.toUpperCase()}_API_KEY is not set in environment variables`
      );
      return NextResponse.json(
        { error: "API key not configured" },
        { status: 500 }
      );
    }

    // Determine the API endpoint based on provider
    const API_ENDPOINT =
      provider === "outspeed"
        ? "https://api.outspeed.com/v1/realtime/sessions"
        : "https://api.openai.com/v1/realtime/sessions";

    // Default models for each provider
    const defaultModel =
      provider === "outspeed"
        ? "MiniCPM-o-2_6"
        : "gpt-4o-realtime-preview-2024-12-17";

    // Prepare request body based on provider
    const requestBody = {
      model: model || defaultModel,
      modalities: ["audio", "text"],
      temperature: 0.6,
      voice: provider === "outspeed" ? "female" : "sage",
    };

    // Add instructions for Outspeed if provided
    if (provider === "outspeed" && instructions) {
      Object.assign(requestBody, { instructions });
    }

    const response = await fetch(API_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    console.log("Session API response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`${provider} API Error:`, response.status, errorText);
      return NextResponse.json(
        {
          error: `${provider} API Error`,
          status: response.status,
          details: errorText,
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log("Session created successfully");
    console.log("Session ID:", data.client_secret?.session_id || data.id);

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in /session:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: String(error) },
      { status: 500 }
    );
  }
}
