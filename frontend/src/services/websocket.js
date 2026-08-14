const getSocketUrl = () => {

    // --------------------------------------------------------
    // Explicit WebSocket URL from .env
    // --------------------------------------------------------

    if (import.meta.env.VITE_WEBSOCKET_URL) {

        return import.meta.env.VITE_WEBSOCKET_URL;

    }


    // --------------------------------------------------------
    // Otherwise derive WebSocket URL from backend URL
    // --------------------------------------------------------

    const backendUrl =
        import.meta.env.VITE_BACKEND_URL ||
        "http://127.0.0.1:8000";


    const wsUrl =
        backendUrl.replace(
            /^http/,
            "ws"
        );


    return `${wsUrl}/ws/disaster`;

};


const SOCKET_URL =
    getSocketUrl();


// ============================================================
// CONNECT WEBSOCKET
// ============================================================

export const connectWebSocket = (
    onMessage
) => {

    if (
        typeof onMessage !== "function"
    ) {

        throw new Error(
            "connectWebSocket requires a callback function"
        );

    }


    console.log(
        "🔌 Connecting WebSocket:",
        SOCKET_URL
    );


    const socket =
        new WebSocket(
            SOCKET_URL
        );


    // ========================================================
    // OPEN
    // ========================================================

    socket.onopen = () => {

        console.log(
            "✅ WebSocket Connected"
        );

    };


    // ========================================================
    // MESSAGE
    // ========================================================

    socket.onmessage = (
        event
    ) => {

        try {

            const message =
                JSON.parse(
                    event.data
                );


            console.log(
                "📡 WS MESSAGE:",
                message
            );


            onMessage(
                message
            );

        }

        catch (error) {

            console.error(
                "❌ Invalid WebSocket message:",
                error
            );

        }

    };


    // ========================================================
    // ERROR
    // ========================================================

    socket.onerror = (
        error
    ) => {

        console.error(
            "❌ WebSocket Error:",
            error
        );

    };


    // ========================================================
    // CLOSE
    // ========================================================

    socket.onclose = () => {

        console.log(
            "🔌 WebSocket Closed"
        );

    };


    return socket;

};