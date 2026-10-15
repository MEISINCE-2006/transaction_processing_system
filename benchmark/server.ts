import express from "express";
import { randomUUID } from "node:crypto";

const app = express();
const port = 8081;
const transactions = new Map<string, {
  id: string;
  amount: number;
  currency: string;
  description: string;
  timestamp: string;
}>();

app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "healthy", service: "benchmark-posting-service" });
});

app.get("/transactions/:id", (req, res) => {
  const transaction = transactions.get(req.params.id);
  if (!transaction) {
    return res.status(404).json({ error: "Transaction not found" });
  }
  return res.json(transaction);
});

app.post("/transactions", (req, res) => {
  const { amount, currency, description } = req.body ?? {};

  if (
    typeof amount !== "number" ||
    !Number.isFinite(amount) ||
    amount <= 0 ||
    typeof currency !== "string" ||
    typeof description !== "string"
  ) {
    return res.status(400).json({ error: "Invalid transaction data" });
  }

  const transaction = {
   id: typeof req.body.id === "string" ? req.body.id : randomUUID(),
    amount,
    currency,
    description,
    timestamp: new Date().toISOString()
  };

  transactions.set(transaction.id, transaction);
  return res.status(201).json(transaction);
});

app.listen(port, "0.0.0.0", () => {
  console.log(`Benchmark posting service listening on port ${port}`);
});
