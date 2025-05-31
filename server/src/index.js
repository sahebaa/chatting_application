import dotenv from "dotenv";
dotenv.config();
import express from "express";
import http from "http";
import connectDb from './db.js'
import { Server } from "socket.io";
import { createClient } from "redis";
import cors from "cors";
import jwt from "jsonwebtoken";
import bodyParser from "body-parser";
import sendToQueue from "./messageMq/messageProducer.js";
import { createAdapter } from '@socket.io/redis-adapter';
import Message from "./models/Message.js";
import authenticateSocket from "./utils/auth.js";


await connectDb();
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "http://localhost:5173", credentials: true },
});

const pubClient = createClient();
const subClient = pubClient.duplicate();
await pubClient.connect();
await subClient.connect();
io.adapter(createAdapter(pubClient, subClient));

const redis = createClient();
await redis.connect();

app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json());

// JWT endpoint
app.get("/getoken", async (req, res) => {
  const key = process.env.JWT_SECRET;
  const userId = req.query.sender;
  const token = await jwt.sign({ userId }, key);
  res.status(200).json({ token });
});

// Chat history
app.get("/chat/:contactId", async (req, res) => {
  const userId = req.query.userId;
  const contactId = req.params.contactId;

  const messages = await Message.find({
    $or: [
      { from: userId, to: contactId },
      { from: contactId, to: userId },
    ],
  }).sort({ timestamp: 1 });

  res.json(messages);
});

console.log("from index.js",process.env.MONGO_URI);

// Mark message as seen
app.post("/messages/:messageId/seen", async (req, res) => {
  const messageId = req.params.messageId;
  await Message.findByIdAndUpdate(messageId, { seen: true });
  res.sendStatus(200);
});

// Socket logic
io.use(authenticateSocket);
io.on("connection", (socket) => {
  const userId = socket.userId;
  redis.sAdd(`userSockets:${userId}`, socket.id);

  socket.on("send_message", async (data, callback) => {
    const { to, text } = data;
    const message = { from: userId, to, text };
    console.log("message on server",message);
    try {
      await sendToQueue("chat_messages", message);
      callback && callback({ status: "queued" });
    } catch (err) {
      console.error("❌ Queue failed:", err);
      callback && callback({ status: "error" });
    }
  });

  socket.on("mark_seen", async ({ messageId }) => {
    await Message.findByIdAndUpdate(messageId, { seen: true });
  });

  socket.on("typing",(userId)=>{
    console.log(`Typing message for ${userId}`);
    io.to(userId).emit("typing", "typing....");
  })

  socket.on("disconnect", () => {
    console.log(`User disconnected ${userId}`);
    redis.sAdd(`lastSeen:${userId}`, Date.now().toString());
    redis.sRem(`userSockets:${userId}`, socket.id);
  });
});

server.listen(3000, () => {
  console.log("🚀 Server running on http://localhost:3000");
});


/*import express from 'express';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import http from 'http'
import { Server } from 'socket.io';
import { createClient } from "redis";
import cors from 'cors'
import Message from './models/Message.js'
import authenticateSocket from './utils/auth.js'

dotenv.config();
const app=express();
app.use(cors({
    origin: "http://localhost:5173",
    credentials: true
  }))
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "http://localhost:5173", credentials: true } });
const redis = createClient();
redis.connect();

try{
    mongoose.connect(process.env.MONGO_URI).then((res)=>{
        console.log('connected to server successfully');
    });
}catch(err){
    console.log(err);
}

io.use(authenticateSocket);

io.on("connection",(socket)=>{
    const userId=socket.userId;
    redis.sAdd(`userSockets:${userId}`, socket.id);
    console.log(`User connected: ${userId}`);

    socket.on("send_message", async ({ to, text }) => {
        const message = await Message.create({ from: userId, to, text });
        const recipientSockets = await redis.sMembers(`userSockets:${to}`);
        for (const sid of recipientSockets) {
          io.to(sid).emit("receive_message", message);
        }
      });
    
      socket.on("disconnect", () => {
        redis.sRem(`userSockets:${userId}`, socket.id);
      });

})

const PORT=process.env.PORT;

server.listen(3000, () => console.log("Server running on http://localhost:3000"));

*/
