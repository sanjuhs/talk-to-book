This is Outspeed's documentation it uses the exact same API spec as OpenAI it just reuses Outspeed instead. So by using this can you update the code to also make use of Outspeed not just this thing not just openai

api.ts:

```typescript
import axios from "axios";

import { env } from "@/config/env";
import { getSupabaseAuthToken } from "@/config/supabase";
import { OUTSPEED_API_BASE_URL } from "@/constants";
import { type SessionConfig } from "@src/model-config";

// Create axios instance with base URL
const apiClient = axios.create({ baseURL: OUTSPEED_API_BASE_URL });

apiClient.interceptors.request.use(async (config) => {
  if (env.OUTSPEED_HOSTED) {
    const token = await getSupabaseAuthToken();
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
    return config;
  }

  if (!env.OUTSPEED_API_KEY) {
    throw new Error("OUTSPEED_API_KEY is not set");
  }

  config.headers = config.headers || {};
  config.headers.Authorization = `Bearer ${env.OUTSPEED_API_KEY}`;
  return config;
});

interface PaginationParams {
  page?: number;
  pageSize?: number;
}

export interface SessionResponse {
  sessions: Array<{
    config: {
      id: string;
      created: number;
      object: "realtime.session";
      model: string;
      modalities: string[];
      instructions: string;
      voice: string;
      temperature: number;
      tools: string[];
      tool_choice: string;
    };
    status: "in_progress" | "completed";
    recording: string | null;
    provider: string;
    created_at: string;
    created_by: string;
  }>;
  total: number;
  page: number;
  page_size: number;
  has_next: boolean;
}

interface InferenceMetric {
  _id: string;
  label: string;
  session_id: string;
  interrupted: boolean;
  input_audio_s3_url?: string;
  output_audio_s3_url?: string;
  created_at: string;
  time_to_first_response: number;
  total_generation_time: number;
  average_inter_response_delay: number;
  total_tokens: number;
  input_tokens: number;
  total_responses: number;
  text_responses: number;
  audio_responses: number;
  errors: string[];
  responses: {
    timestamp: string;
    delay_from_prev: number;
    type: string;
    jitter: number;
    text?: string;
    audio?: boolean;
    audio_jitter?: number;
  }[];
}

interface MetricsResponse {
  metrics: Array<InferenceMetric>;
  total: number;
}

interface SessionCreate {
  config: SessionConfig;
  provider: string;
}

interface SessionUpdate {
  config?: Partial<SessionConfig>;
  recording?: string;
  status?: "completed";
}

interface S3UploadUrlResponse {
  upload_url: string;
  s3_url: string;
  expires_in: number;
}

interface RecordingUrlResponse {
  presigned_url: string;
  expires_in: number;
}

interface AudioResponse {
  presigned_url: string;
}

// Sessions API
export const fetchSessions = async ({
  page = 1,
  pageSize = 5,
}: PaginationParams): Promise<SessionResponse> => {
  const response = await apiClient.get(
    `/sessions?page=${page}&page_size=${pageSize}`
  );
  return response.data;
};

// Metrics API
export const fetchMetricsBySession = async ({
  sessionId,
  page = 1,
  pageSize = 5,
}: PaginationParams & { sessionId: string }): Promise<MetricsResponse> => {
  const response = await apiClient.get(
    `/metrics/by-session/${sessionId}?page=${page}&page_size=${pageSize}`
  );
  return response.data;
};

export const fetchMetricDetail = async (
  id: string
): Promise<InferenceMetric> => {
  const response = await apiClient.get(`/metrics/${id}`);
  return response.data;
};

// Audio API
export const getAudioUrl = async (s3Url: string): Promise<AudioResponse> => {
  const response = await apiClient.post(`/audio`, { s3_url: s3Url });
  return response.data;
};

// Create a new session
export const createSession = async (
  data: SessionCreate
): Promise<SessionResponse> => {
  const response = await apiClient.post("/sessions", data);
  return response.data;
};

// Update an existing session
export const updateSession = async (
  sessionId: string,
  data: SessionUpdate
): Promise<SessionResponse> => {
  const response = await apiClient.put(`/sessions/${sessionId}`, data);
  return response.data;
};

// Get a pre-signed URL for uploading audio to S3
export const getAudioUploadUrl = async (params: {
  fileName: string;
  sessionId: string;
  contentType?: string;
}): Promise<S3UploadUrlResponse> => {
  const response = await apiClient.post("/sessions/audio-upload-url", {
    file_name: params.fileName,
    session_id: params.sessionId,
    content_type: params.contentType || "audio/wav",
  });
  return response.data;
};

// Get a pre-signed URL for playing a session recording
export const getRecordingUrl = async (
  sessionId: string
): Promise<RecordingUrlResponse> => {
  const response = await apiClient.get(
    `/sessions/recording-url?session_id=${sessionId}`
  );
  return response.data;
};
```

