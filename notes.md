## Redis adapter+pubsub inside the redis ##

npm install @socket.io/redis-adapter redis


 +------------------+        +---------------------+
 |    App Server    |        |   Worker/Service    |
 |  index.js        |        |  messageWorker.js   |
 |                  |        |                     |
 |  - Handles io()  | <----> | Uses Redis adapter  |
 |  - Clients conn. |        | to emit messages    |
 +------------------+        +---------------------+
         |                            |
         |      Redis Pub/Sub         |
         +----------------------------+

## Modify index.js files ##
//for creation of the server
import { createServer } from 'http';
import { Server } from 'socket.io';
import express from 'express';

//for pubsub
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*' }
});


//Creation of the clients 
const pubClient = createClient();
const subClient = pubClient.duplicate();

await pubClient.connect();
await subClient.connect();

//give adapter to client and server

io.adapter(createAdapter(pubClient, subClient));

//add connection to io and events
io.on('connection', socket => {
  console.log('🔌 Client connected:', socket.id);

  socket.on('send_message', async (data, callback) => {
    // send to RabbitMQ queue here
    // (not emitting directly anymore)
  });
});

// Expose io instance if needed
export { io };

listen for http server
httpServer.listen(3000, () => {
  console.log('🚀 Server listening on http://localhost:3000');
});


##  message producers  ##

import amqp from 'amqplib';

async function sendToQueue(queueName,msgObj) {
    const conn = await amqp.connect('amqp://localhost:5672');
    const channel=await conn.createChannel();

    await channel.assertQueue(queueName,{durable:true});

    channel.sendToQueue(queueName, Buffer.from(JSON.stringify(msgObj)), {
        persistent: true  // Ensures message is saved to disk
      });

      await channel.close();
      await conn.close();
}

export default sendToQueue;

======================================================================================================================================

##  messageWorker.js ##

import amqp from 'amqplib';
import Message from '../models/Message.js';
import '../db.js';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';
import { Server } from 'socket.io';

async function init() {
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

====================================================================================================================================

ref={
    index === firstUnseenIndex
      ? firstUnseenRef
      : index === messages.length - 1
      ? bottomRef
      : null
    }

we can use ref of the last seen message

useEffect(()=>{
  if(!hasScrollRef.current){
    if(nonUnseenIdx){
      bootmRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    }else{
      lastNotSeenRef.current?.scrollIntoView({
        behavior:"smooth",
        block:"center"
      });
    }
    hasScrollRef.current=true;
  }
},[messages])