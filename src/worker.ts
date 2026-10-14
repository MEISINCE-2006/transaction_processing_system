
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

type RemoteStatus = "found" | "not_found" | "unknown";

function updateStatus(id: string, status: string) {
  db.prepare("UPDATE transactions SET status = ? WHERE id = ?").run(
    status,
    id
  );
}

async function findRemoteTransaction(id: string): Promise<RemoteStatus> {
  try {
    const response = await axios.get(
      `${postingServiceUrl}/transactions/${id}`,
      { timeout: 5000 }
    );

    return response.status === 200 && response.data?.id === id
      ? "found"
      : "unknown";
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
      updateStatus(transactionId, "unknown");
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

    const verification = await findRemoteTransaction(transactionId);

    if (verification === "found") {
      updateStatus(transactionId, "completed");
      return { transactionId, status: "completed" };
    }

    if (verification === "unknown") {
      updateStatus(transactionId, "unknown");
      throw new Error("Posting succeeded but verification was inconclusive");
    }

    throw new Error("Posting returned successfully but transaction was not found");
  },
  {
    connection,
    concurrency: 5
  }
);

worker.on("completed", (job, result) => {
  console.log("Job completed:", job.id, result);
});

worker.on("failed", (job, error) => {
  console.error("Job failed:", job?.id, error.message);

  if (job && job.attemptsMade >= 3) {
    void (async () => {
      const transactionId = job.data.transactionId;
      const status = await findRemoteTransaction(transactionId);

      if (status === "found") {
        updateStatus(transactionId, "completed");
      } else if (status === "unknown") {
        updateStatus(transactionId, "unknown");
      } else {
        updateStatus(transactionId, "failed");
      }
    })().catch((error) => {
      console.error("Final verification failed:", error);
      updateStatus(job.data.transactionId, "unknown");
    });
  }
});

console.log("Transaction worker is running");
