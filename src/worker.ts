
import { Worker } from "bullmq";
import axios from "axios";
import { connection } from "./queue/transactionQueue";
import db from "./db/database";

const postingServiceUrl = process.env.POSTING_SERVICE_URL || "http://localhost:8080";

const worker = new Worker(
  "transaction-processing",
  async (job) => {
    const { transactionId } = job.data;

    const transaction = db.prepare(
      "SELECT * FROM transactions WHERE id = ?"
    ).get(transactionId) as {
      id: string;
      amount: number;
      currency: string;
      description: string;
      status: string;
      created_at: string;
    } | undefined;

    if (!transaction) {
      throw new Error(`Transaction ${transactionId} not found in database`);
    }

    db.prepare(
      "UPDATE transactions SET status = 'processing' WHERE id = ?"
    ).run(transactionId);

    try {
      const existing = await axios.get(
        `${postingServiceUrl}/transactions/${transactionId}`,
        { timeout: 3000 }
      );

      if (existing.status === 200) {
        db.prepare(
          "UPDATE transactions SET status = 'completed' WHERE id = ?"
        ).run(transactionId);

        return { transactionId, status: "completed" };
      }
    } catch (error) {
      if (!axios.isAxiosError(error) || error.response?.status !== 404) {
        throw error;
      }
    }

    const payload = {
      id: transaction.id,
      amount: transaction.amount,
      currency: transaction.currency,
      description: transaction.description,
      timestamp: new Date().toISOString()
    };

    try {
      await axios.post(`${postingServiceUrl}/transactions`, payload, {
        timeout: 15000
      });
    } catch (error) {
      try {
        const verification = await axios.get(
          `${postingServiceUrl}/transactions/${transactionId}`,
          { timeout: 3000 }
        );

        if (verification.status === 200) {
          db.prepare(
            "UPDATE transactions SET status = 'completed' WHERE id = ?"
          ).run(transactionId);

          return { transactionId, status: "completed" };
        }
      } catch (verificationError) {
        if (
          !axios.isAxiosError(verificationError) ||
          verificationError.response?.status !== 404
        ) {
          throw verificationError;
        }
      }

      throw error;
    }

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

  if (job && job.attemptsMade >= 3) {
    db.prepare(
      "UPDATE transactions SET status = 'failed' WHERE id = ?"
    ).run(job.data.transactionId);
  }
});

console.log("Transaction worker is running");