server.ts:

```typescript
import fs from "node:fs";
import net from "node:net";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import "dotenv/config";
import express from "express";
import { createServer as createViteServer } from "vite";

import { models, providers } from "./settings.js";

// Get the directory name properly
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const initialPort = process.env.PORT || 3000;

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
if (!OPENAI_API_KEY) {
  console.log("⚠️ OPENAI_API_KEY is not set");
}

const OUTSPEED_API_KEY = process.env.OUTSPEED_API_KEY;
if (!OUTSPEED_API_KEY) {
  console.log("⚠️ OUTSPEED_API_KEY is not set");
}

const apiKeys = {};
for (const model in models) {
  if (models[model].provider === providers.OpenAI) {
    apiKeys[model] = OPENAI_API_KEY;
  } else if (models[model].provider === providers.Outspeed) {
    apiKeys[model] = OUTSPEED_API_KEY;
  }
}

// Configure Vite middleware for React client
const vite = await createViteServer({
  server: { middlewareMode: true },
  appType: "custom",
});
app.use(vite.middlewares);

// API route for token generation
app.post("/token", express.json(), async (req, res) => {
  try {
    const { model } = req.body;
    if (typeof model !== "string") {
      res.status(400).json({ error: "model field must be a string" });
      return;
    }

    const modelData = models[model];
    if (!modelData) {
      res
        .status(400)
        .json({ error: `no model found for ${model}`, code: "NO_MODEL" });
      return;
    }

    const apiKey = apiKeys[model];
    if (!apiKey) {
      res
        .status(400)
        .json({ error: `no API key found for ${model}`, code: "NO_API_KEY" });
      return;
    }

    const url = `https://${modelData.provider.url}/v1/realtime/sessions`;
    console.log(`👉 using ${url} to create session...`);
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(req.body),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("Token generation error:", error);
      res.status(response.status).send({ type: "error", message: error });
      return;
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error("Token generation error:", error);
    res.status(500).json({ error: "Failed to generate token" });
  }
});

// Render the React client
app.use("*", async (req, res, next) => {
  const url = req.originalUrl;

  try {
    const template = await vite.transformIndexHtml(
      url,
      fs.readFileSync("./index.html", "utf-8")
    );

    const { render } = await vite.ssrLoadModule(
      path.join(__dirname, "./client/entry-server.jsx")
    );
    const appHtml = await render(url);
    const html = template.replace(`<!--ssr-outlet-->`, appHtml?.html);
    res.status(200).set({ "Content-Type": "text/html" }).end(html);
  } catch (e) {
    vite.ssrFixStacktrace(e);
    next(e);
  }
});

// Function to check if a port is available
const isPortAvailable = (port) => {
  return new Promise((resolve) => {
    const server = net.createServer();

    server.once("error", () => {
      resolve(false);
    });

    // close the server once it's listening so it can be used by http server
    server.once("listening", () => {
      server.close();
      resolve(true);
    });

    server.listen(port);
  });
};

// Function to find an available port
const findAvailablePort = async (startPort) => {
  let port = startPort;
  while (!(await isPortAvailable(port))) {
    console.log(`Port ${port} is in use, trying ${port + 1}`);
    port++;
  }

  return port;
};

const startServer = async () => {
  try {
    const availablePort = await findAvailablePort(initialPort);
    app.listen(availablePort, (err) => {
      if (err) {
        console.error(err);
        return;
      }

      console.log(`🚀 App running at http://localhost:${availablePort}`);
    });
  } catch (err) {
    console.error("Failed to start server:", err);
  }
};

