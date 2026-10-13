
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

app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    message: "Transaction Processing API is running",
    timestamp: new Date().toISOString()
  });
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

app.listen(PORT, () => {
  console.log(`Transaction API running at http://localhost:${PORT}`);
});
