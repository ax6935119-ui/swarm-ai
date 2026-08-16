const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL ||
  "http://127.0.0.1:8000";

const WS_URL =
  BACKEND_URL
    .replace(/^http:/, "ws:")
    .replace(/^https:/, "wss:");

let socket = null;
let reconnectTimer = null;

export function connectWebSocket({
  onMessage,
  onOpen,
  onClose,
  onError,
} = {}) {
  if (
    socket &&
    (
      socket.readyState === WebSocket.OPEN ||
      socket.readyState === WebSocket.CONNECTING
    )
  ) {
    return socket;
  }

  const url = `${WS_URL}/ws/disaster`;

  console.log("🔌 Connecting WebSocket:", url);

  socket = new WebSocket(url);

  socket.onopen = () => {
    console.log("🟢 WebSocket connected");

    if (onOpen) {
      onOpen();
    }
  };

  socket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);

      console.log("📡 WebSocket message:", data);

      if (onMessage) {
        onMessage(data);
      }
    } catch (error) {
      console.error(
        "❌ WebSocket JSON parse error:",
        error
      );
    }
  };

  socket.onerror = (error) => {
    console.error(
      "❌ WebSocket error:",
      error
    );

    if (onError) {
      onError(error);
    }
  };

  socket.onclose = () => {
    console.log(
      "🔴 WebSocket disconnected"
    );

    socket = null;

    if (onClose) {
      onClose();
    }

    // reconnect after 3 seconds
    reconnectTimer = setTimeout(() => {
      connectWebSocket({
        onMessage,
        onOpen,
        onClose,
        onError,
      });
    }, 3000);
  };

  return socket;
}

export function disconnectWebSocket() {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }

  if (socket) {
    socket.close();
    socket = null;
  }
}

export function getWebSocket() {
  return socket;
}