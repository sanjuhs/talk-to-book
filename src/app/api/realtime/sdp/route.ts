import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    // Get the SDP offer and API key from the request
    const { sdp, apiKey } = await req.json();
    
    // Use provided API key or fall back to environment variable
    const OPENAI_API_KEY = apiKey || process.env.OPENAI_API_KEY;
    
    if (!OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key is required' },
        { status: 400 }
      );
    }

    if (!sdp) {
      return NextResponse.json(
        { error: 'SDP offer is required' },
        { status: 400 }
      );
    }

    // Forward the SDP offer to OpenAI
    const response = await fetch('https://api.openai.com/v1/audio/realtime/sdp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/sdp',
        'OpenAI-Beta': 'realtime=v1',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: sdp,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI SDP error:', response.status, errorText);
      return NextResponse.json(
        { error: `SDP error: ${errorText}` },
        { status: response.status }
      );
    }

    // Return the SDP answer
    const sdpAnswer = await response.text();
    return new Response(sdpAnswer, {
      headers: {
        'Content-Type': 'application/sdp',
      },
    });
  } catch (error) {
    console.error('Error in SDP proxy:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
