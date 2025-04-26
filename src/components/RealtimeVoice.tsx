"use client";

import React, { useEffect, useRef, useState } from "react";
// import { Button } from "@/components/ui/button";

interface RealtimeVoiceProps {
  isActive: boolean;
  onStart: () => void;
  onStop: () => void;
  onTranscript: (text: string) => void;
  onResponse: (text: string) => void;
  // setIsTalkingActive: (isActive: boolean) => void;
  pageContext: {
    currentPage: number;
    totalPages: number;
    pageContent: string;
    surroundingPagesContent?: Record<number, string>;
  };
  apiKey?: string;
}

export default function RealtimeVoice({
  isActive,
  onStart,
  onStop,
  onTranscript,
  onResponse,
  pageContext,
  apiKey,
}: RealtimeVoiceProps) {
  const [status, setStatus] = useState<
    "idle" | "connecting" | "connected" | "error"
  >("idle");

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);

  /* ------------------------------ helpers ------------------------------ */
  const reset = () => {
    dcRef.current?.close();
    pcRef.current?.close();
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    dcRef.current = null;
    pcRef.current = null;
    localStreamRef.current = null;
  };

  /* ---------------------------- connect flow --------------------------- */
  const handleConnect = async () => {
    try {
      setStatus("connecting");
      onStart();
      console.log("apikey is : ", apiKey);

      // 1. Mint an ephemeral key from your server
      let ephemeralKey: string;

      if (apiKey !== undefined && apiKey !== "") {
        console.log("trying to use custom API key");
        const response = await fetch(
          "https://api.openai.com/v1/realtime/sessions",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "gpt-4o-mini-realtime-preview-2024-12-17",
            }),
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          console.error("OpenAI API Error:", response.status, errorText);
          throw new Error(errorText);
        }

        const { client_secret } = (await response.json()) as {
          client_secret: { value: string };
        };

        ephemeralKey = client_secret.value;
      } else {
        console.log("Using default API key");
        const resp = await fetch("/api/realtime/session");
        if (!resp.ok)
          throw new Error("Unable to obtain realtime session token");
        const { client_secret } = (await resp.json()) as {
          client_secret: { value: string };
        };
        console.log("Client secret:", client_secret.value);
        ephemeralKey = client_secret.value;
      }

      console.log("EPHEMERAL_KEY:", ephemeralKey);

      // 2. Create a peer connection
      const pc = new RTCPeerConnection();
      pcRef.current = pc;

      // 3. Handle remote audio from the model
      pc.ontrack = (e) => {
        if (remoteAudioRef.current)
          remoteAudioRef.current.srcObject = e.streams[0];
      };

      // 4. Add microphone input
      const localStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      localStreamRef.current = localStream;
      pc.addTrack(localStream.getAudioTracks()[0]);

      // 5. Data channel for server events
      const dc = pc.createDataChannel("oai-events");
      dc.onmessage = (e) => {
        const evt = JSON.parse(e.data);
        if (evt.type === "conversation.item.input_audio_transcription.delta") {
          onTranscript(evt.delta);
        } else if (evt.type === "response.text.delta" && evt.delta?.content) {
          onResponse(evt.delta.content);
        }
      };
      dcRef.current = dc;

      // 6. SDP negotiation – send offer to OpenAI and apply answer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const model = "gpt-4o-mini-realtime-preview-2024-12-17";

      // Build context text with surrounding pages
      let contextText = `You are an AI assistant helping with a PDF document.\n`;
      contextText += `The user is currently on page ${pageContext.currentPage} of ${pageContext.totalPages}.\n\n`;
      
      // Add current page content
      contextText += `Current page content:\n${pageContext.pageContent}\n\n`;
      
      // Add surrounding pages if they exist
      if (pageContext.surroundingPagesContent) {
        const pages = Object.entries(pageContext.surroundingPagesContent);
        if (pages.length > 0) {
          contextText += `Context from surrounding pages:\n`;
          pages.forEach(([pageNum, content]) => {
            if (content) {
              contextText += `\nPage ${pageNum}:\n${content}\n`;
            }
          });
        }
      }

      const sdpRes = await fetch(
        `https://api.openai.com/v1/realtime?model=${model}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${ephemeralKey}`,
            "Content-Type": "application/sdp",
          },
          body: offer.sdp,
        }
      );

      if (!sdpRes.ok) {
        const errTxt = await sdpRes.text();
        console.error("SDP negotiation failed:", sdpRes.status, errTxt);
        throw new Error(errTxt);
      }
      const answerSdp = await sdpRes.text();
      await pc.setRemoteDescription({ type: "answer", sdp: answerSdp });

      // Send context through data channel
      setTimeout(() => {
        if (dc.readyState === "open") {
          dc.send(
            JSON.stringify({
              type: "session.update",
              session: {
                instructions: contextText,
              },
            })
          );
        }
      }, 1000);

      setStatus("connected");
    } catch (err) {
      console.error(err);
      reset();
      setStatus("error");
      onStop();
    }
  };

  /* -------------------------- disconnect flow -------------------------- */
  const handleDisconnect = () => {
    console.log("disconnecting");
    reset();
    setStatus("idle");
    onStop();
  };

  /* ---------------------------- useEffect ---------------------------- */
  useEffect(() => {
    if (isActive && status === "idle") {
      handleConnect();
    } else if (!isActive && status === "connected") {
      handleDisconnect();
    }
  }, [isActive]);

  useEffect(() => {
    // Send updated context when page changes
    if (status === "connected" && dcRef.current?.readyState === "open") {
      const contextText = `You are an AI assistant helping with a PDF document. 
        The user is currently on page ${pageContext.currentPage} of ${pageContext.totalPages}. 
        Here is the content of the current page:\n\n${pageContext.pageContent}\n\n`;

      dcRef.current.send(
        JSON.stringify({
          type: "session.update",
          session: {
            instructions: contextText,
          },
        })
      );
    }
  }, [pageContext, status]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (status === "connected") {
        handleDisconnect();
      }
    };
  }, []);

  /* ------------------------------- render ------------------------------ */
  return <audio ref={remoteAudioRef} autoPlay className="hidden" />;
}
