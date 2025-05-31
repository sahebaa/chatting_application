import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

const useSocket = (token) => {
  const socketRef = useRef();
  const [isConnected, setIsConnected] = useState(false); // 👈 added

  useEffect(() => {
    if (!token) return;

    const socket = io("http://localhost:3000", {
      auth: { token },
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("✅ Connected:", socket.id);
      setIsConnected(true); // 👈 update when ready
    });

    socket.on("connect_error", (err) => {
      console.error("❌ Socket error:", err.message);
    });

    return () => {
      socket.disconnect();
      setIsConnected(false); // cleanup
    };
  }, [token]);

  return { socketRef, isConnected };
};

export default useSocket;

