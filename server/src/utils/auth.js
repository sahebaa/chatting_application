// utils/auth.js
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

const authenticateSocket = (socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error("No token"));

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.userId;
    console.log("✅ Socket authenticated as:", decoded.userId);
    next();
  } catch (err) {
    console.error("❌ Invalid token:", err.message);
    return next(new Error("Invalid token"));
  }
};

export default authenticateSocket;
