import amqp from 'amqplib';
import Message from '../models/Message.js';
import connnectDb from './../db.js';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';
import { Server } from 'socket.io';
import dotenv from 'dotenv'
dotenv.config();

async function init() {

  await connnectDb();
  const io = new Server({
    cors: { origin: "http://localhost:5173", credentials: true },
  });

  const pubClient = createClient();
  const subClient = pubClient.duplicate();
  await pubClient.connect();
  await subClient.connect();

  io.adapter(createAdapter(pubClient, subClient));
  console.log('🧵 Worker Socket.IO Ready');

  const conn = await amqp.connect('amqp://localhost:5672');
  const channel = await conn.createChannel();
  const queue = 'chat_messages';
  await channel.assertQueue(queue, { durable: true });

  console.log("🟢 Worker is ready");

  channel.consume(queue, async (msg) => {
    if (msg !== null) {
      const message = JSON.parse(msg.content.toString());
        console.log("here is your message inside the qeue ",message);
      try {
        const saved = await Message.create(message);
        console.log("✅ Saved to DB:", saved);

        const recipientSockets = await pubClient.sMembers(`userSockets:${saved.to}`);
        for (const sid of recipientSockets) {
          io.to(sid).emit("receive_message", saved);
        }

        channel.ack(msg);
      } catch (err) {
        console.error("❌ Error saving or emitting:", err);
      }
    }
  });
}

init().catch(console.error);