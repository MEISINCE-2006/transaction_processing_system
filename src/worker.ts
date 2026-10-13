
import { Worker } from "bullmq";
import axios from "axios";
import { connection } from "./queue/transactionQueue";
import db from "./db/database";

const postingServiceUrl =
  process.env.POSTING_SERVICE_URL || "http://localhost:8080";

type Transaction = {
  id: string;
  amount: number;
  currency: string;
  description: string;
  status: string;
  created_at: string;
};

function updateStatus(id: string, status: string) {
  db.prepare("UPDATE transactions SET status = ? WHERE id = ?").run(
    status,
    id
  );
}

async function findRemoteTransaction(id: string) {
  try {
    const response = await axios.get(
      `${postingServiceUrl}/transactions/${id}`,
      { timeout: 5000 }
    );

    return response.status === 200 ? "found" : "unknown";
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return "not_found";
    }

    return "unknown";
  }
}

const worker = new Worker(
  "transaction-processing",
  async (job) => {
    const { transactionId } = job.data as { transactionId: string };

    const transaction = db
      .prepare("SELECT * FROM transactions WHERE id = ?")
      .get(transactionId) as Transaction | undefined;

    if (!transaction) {
      throw new Error(`Transaction ${transactionId} not found locally`);
    }

    const remoteStatus = await findRemoteTransaction(transactionId);

    if (remoteStatus === "found") {
      updateStatus(transactionId, "completed");
      return { transactionId, status: "completed" };
    }

    if (remoteStatus === "unknown") {
      throw new Error("Unable to determine external transaction status");
    }

    updateStatus(transactionId, "processing");

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

      updateStatus(transactionId, "completed");
      return { transactionId, status: "completed" };
    } catch (error) {
      const verification = await findRemoteTransaction(transactionId);

      if (verification === "found") {
        updateStatus(transactionId, "completed");
        return { transactionId, status: "completed" };
      }

      if (verification === "unknown") {
        updateStatus(transactionId, "unknown");
        throw new Error(
          "Posting outcome is uncertain; external verification failed"
        );
      }

      throw error;
    }
  },
  {
    connection,
    concurrency: 1
  }
);

worker.on("completed", (job) => {
  console.log("Job completed:", job.id);
});

worker.on("failed", (job, error) => {
  console.error("Job failed:", job?.id, error.message);

  if (job && job.attemptsMade >= 3) {
    const verification = findRemoteTransaction(
      job.data.transactionId
    );

    verification
      .then((status) => {
        if (status === "found") {
          updateStatus(job.data.transactionId, "completed");
        } else if (status === "unknown") {
          updateStatus(job.data.transactionId, "unknown");
        } else {
          updateStatus(job.data.transactionId, "failed");
        }
      })
      .catch((verificationError) => {
        console.error("Final verification failed:", verificationError);
        updateStatus(job.data.transactionId, "unknown");
      });
  }
});

console.log("Transaction worker is running");
