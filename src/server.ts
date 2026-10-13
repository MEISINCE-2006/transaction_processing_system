
import express from "express";
import db from "./db/database";
import { randomUUID } from "crypto";

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

app.post("/api/transactions", (req, res) => {
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

  return res.status(202).json({
    transactionId: id,
    status: "pending",
    createdAt
  });
});

app.get("/api/transactions/:id", (req, res) => {
  const transaction = db.prepare(
    "SELECT * FROM transactions WHERE id = ?"
  ).get(req.params.id);

  if (!transaction) {
    return res.status(404).json({
      error: "Transaction not found"
    });
  }

  return res.json(transaction);
});


app.listen(PORT, () => {
  console.log(`Transaction API running at http://localhost:${PORT}`);
});
