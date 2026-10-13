
import { Worker } from "bullmq";
import { connection } from "./queue/transactionQueue";
import db from "./db/database";

const worker = new Worker(
  "transaction-processing",
  async (job) => {
    const { transactionId } = job.data;

    db.prepare(
      "UPDATE transactions SET status = 'processing' WHERE id = ?"
    ).run(transactionId);

    console.log("Processing transaction:", transactionId);

    db.prepare(
      "UPDATE transactions SET status = 'completed' WHERE id = ?"
    ).run(transactionId);

    return { transactionId, status: "completed" };
  },
  { connection }
);

worker.on("completed", (job) => {
  console.log("Job completed:", job.id);
});

worker.on("failed", (job, error) => {
  console.error("Job failed:", job?.id, error.message);
});

console.log("Transaction worker is running");
