
import { Queue } from "bullmq";
import IORedis from "ioredis";

const connection = new IORedis({
  host: "127.0.0.1",
  port: 6379,
  maxRetriesPerRequest: null
});

export const transactionQueue = new Queue(
  process.env.QUEUE_NAME || "transaction-processing",
  { connection }
);

export { connection };
