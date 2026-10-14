import { connection } from "./queue/transactionQueue";
import axios from "axios";
import express from "express";
import { randomUUID } from "crypto";
import db from "./db/database";
import { transactionQueue } from "./queue/transactionQueue";

const app = express();
const PORT = 3000;

app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "Welcome to the Transaction Processing System API"
  });
});

app.get("/api/health", async (req, res) => {
  try {
    const [redisStatus, counts] = await Promise.all([
      connection.ping(),
      transactionQueue.getJobCounts(
        "waiting",
        "active",
        "completed",
        "failed",
        "delayed"
      )
    ]);

    const database = db.prepare(
      "SELECT 1 AS connected"
    ).get();

    const healthy = redisStatus === "PONG" && Boolean(database);

    return res.status(healthy ? 200 : 503).json({
      status: healthy ? "healthy" : "degraded",
      services: {
        database: database ? "connected" : "disconnected",
        redis: redisStatus === "PONG" ? "connected" : "disconnected"
      },
      queue: {
        waiting: counts.waiting,
        active: counts.active,
        completed: counts.completed,
        failed: counts.failed,
        delayed: counts.delayed
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Health check failed:", error);

    return res.status(503).json({
      status: "unhealthy",
      error: "A health check dependency is unavailable",
      timestamp: new Date().toISOString()
    });
  }
});

app.get("/api/db-test", (req, res) => {
  const result = db.prepare(
    "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'transactions'"
  ).get();

  res.json({
    database: result ? "connected" : "not connected",
    table: result ? "transactions exists" : "transactions missing"
  });
});

app.post("/api/transactions", async (req, res) => {
  const { amount, currency, description } = req.body;

  if (
    typeof amount !== "number" ||
    !Number.isFinite(amount) ||
    amount <= 0 ||
    typeof currency !== "string" ||
    !/^[A-Z]{3}$/.test(currency) ||
    typeof description !== "string" ||
    description.trim().length === 0
  ) {
    return res.status(400).json({
      error: "Provide a positive amount, a three-letter uppercase currency, and a description"
    });
  }

  const id = randomUUID();
  const createdAt = new Date().toISOString();

  db.prepare(`
    INSERT INTO transactions (id, amount, currency, description, status, created_at)
    VALUES (?, ?, ?, ?, 'pending', ?)
  `).run(id, amount, currency, description.trim(), createdAt);

  try {
    await transactionQueue.add(
      "process-transaction",
      { transactionId: id },
      {
        jobId: id,
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 2000
        },
        removeOnComplete: 1000,
        removeOnFail: 5000
      }
    );
  } catch (error) {
    console.error("Failed to enqueue transaction:", error);

    return res.status(503).json({
      error: "Transaction saved but could not be queued",
      transactionId: id,
      status: "pending"
    });
  }

  return res.status(202).json({
    transactionId: id,
    status: "pending",
    createdAt
  });
});


app.get("/api/transactions", (req, res) => {
  const transactions = db.prepare(
    "SELECT * FROM transactions ORDER BY created_at DESC"
  ).all();

  return res.status(200).json({
    count: transactions.length,
    transactions
  });
});

app.get("/api/transactions/:id", (req, res) => {
  const transaction = db.prepare(
    "SELECT * FROM transactions WHERE id = ?"
  ).get(req.params.id);

  if (!transaction) {
    return res.status(404).json({ error: "Transaction not found" });
  }

  return res.json(transaction);
});

app.post("/api/transactions/:id/reconcile", async (req, res) => {
  const id = req.params.id;

  const transaction = db.prepare(
    "SELECT id FROM transactions WHERE id = ?"
  ).get(id);

  if (!transaction) {
    return res.status(404).json({
      error: "Local transaction not found"
    });
  }

  const postingServiceUrl =
    process.env.POSTING_SERVICE_URL || "http://localhost:8080";

  try {
    const response = await axios.get(
      `${postingServiceUrl}/transactions/${id}`,
      { timeout: 5000 }
    );

    if (response.status !== 200 || response.data?.id !== id) {
      return res.status(409).json({
        status: "unknown",
        message: "External transaction could not be verified"
      });
    }

    db.prepare(
      "UPDATE transactions SET status = ? WHERE id = ?"
    ).run("completed", id);

    return res.json({
      transactionId: id,
      status: "completed",
      reconciled: true
    });
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return res.status(409).json({
        transactionId: id,
        status: "not_found",
        message: "External transaction does not exist; no new transaction was submitted"
      });
    }

    return res.status(503).json({
      transactionId: id,
      status: "unknown",
      message: "External transaction status could not be verified"
    });
  }
});

app.post("/api/recovery/requeue", async (req, res) => {
  const axios = (await import("axios")).default;

  const postingServiceUrl =
    process.env.POSTING_SERVICE_URL || "http://localhost:8080";

  const candidates = db.prepare(`
    SELECT id
    FROM transactions
    WHERE status = 'pending'
    ORDER BY created_at ASC
  `).all() as { id: string }[];

  const results = {
    checked: 0,
    requeued: 0,
    alreadyExists: 0,
    uncertain: 0,
    errors: 0
  };

  for (const transaction of candidates) {
    results.checked++;

    try {
      const job = await transactionQueue.getJob(transaction.id);

      if (job) {
        const state = await job.getState();

        if (
          state === "waiting" ||
          state === "active" ||
          state === "delayed" ||
          state === "waiting-children"
        ) {
          continue;
        }

        if (state === "completed") {
          results.alreadyExists++;
          continue;
        }

        if (state === "failed") {
          results.errors++;
          continue;
        }
      }

      let remoteExists = false;

      try {
        const response = await axios.get(
          `${postingServiceUrl}/transactions/${transaction.id}`,
          { timeout: 5000 }
        );

        remoteExists =
          response.status === 200 &&
          response.data?.id === transaction.id;
      } catch (error) {
        if (
          !axios.isAxiosError(error) ||
          error.response?.status !== 404
        ) {
          results.uncertain++;
          continue;
        }
      }

      if (remoteExists) {
        db.prepare(
          "UPDATE transactions SET status = 'completed' WHERE id = ?"
        ).run(transaction.id);

        results.alreadyExists++;
        continue;
      }

      if (job) {
        await job.remove();
      }

      await transactionQueue.add(
        "process-transaction",
        { transactionId: transaction.id },
        {
          jobId: transaction.id,
          attempts: 3,
          backoff: {
            type: "exponential",
            delay: 2000
          },
          removeOnComplete: 1000,
          removeOnFail: 5000
        }
      );

      results.requeued++;
    } catch (error) {
      console.error(
        `Recovery failed for ${transaction.id}:`,
        error
      );
      results.errors++;
    }
  }

  return res.json(results);
});


app.listen(PORT, () => {
  console.log(`Transaction API running at http://localhost:${PORT}`);
});