startServer();
```

model config.js:

```typescript
export const models = {
  "MiniCPM-o-2_6": {
    provider: "api.outspeed.com",
    label: "MiniCPM-o 2.6",
    sessionConfig: {
      model: "MiniCPM-o-2_6",
      modalities: ["audio", "text"],
      temperature: 0.6,
      voice: "female",
    },
  },
  "gpt-4o-realtime-preview-2024-12-17": {
    provider: "api.openai.com",
    label: "GPT-4o Realtime",
    sessionConfig: {
      model: "gpt-4o-realtime-preview-2024-12-17",
      modalities: ["audio", "text"],
      temperature: 0.6,
      voice: "sage",
    },
  },
};
```

constants.ts:

```typescript
export const CONNECTION_TYPES = {
  WEBRTC: "webrtc",
  WEBSOCKET: "websocket",
};

export const ICE_SERVERS = [{ urls: "stun:stun.l.google.com:19302" }];

export const OUTSPEED_API_BASE_URL = "https://api.outspeed.com/v1";

export const OUTSPEED_API_KEY = import.meta.env.OUTSPEED_API_KEY;
```

app.tsx:

```typescript
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { ICE_SERVERS } from "@/constants";
import { useModel } from "@/contexts/model";
import {
  calculateOpenAICosts,
  calculateTimeCosts,
  getInitialCostState,
  updateCumulativeCost,
} from "@/utils/cost-calc";
import { agent } from "@src/agent-config";
import { providers } from "@src/settings";
import Chat from "./Chat";
import EventLog from "./EventLog";
import SessionControls from "./SessionControls";
import SessionDetailsPanel from "./SessionDetails";

