import './src/db.js';
import User from './src/models/Users.js';

(async function () {
    const user=await User.create({name:"ram",lastName:"patil",email:"ram@gmail.com",password:'1234',lastSeen:new Date()})
    console.log("User generated successfully",user)
})()


/*
import { createClient } from 'redis';
import User from './src/models/Users.js';

const redis = createClient();
redis.on('error', (err) => console.error('Redis Client Error', err));
await redis.connect();

// SET both expirable and backup keys
const userId = "6837fb016516fbdfdedb7d6a";
const key = `lastSeen:${userId}`;
const value = new Date().toISOString();

await redis.set(key, value, { EX: 5000 }); // expires
await redis.set(`backup:lastSeen:${userId}`, value); // persists

console.log(`Set key ${key} with value ${value}`);

// SUBSCRIBE to expiration events
const subClient = redis.duplicate();
await subClient.connect();

await subClient.subscribe("__keyevent@0__:expired", async (key) => {
  if (key.startsWith("lastSeen:")) {
    const userId = key.split(':')[1];
    const backupKey = `backup:lastSeen:${userId}`;
    const data = await redis.get(backupKey);

    if (data) {
      const lastSeen = new Date(data);
      const res = await User.updateOne({ _id: userId }, { $set: { lastSeen } });
      console.log("Updated user lastSeen:", res);
      await redis.del(backupKey); // cleanup
    }
  }
});

*/