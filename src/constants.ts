export const CONNECTION_TYPES = {
  WEBRTC: "webrtc",
  WEBSOCKET: "websocket",
};

export const ICE_SERVERS = [{ urls: "stun:stun.l.google.com:19302" }];

export const OUTSPEED_API_BASE_URL = "https://api.outspeed.com/v1";
export const OUTSPEED_WS_URL = "wss://api.outspeed.com/v1/realtime/ws";
export const OPENAI_API_BASE_URL = "https://api.openai.com/v1";

export const PROVIDERS = {
  OUTSPEED: {
    name: "outspeed",
    url: "api.outspeed.com",
    wsUrl: OUTSPEED_WS_URL,
    apiBaseUrl: OUTSPEED_API_BASE_URL,
  },
  OPENAI: {
    name: "openai",
    url: "api.openai.com",
    apiBaseUrl: OPENAI_API_BASE_URL,
  },
} as const;
