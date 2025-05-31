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