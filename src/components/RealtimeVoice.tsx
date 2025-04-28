"use client";

import React, { useEffect, useRef, useState } from "react";
import { ICE_SERVERS, PROVIDERS } from "@/constants";
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
    contentSource?: "pdf" | "html" | "url" | null;
    title?: string;
    url?: string;
  };
  apiKey?: string;
  provider: "outspeed" | "openai";
}

export default function RealtimeVoice({
  isActive,
  onStart,
  onStop,
  onTranscript,
  onResponse,
  pageContext,
  apiKey,
  provider = "outspeed",
}: RealtimeVoiceProps) {
  const [status, setStatus] = useState<
    "idle" | "connecting" | "connected" | "error"
  >("idle");

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);

  /* ------------------------------ helpers ------------------------------ */
  const reset = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
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
      console.log("provider is : ", provider);

      // Get ephemeral key from session API
      const sessionResponse = await fetch("/api/session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          provider,
          apiKey,
          model:
            provider === "outspeed"
              ? "MiniCPM-o-2_6"
              : "gpt-4o-realtime-preview-2024-12-17",
          instructions: pageContext.pageContent,
        }),
      });

      if (!sessionResponse.ok) {
        const errorText = await sessionResponse.text();
        console.error(
          `${provider} Session API Error:`,
          sessionResponse.status,
          errorText
        );
        throw new Error(errorText);
      }

      const { client_secret } = await sessionResponse.json();
      const ephemeralKey = client_secret.value;
      console.log("EPHEMERAL_KEY:", ephemeralKey);

      // Create peer connection
      const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
      pcRef.current = pc;

      // Handle remote audio
      pc.ontrack = (e) => {
        if (remoteAudioRef.current) {
          remoteAudioRef.current.srcObject = e.streams[0];
        }
      };

      // Add local audio track
      const localStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      localStreamRef.current = localStream;
      pc.addTrack(localStream.getAudioTracks()[0]);

      // Create data channel
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

      // Send context through data channel once connected
      const sendContext = () => {
        if (dc.readyState === "open") {
          let contextText = "";
          const contentSource = pageContext.contentSource || "pdf";

          if (contentSource === "pdf") {
            contextText = `You are an AI assistant helping with a PDF document.\n`;
            contextText += `The user is currently on page ${pageContext.currentPage} of ${pageContext.totalPages}.\n\n`;
            contextText += `Current page content:\n${pageContext.pageContent}\n\n`;

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
          } else if (contentSource === "html" || contentSource === "url") {
            contextText = `You are an AI assistant helping with ${
              contentSource === "html"
                ? "an HTML document"
                : "web content from a URL"
            }.\n`;
            if (pageContext.title) {
              contextText += `The content title is: ${pageContext.title}\n`;
            }
            if (pageContext.url) {
              contextText += `The content was loaded from: ${pageContext.url}\n`;
            }
            contextText += `\nContent:\n${pageContext.pageContent}\n`;
          }

          dc.send(
            JSON.stringify({
              type: "session.update",
              session: {
                instructions: contextText,
              },
            })
          );
        }
      };

      dc.onopen = () => {
        setStatus("connected");
        sendContext();
      };

      if (provider === "openai") {
        // OpenAI: HTTP-based SDP exchange
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        const sdpResponse = await fetch("/api/realtime/sdp", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sdp: offer.sdp,
            provider,
            apiKey: ephemeralKey,
            model: "gpt-4o-realtime-preview-2024-12-17",
          }),
        });

        if (!sdpResponse.ok) {
          const errText = await sdpResponse.text();
          console.error("OpenAI SDP error:", errText);
          throw new Error(errText);
        }

        const answerSdp = await sdpResponse.text();
        await pc.setRemoteDescription({
          type: "answer",
          sdp: answerSdp,
        });
      } else {
        // Outspeed: WebSocket-based signaling
        const ws = new WebSocket(
          `${PROVIDERS.OUTSPEED.wsUrl}?client_secret=${ephemeralKey}`
        );
        wsRef.current = ws;

        ws.onopen = () => {
          console.log("WebSocket connected");
          ws.send(JSON.stringify({ type: "ping" }));
        };

        ws.onmessage = async (message) => {
          const data = JSON.parse(message.data);
          switch (data.type) {
            case "pong":
              console.log("Pong received, creating offer...");
              const offer = await pc.createOffer();
              await pc.setLocalDescription(offer);
              ws.send(
                JSON.stringify({
                  type: "offer",
                  sdp: offer.sdp,
                })
              );
              break;

            case "answer":
              await pc.setRemoteDescription(new RTCSessionDescription(data));
              break;

            case "candidate":
              await pc.addIceCandidate(
                new RTCIceCandidate({
                  candidate: data.candidate,
                  sdpMid: data.sdpMid,
                  sdpMLineIndex: data.sdpMLineIndex,
                })
              );
              break;

            case "error":
              console.error("WebSocket error:", data.message);
              throw new Error(data.message);
          }
        };

        ws.onerror = (error) => {
          console.error("WebSocket error:", error);
          throw error;
        };

        ws.onclose = () => {
          console.log("WebSocket closed");
          if (status === "connected") {
            reset();
            setStatus("idle");
            onStop();
          }
        };

        // Handle ICE candidates
        pc.onicecandidate = (event) => {
          if (event.candidate && ws.readyState === WebSocket.OPEN) {
            ws.send(
              JSON.stringify({
                type: "candidate",
                candidate: event.candidate.candidate,
                sdpMid: event.candidate.sdpMid,
                sdpMLineIndex: event.candidate.sdpMLineIndex,
              })
            );
          }
        };
      }
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