export default function App() {
  const { selectedModel } = useModel();
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [loadingModel, setLoadingModel] = useState(false);
  const [events, setEvents] = useState([]);
  const pcRef = useRef(null);
  const dcRef = useRef(null);
  const signallingWsRef = useRef(null);
  const [messages, setMessages] = useState(new Map());

  /** response id of message that is currently being streamed */
  const botStreamingTextRef = useRef(null);

  // states for cost calculation
  const [costState, setCostState] = useState(getInitialCostState());
  const [sessionStartTime, setSessionStartTime] = useState(null);
  const sessionDurationInterval = useRef(null);

  // refs for speech recording
  const audioContext = useRef(null);
  const iAudioRecorderRef = useRef(null); // input audio recorder
  const oAudioRecorderRef = useRef(null); // output audio recorder
  const currentSpeechItemRef = useRef(null);
  const currentBotSpeechItemRef = useRef(null); // Reference for bot's speech

  const navigate = useNavigate();

  // Update session duration every second when active
  useEffect(() => {
    if (loadingModel || !isSessionActive || !sessionStartTime) {
      return;
    }

    sessionDurationInterval.current = setInterval(() => {
      const durationInSeconds = Math.floor(
        (Date.now() - sessionStartTime) / 1000
      );

      // Update Outspeed cost if using that provider
      if (selectedModel.provider === providers.Outspeed) {
        const timeCosts = calculateTimeCosts(
          durationInSeconds,
          selectedModel.cost.perMinute
        );

        // Update cost state for Outspeed (time-based)
        setCostState({
          ...getInitialCostState(),
          durationInSeconds,
          costPerMinute: selectedModel.cost.perMinute,
          totalCost: timeCosts.totalCost,
          timestamp: timeCosts.timestamp,
        });
      }
    }, 1000);

    return () => {
      clearInterval(sessionDurationInterval.current);
    };
  }, [loadingModel, isSessionActive, sessionStartTime, selectedModel]);

  useEffect(() => {
    if (loadingModel || !isSessionActive) {
      stopInputRecording();
      return;
    }

    startInputRecording();
    return () => {
      stopInputRecording();
      stopBotRecording();
      if (audioContext.current) {
        audioContext.current.close();
        audioContext.current = null;
      }
    };
  }, [isSessionActive, loadingModel]);

  // Function to start recording audio
  const startInputRecording = () => {
    if (!pcRef.current) {
      return;
    }

    if (!audioContext.current) {
      audioContext.current = new AudioContext();
    }

    // Get the audio track from the peer connection
    const senders = pcRef.current.getSenders();
    const audioSender = senders.find(
      (sender) => sender.track && sender.track.kind === "audio"
    );

    if (!audioSender || !audioSender.track) {
      console.error("No audio track found");
      return;
    }

    // Create a MediaStream with the audio track
    const stream = new MediaStream([audioSender.track]);

    // Create a MediaRecorder
    const mediaRecorder = new MediaRecorder(stream);
    iAudioRecorderRef.current = mediaRecorder;

    // Start recording
    mediaRecorder.start();
  };

  // Function to stop recording and create audio blob
  const stopInputRecording = () => {
    if (
      !iAudioRecorderRef.current ||
      iAudioRecorderRef.current.state === "inactive"
    ) {
      return;
    }

    iAudioRecorderRef.current.stop();
  };

  // Function to start recording bot's audio output
  const startBotRecording = () => {
    if (!pcRef.current) {
      return;
    }

    if (!audioContext.current) {
      audioContext.current = new AudioContext();
    }

    // Get the audio track from the peer connection's receivers (bot's audio)
    const receivers = pcRef.current.getReceivers();
    const audioReceiver = receivers.find(
      (receiver) => receiver.track && receiver.track.kind === "audio"
    );

    if (!audioReceiver || !audioReceiver.track) {
      console.error("No bot audio track found");
      return;
    }

    // Create a MediaStream with the audio track
    const stream = new MediaStream([audioReceiver.track]);

    // Create a MediaRecorder
    const mediaRecorder = new MediaRecorder(stream);
    oAudioRecorderRef.current = mediaRecorder;

    // Start recording
    mediaRecorder.start();
  };

  // Function to stop bot recording
  const stopBotRecording = () => {
    if (
      !oAudioRecorderRef.current ||
      oAudioRecorderRef.current.state === "inactive"
    ) {
      return;
    }

    oAudioRecorderRef.current.stop();
  };

  const getRecording = () => {
    return new Promise((resolve) => {
      // Create a one-time event listener for dataavailable
      const handleDataAvailable = async (e) => {
        if (!iAudioRecorderRef.current) {
          console.error("No input audio recorder found");
          return;
        }

        // Remove the event listener to avoid memory leaks
        iAudioRecorderRef.current.removeEventListener(
          "dataavailable",
          handleDataAvailable
        );

        const audioBlob = new Blob([e.data], {
          type: "audio/webm",
        });

        const audioArrayBuffer = await audioBlob.arrayBuffer();

        if (!currentSpeechItemRef.current.startTime) {
          console.error("No start time found");
          return;
        }

        const duration =
          (Date.now() - currentSpeechItemRef.current.startTime + 1000) / 1000;
        const audioData = await audioContext.current.decodeAudioData(
          audioArrayBuffer
        );

        /** @type {Float32Array} */
        const lastNSeconds = audioData
          .getChannelData(0)
          .slice(-Math.floor(audioData.sampleRate * duration));

        // Create a new AudioBuffer to hold our sliced data
        /** @type {AudioBuffer} */
        const newAudioBuffer = audioContext.current.createBuffer(
          1, // mono channel
          lastNSeconds.length,
          audioData.sampleRate
        );

        // Copy the data to the new buffer
        newAudioBuffer.getChannelData(0).set(lastNSeconds);
        resolve([newAudioBuffer, newAudioBuffer.duration]);

        // start recording again
        startInputRecording();
      };

      // Add the one-time event listener
      iAudioRecorderRef.current.addEventListener(
        "dataavailable",
        handleDataAvailable
      );

      // stopping the recording, which will trigger the dataavailable event
      stopInputRecording();
    });
  };

  // Function to get bot's recording
  const getBotRecording = () => {
    return new Promise((resolve) => {
      // Create a one-time event listener for dataavailable
      const handleDataAvailable = async (e) => {
        if (!oAudioRecorderRef.current) {
          console.error("No bot audio recorder found");
          return;
        }

        // Remove the event listener to avoid memory leaks
        oAudioRecorderRef.current.removeEventListener(
          "dataavailable",
          handleDataAvailable
        );

        const audioBlob = new Blob([e.data], {
          type: "audio/webm",
        });

        const audioArrayBuffer = await audioBlob.arrayBuffer();

        if (!currentBotSpeechItemRef.current.startTime) {
          console.error("No bot start time found");
          return;
        }

        const audioBuffer = await audioContext.current.decodeAudioData(
          audioArrayBuffer
        );

        resolve([audioBuffer, audioBuffer.duration]);
      };

      // Add the one-time event listener
      oAudioRecorderRef.current.addEventListener(
        "dataavailable",
        handleDataAvailable
      );

      // stopping the recording, which will trigger the dataavailable event
      // manually causing a delay to ensure the audio is fully recorded
      // for some reason, a few milliseconds is getting cut off otherwise
      // which means that when we receive the output_audio_buffer.stopped event,
      // the audio didn't fully stop
      setTimeout(() => {
        stopBotRecording();
      }, 400);
    });
  };

  const handleErrorEvent = (errorMessage, eventId) => {
    const id = eventId || crypto.randomUUID();
    setMessages((prev) => {
      const newMessages = new Map(prev);
      newMessages.set(id, {
        text: {
          role: "assistant",
          type: "error",
          content: errorMessage,
          timestamp: new Date().toLocaleTimeString(),
        },
      });
      return newMessages;
    });
  };

  async function startWebrtcSession() {
    try {
      // Reset when starting a new session
      setCostState(getInitialCostState());
      setSessionStartTime(Date.now());
      setEvents([]);
      setMessages(new Map());

      const { sessionConfig } = selectedModel;
      let concatSessionConfig = {
        ...sessionConfig,
        instructions: agent.instructions,
      };

      console.log(concatSessionConfig);
      // Get an ephemeral key from the server with selected provider
      const tokenResponse = await fetch(`/token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(concatSessionConfig),
      });
      const data = await tokenResponse.json();
      if (!tokenResponse.ok) {
        console.error("Failed to get ephemeral key", data);

        const toastOptions = {};
        if (data.code === "NO_API_KEY") {
          toastOptions.action = {
            label: "Get API Key",
            onClick: () =>
              window.open(selectedModel.provider.apiKeyUrl, "_blank"),
          };
        }

        toast.error(data.error || "Failed to get ephemeral key", toastOptions);
        return;
      }

      const ephemeralKey = data.client_secret.value;

      // Create a peer connection
      const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

      // Set up to play remote audio from the model
      const audioElement = document.createElement("audio");
      audioElement.autoplay = true;
      pc.ontrack = (e) => (audioElement.srcObject = e.streams[0]);

      // Add local audio track for microphone input
      const ms = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioTrack = ms.getTracks()[0];
      audioTrack.enabled = false; // disable the track initially
      pc.addTrack(audioTrack);
      pcRef.current = pc;

      // Set up data channel
      const dc = pc.createDataChannel("oai-events");

      dc.addEventListener("open", () => {
        setIsSessionActive(true);
        setEvents([]);
        setSessionStartTime(Date.now());
      });

      dc.addEventListener("message", async (e) => {
        const event = JSON.parse(e.data);

        event.timestamp = event.timestamp || new Date().toLocaleTimeString();
        event.server_sent = true; // to distinguish between server and client events

        switch (event.type) {
          case "session.created":
            setLoadingModel(false);
            pcRef.current.getSenders().forEach((sender) => {
              sender.track.enabled = true;
            });
            break;

          case "response.done":
            // Calculate cost for OpenAI Realtime API based on  usage
            if (
              selectedModel.provider === providers.OpenAI &&
              event.response?.usage
            ) {
              const newCostData = calculateOpenAICosts(
                event.response.usage,
                selectedModel.cost
              );

              // Update cost state by incorporating the new data into cumulative
              setCostState((prev) => updateCumulativeCost(prev, newCostData));
            }

            if (event.response.status == "failed") {
              handleErrorEvent(
                event.response.status_details?.error?.message || "server error",
                event.event_id
              );
            }
            break;

          case "response.audio_transcript.delta":
            botStreamingTextRef.current = event.response_id;
            setMessages((prev) => {
              const newMessages = new Map(prev);
              const currentMessage = prev.get(event.response_id) || {
                text: null,
                audio: null,
              };
              newMessages.set(event.response_id, {
                ...currentMessage,
                text: {
                  role: "assistant",
                  content: (currentMessage.text?.content || "") + event.delta,
                  timestamp: !currentMessage.text?.timestamp
                    ? new Date().toLocaleTimeString()
                    : currentMessage.text.timestamp,
                  streaming: true,
                },
              });
              return newMessages;
            });
            break;

          case "response.audio_transcript.done":
            botStreamingTextRef.current = null;
            setMessages((prev) => {
              const newMessages = new Map(prev);
              const currentMessage = prev.get(event.response_id) || {
                text: null,
                audio: null,
              };
              newMessages.set(event.response_id, {
                ...currentMessage,
                text: {
                  role: "assistant",
                  content: event.transcript,
                  timestamp: !currentMessage.text?.timestamp
                    ? new Date().toLocaleTimeString()
                    : currentMessage.text.timestamp,
                  streaming: false,
                },
              });
              return newMessages;
            });
            break;

          case "error":
            handleErrorEvent(
              event.error.message || "an error occurred",
              event.event_id
            );
            break;

          case "input_audio_buffer.speech_started":
            currentSpeechItemRef.current = {
              id: crypto.randomUUID(),
              startTime: Date.now(),
            };
            break;

          case "input_audio_buffer.speech_stopped": {
            // Stop recording when speech ends and add to messages

            const currentSpeechItem = currentSpeechItemRef.current;
            if (!currentSpeechItem) {
              console.error(
                "error: input_audio_buffer.speech_stopped - No speech item found"
              );
              break;
            }

            const [audioBuffer, duration] = await getRecording();
            if (!audioBuffer) {
              console.error(
                "error: input_audio_buffer.speech_stopped - No audio buffer found"
              );
              break;
            }

            setMessages((prev) => {
              const newMessages = new Map(prev);
              newMessages.set(currentSpeechItem.id, {
                audio: {
                  content: audioBuffer,
                  duration: duration,
                  timestamp: new Date().toLocaleTimeString(),
                  role: "user",
                },
              });
              return newMessages;
            });

            currentSpeechItemRef.current = null; // reset the ref
            break;
          }

          case "output_audio_buffer.started":
            startBotRecording();
            currentBotSpeechItemRef.current = {
              id: event.response_id,
              startTime: Date.now(),
            };
            break;

          case "output_audio_buffer.stopped":
            // Stop recording when bot stops speaking and add to messages
            if (currentBotSpeechItemRef.current?.startTime) {
              const [audioBuffer, duration] = await getBotRecording();
              if (!audioBuffer) {
                console.error(
                  "error: output_audio_buffer.stopped - No audio buffer found"
                );
                break;
              }

              const currentBotSpeechItem = currentBotSpeechItemRef.current;
              if (!currentBotSpeechItem) {
                console.error(
                  "error: output_audio_buffer.stopped - No bot speech item found"
                );
                break;
              }

              setMessages((prev) => {
                const newMessages = new Map(prev);
                const responseId = currentBotSpeechItem.id;

                if (responseId && prev.has(responseId)) {
                  const currentMessage = prev.get(responseId);
                  newMessages.set(responseId, {
                    ...currentMessage,
                    audio: {
                      content: audioBuffer,
                      duration: duration,
                      timestamp: new Date().toLocaleTimeString(),
                      role: "assistant",
                    },
                  });
                } else {
                  // If we can't find the matching text message, create a new message with just audio
                  const newId = crypto.randomUUID();
                  newMessages.set(newId, {
                    audio: {
                      content: audioBuffer,
                      duration: duration,
                      timestamp: new Date().toLocaleTimeString(),
                      role: "assistant",
                    },
                  });
                }
                return newMessages;
              });

              currentBotSpeechItemRef.current = null;
            }
            break;
        }

        setEvents((prev) => [event, ...prev]);
      });

      dc.addEventListener("error", (e) => {
        console.error("Data channel error:", e);
        handleConnectionError();
      });

      dc.addEventListener("close", () => {
        console.log("Data channel closed");
        cleanup();
      });

      dcRef.current = dc;

      if (selectedModel.provider === providers.OpenAI) {
        // OpenAI WebRTC signalling with an HTTP POST request

        const noWsOffer = await pc.createOffer();
        await pc.setLocalDescription(noWsOffer);
        console.log("the ephemeral key is ==>", ephemeralKey);

        const url = `https://${selectedModel.provider.url}/v1/realtime?model=${sessionConfig.model}`;
        const sdpResponse = await fetch(url, {
          method: "POST",
          body: noWsOffer.sdp,
          headers: {
            Authorization: `Bearer ${ephemeralKey}`,
            "Content-Type": "application/sdp",
          },
        });

        const answer = {
          type: "answer",
          sdp: await sdpResponse.text(),
        };
        await pc.setRemoteDescription(answer);

        return;
      }

      // Outspeed WebRTC signalling of  SDPs and ICE candidates via WebSocket
      const ws = new WebSocket(
        `wss://${selectedModel.provider.url}/v1/realtime/ws?client_secret=${ephemeralKey}`
      );
      console.log("the api key is ==>", ephemeralKey);

      signallingWsRef.current = ws;

      const wsConnectedPromise = new Promise((resolve, reject) => {
        ws.onopen = () => {
          ws.onopen = null;
          ws.onerror = null;
          console.log("WebSocket connected for WebRTC signaling");
          ws.send(JSON.stringify({ type: "ping" }));
          resolve();
        };

        ws.onerror = (event) => {
          ws.onopen = null;
          ws.onerror = null;
          console.error("WebSocket error:", event);
          handleConnectionError();
          reject(event);
        };
      });

      await wsConnectedPromise;

      ws.onmessage = async (message) => {
        const data = JSON.parse(message.data);
        switch (data.type) {
          case "pong": {
            console.log("pong received. creating offer....");

            // Create and send offer
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);

            console.log("sending offer....");
            ws.send(
              JSON.stringify({
                type: "offer",
                sdp: pc.localDescription.sdp,
              })
            );

            setLoadingModel(true); // data channel will open first and then the model will be loaded
            break;
          }
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
            console.error("WebSocket error after WS connection:", data.message);
            handleConnectionError();
            break;
          default:
            if (data.event_id) {
              data.server_sent = true;
              setEvents((prev) => [data, ...prev]);
            }

            break;
        }
      };

      ws.onclose = (e) => {
        console.log("WebSocket closed", e.code, e.reason);

        // https://developer.mozilla.org/en-US/docs/Web/API/CloseEvent/code#value
        if (e.code !== 1000) {
          handleConnectionError();
        }
      };

      ws.onerror = (event) => {
        console.error("WebSocket error after WS connection:", event);
        handleConnectionError();
      };

      // ICE candidate handling
      pc.onicecandidate = (event) => {
        if (event.candidate) {
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
    } catch (error) {
      console.error("Failed to start WebRTC session:", error);
      handleConnectionError();
    }
  }

  function stopWebrtcSession() {
    // Stop recording if active
    if (
      iAudioRecorderRef.current &&
      iAudioRecorderRef.current.state !== "inactive"
    ) {
      iAudioRecorderRef.current.stop();
    }

    // Stop bot recording if active
    if (
      oAudioRecorderRef.current &&
      oAudioRecorderRef.current.state !== "inactive"
    ) {
      oAudioRecorderRef.current.stop();
    }

    if (dcRef.current) {
      dcRef.current.close();
    }

    if (pcRef.current) {
      pcRef.current.getSenders().forEach((sender) => {
        if (sender.track) {
          sender.track.stop();
        }
      });
      pcRef.current.close();
    }

    // Stop the session duration interval
    if (sessionDurationInterval.current) {
      clearInterval(sessionDurationInterval.current);
      sessionDurationInterval.current = null;
    }

    cleanup();

    // if this function was called because of a connection error, don't show a toast
    if (!isSessionActive) {
      return;
    }

    const toastOptions = { richColors: false };

    // only show this action if the provider is Outspeed
    if (selectedModel.provider === providers.Outspeed) {
      toastOptions.action = {
        label: "View Details",
        onClick: () => navigate("/sessions"),
      };
    }

    toast.info("Session stopped.", toastOptions);
  }

  function cleanup() {
    setIsSessionActive(false);
    setLoadingModel(false);
    pcRef.current = null;
    dcRef.current = null;
    iAudioRecorderRef.current = null;
    oAudioRecorderRef.current = null; // Clean up bot audio recorder
    currentSpeechItemRef.current = null;
    currentBotSpeechItemRef.current = null; // Clean up bot speech reference

    // Cleanup signaling WebSocket
    const signalingWs = signallingWsRef.current;
    if (signalingWs) {
      signalingWs.onopen = null;
      signalingWs.onclose = null;
      signalingWs.onerror = null;
      signalingWs.onmessage = null;
      signalingWs.close();
      signallingWsRef.current = null;
    }

    // Cleanup audio context
    if (audioContext.current) {
      audioContext.current.close();
      audioContext.current = null;
    }

    botStreamingTextRef.current = null;
  }

  function handleConnectionError() {
    stopWebrtcSession();
    cleanup();
    toast.error("Connection error! Check the console for details.");
  }

  function sendClientEvent(message) {
    message.event_id = message.event_id || crypto.randomUUID();

    if (dcRef.current) {
      dcRef.current.send(JSON.stringify(message));
    } else {
      console.error("Failed to send message - no active connection", message);
      return;
    }

    // timestamps are only for frontend debugging
    // they are not sent to the backend nor do they come from the backend
    message.timestamp = message.timestamp || new Date().toLocaleTimeString();

    setEvents((prev) => [message, ...prev]);
  }

  function sendTextMessage(message) {
    const event = {
      type: "conversation.item.create",
      item: {
        type: "message",
        role: "user",
        content: [
          {
            type: "input_text",
            text: message,
          },
        ],
      },
    };

    const messageId = crypto.randomUUID();
    setMessages((prev) => {
      const newMessages = new Map(prev);
      newMessages.set(messageId, {
        text: {
          content: message,
          timestamp: new Date().toLocaleTimeString(),
          role: "user",
        },
      });
      return newMessages;
    });

    sendClientEvent(event);
    sendClientEvent({ type: "response.create" });
  }

  return (
    <main className="h-full flex flex-col px-4 pb-4 gap-4">
      <div className="flex grow gap-4 overflow-hidden">
        <div className="flex-1 h-full min-h-0 rounded-xl bg-white overflow-y-auto">
          <Chat
            messages={messages}
            isSessionActive={isSessionActive}
            loadingModel={loadingModel}
            sendTextMessage={sendTextMessage}
          />
        </div>
        <div className="flex-1 h-full min-h-0 rounded-xl bg-white overflow-y-auto">
          <RightSide
            isSessionActive={isSessionActive}
            loadingModel={loadingModel}
            events={events}
            costState={costState}
            sendClientEvent={sendClientEvent}
          />
        </div>
      </div>
      <section className="shrink-0">
        <SessionControls
          loadingModel={loadingModel}
          startWebrtcSession={startWebrtcSession}
          stopWebrtcSession={stopWebrtcSession}
          sendClientEvent={sendClientEvent}
          sendTextMessage={sendTextMessage}
          events={events}
          isSessionActive={isSessionActive}
        />
      </section>
    </main>
  );
}

const RightSide = ({
  isSessionActive,
  loadingModel,
  events,
  costState,
  sendClientEvent,
}) => {
  const [activeTab, setActiveTab] = useState("events"); // "events" | "session-details"

  let heading;
  if (activeTab === "events") {
    heading = "Event Logs";
  } else if (activeTab === "session-details") {
    heading = "Session Details";
  }

  return (
    <div>
      <div className="sticky top-0 z-10 text-base border-b bg-white p-4 flex items-center justify-between">
        <h3 className="font-semibold">{heading}</h3>
        <select
          className="border rounded-md p-2"
          onChange={(e) => setActiveTab(e.target.value)}
        >
          <option value="events">Event Logs</option>
          <option value="session-details">Session Details</option>
        </select>
      </div>
      {activeTab === "events" && (
        <EventLog
          events={events}
          loadingModel={loadingModel}
          costState={costState}
        />
      )}
      {activeTab === "session-details" && (
        <SessionDetailsPanel
          isSessionActive={isSessionActive}
          loadingModel={loadingModel}
          sendClientEvent={sendClientEvent}
        />
      )}
    </div>
  );
};
```

The key difference is:
Outspeed: Uses WebSocket for continuous bidirectional communication
Allows for ICE candidate exchange
More interactive signaling process
Handles SDP exchange through WebSocket messages
OpenAI: Uses HTTP POST for one-shot SDP exchange
Direct SDP offer/answer exchange
No WebSocket needed
Simpler but less interactive
This explains why our current approach isn't working - we're trying to use OpenAI's HTTP-based SDP exchange method with Outspeed, but Outspeed expects WebSocket-based signaling.
Would you like me to help update our code to use WebSocket-based signaling for Outspeed while keeping the HTTP-based approach for OpenAI?
