import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const requestData = await request.json();
    const { provider = "outspeed", sdp, apiKey, model } = requestData;

    console.log("requestData", requestData);
    console.log("Apikey is actually ephemeral key", apiKey);

    console.log("SDP route called:", {
      provider,
      hasSDP: !!sdp,
      sdpLength: sdp?.length || 0,
      model,
    });

    if (!sdp) {
      console.error("No SDP offer provided");
      return NextResponse.json(
        { error: "No SDP offer provided" },
        { status: 400 }
      );
    }

    if (!apiKey) {
      console.error(`No ${provider} API key provided`);
      return NextResponse.json(
        { error: `No ${provider} API key provided` },
        { status: 400 }
      );
    }

    let apiEndpoint;
    let headers: HeadersInit;
    let body;

    if (provider === "outspeed") {
      apiEndpoint = `https://api.outspeed.com/v1/realtime?model=${model}`;
      console.log("outspeed api endpoint", apiEndpoint);
      headers = {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      };
      body = JSON.stringify({ sdp });
    } else {
      // OpenAI format
      apiEndpoint = `https://api.openai.com/v1/realtime?model=${
        model || "gpt-4o-realtime-preview-2024-12-17"
      }`;
      headers = {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/sdp",
      };
      body = sdp;
    }

    console.log(`Calling ${provider} API:`, {
      endpoint: apiEndpoint,
      keyLength: apiKey.length,
    });

    const response = await fetch(apiEndpoint, {
      method: "POST",
      headers,
      body,
    });

    console.log(`${provider} API response status:`, response.status);

    if (!response.ok) {
      const errText = await response.text();
      console.error(`${provider} API error:`, {
        status: response.status,
        error: errText,
        headers: Object.fromEntries(response.headers.entries()),
      });
      return NextResponse.json(
        { error: `${provider} API error: ${errText}` },
        { status: response.status }
      );
    }

    const sdpAnswer = await response.text();
    console.log("Received SDP answer:", {
      provider,
      length: sdpAnswer.length,
      isValidSDP: sdpAnswer.includes("v=0"),
    });

    return new NextResponse(sdpAnswer, {
      headers: {
        "Content-Type": "application/sdp",
      },
    });
  } catch (error) {
    console.error("Error in SDP route:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
