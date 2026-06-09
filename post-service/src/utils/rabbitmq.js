const amqp = require("amqplib");
const logger = require("./Logger");

let connection = null;
let channel = null;

const EXCHANGE_NAME = "facebook_events";

async function connectToRabbitMQ() {
  try {
    connection = await amqp.connect(process.env.RABBITMQ_URL);
    channel = await connection.createChannel();

    await channel.assertExchange(EXCHANGE_NAME, "topic", { durable: false });

    // ✅ Handle disconnections
    connection.on("close", () => {
      logger.warn("RabbitMQ connection closed. Reconnecting...");
      setTimeout(connectToRabbitMQ, 5000);
    });

    connection.on("error", (err) => {
      logger.error("RabbitMQ connection error:", err);
      setTimeout(connectToRabbitMQ, 5000);
    });

    logger.info("Connected to RabbitMQ");
    return channel;
  } catch (e) {
    logger.error("Error connecting to RabbitMQ:", e);
    setTimeout(connectToRabbitMQ, 5000);
  }
}

// ✅ Only one publishEvent
async function publishEvent(routingKey, message) {
  if (!channel) {
    await connectToRabbitMQ();
  }
  channel.publish(
    EXCHANGE_NAME,
    routingKey,
    Buffer.from(JSON.stringify(message))
  );
  logger.info(`Event published: ${routingKey}`, message);
}


async function consume(routingKey, callback) {
  if (!channel) {
    await connectToRabbitMQ();
  }

  // Create a temporary queue and bind it to the exchange
  const q = await channel.assertQueue("", { exclusive: true });
  await channel.bindQueue(q.queue, EXCHANGE_NAME, routingKey);

  logger.info(`Waiting for messages with routing key: ${routingKey}`);

  channel.consume(q.queue, (msg) => {
    if (msg !== null) {
      const content = JSON.parse(msg.content.toString());
      callback(content);
      channel.ack(msg);
    }
  });
}

module.exports = { connectToRabbitMQ, publishEvent, consume};