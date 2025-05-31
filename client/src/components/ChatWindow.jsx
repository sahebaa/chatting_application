import React, { useEffect, useRef, useState } from "react";
import useSocket from "../hooks/useSockets";

const ChatWindow = ({ userId, contactId }) => {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [localToken, setLocalToken] = useState(
    () => localStorage.getItem("tempToken") || ""
  );
  const { socketRef, isConnected } = useSocket(localToken);
  const messagesEndRef = useRef(null);

  // Get token if not present
  useEffect(() => {
    if (localToken) return;

    (async function () {
      try {
        const res = await fetch(
          `http://localhost:3000/getoken?sender=${userId}`
        );
        const data = await res.json();
        console.log("✅ Token fetched:", data.token);
        localStorage.setItem("tempToken", data.token);
        setLocalToken(data.token);
      } catch (err) {
        console.error("❌ Token fetch error:", err);
      }
    })();
  }, [localToken, userId]);

  // Listen for incoming messages
  useEffect(() => {
    if (!isConnected || !socketRef.current) return;

    const socket = socketRef.current;

    const onMessage = (msg) => {
      console.log("📩 Received:", msg);
      setMessages((prev) => [...prev, msg]);

      fetch(`http://localhost:3000/messages/${msg._id}/seen`, {
        method: "POST",
      });
      socket.emit("mark_seen", { messageId: msg._id });

    };

    socket.on("receive_message", onMessage);
    return () => {
      socket.off("receive_message", onMessage);
    };
  }, [isConnected]);

  // Fetch chat history
  useEffect(() => {
    fetch(`http://localhost:3000/chat/${contactId}?userId=${userId}`)
      .then((res) => res.json())
      .then((data) => {
        setMessages(data);
      });
  }, [contactId, userId]);

  // Scroll to bottom on message update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Send message
  const sendMessage = () => {
    const socket = socketRef.current;
    if (!socket?.connected) {
      console.warn("❌ Socket not ready");
      return;
    }

    const message = { to: contactId, text };
    socket.emit("send_message", message);

    setMessages((prev) => [
      ...prev,
      {
        ...message,
        from: userId,
        timestamp: new Date().toISOString(),
      },
    ]);
    setText("");
  };

//Listening to typing event when user is typing we are geeting res here
useEffect(() => {
  const socket = socketRef.current;

  if (!socket) return;

  const waitUntilReady = () => {
    if (socket.connected) {
      socket.on("typing", handleTyping);
    } else {
      socket.once("connect", () => {
        socket.on("typing", handleTyping);
      });
    }
  };

  const handleTyping = ({ from }) => {
    if (from === contactId) {
      console.log("✏️ Typing event received from", from);
    }
  };

  waitUntilReady();

  return () => {
    socket.off("typing", handleTyping);
  };
}, [contactId]);


  const handleTypingChange=(e)=>{
    const socket=socketRef.current;
    console.log("value from even",e.target.value);
    setText(e.target.value);
    socket.emit("typing",contactId);
  }

  return (
    <div style={{ padding: 20, border: "1px solid #ccc" }}>
     <div style={{position:"fixed", width:"100%",height:"4rem",background:"red",color:"white"}}>
        <h3>Chat with {contactId}</h3>
     </div>
      <div
        style={{
          height: "90%",
          overflowY: "scroll",
          border: "1px solid #eee",
          marginBottom: 10,
        }}
      >
        {messages.map((msg) => {
          const isOwnMessage = msg.from === userId;
          return (
            <div
              key={msg._id || msg.timestamp}
              style={{
                display: "flex",
                justifyContent: isOwnMessage ? "flex-end" : "flex-start",
                marginBottom: "10px",
              }}
            >
              <div
                className="messageContent"
                style={{
                  maxWidth: "70%",
                  backgroundColor: isOwnMessage ? "red" : "#333",
                  color: "white",
                  borderRadius: isOwnMessage
                    ? "15px 15px 0 10px"
                    : "15px 15px 10px 0",
                  padding: "10px 15px",
                }}
              >
                <div>{msg.text}</div>
                <small
                  style={{
                    display: "block",
                    textAlign: "right",
                    marginTop: "5px",
                    opacity: 0.7,
                  }}
                >
                  {new Date(msg.timestamp).toLocaleTimeString()}{" "}
                  {msg.seen && isOwnMessage ? "✓ Seen" : ""}
                </small>
              </div>
            </div>
          );
        })}

        <div ref={messagesEndRef} />
      </div>
      <div style={{display:"flex", alignItems:"center", border:"1px solid red" }}>
        <input
          value={text}
          onChange={(e) => handleTypingChange(e)}
          style={{ border: "none", outline: "none", flex: 1 }}
          placeholder="Type a message"
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
};

export default ChatWindow;
