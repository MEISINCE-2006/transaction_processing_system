import { connection } from "./queue/transactionQueue";
import axios from "axios";
import express from "express";
import { randomUUID } from "crypto";
import db from "./db/database";
import { transactionQueue } from "./queue/transactionQueue";

export const app = express();
const PORT = 3000;


app.use(express.json());
const ALLOWED_ORIGINS = new Set([
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:4173",
  "http://127.0.0.1:4173",
  "http://localhost:3000"
]);

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, Idempotency-Key");
    res.setHeader("Access-Control-Allow-Credentials", "true");
  }
  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }
  next();
});

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";
const activeTokens = new Map<string, { username: string; expiresAt: number }>();

function generateAuthToken(username: string): string {
  const token = randomUUID();
  activeTokens.set(token, {
    username,
    expiresAt: Date.now() + 24 * 60 * 60 * 1000
  });
  return token;
}

function verifyAuthToken(token: string): { username: string } | null {
  const session = activeTokens.get(token);
  if (!session) return null;
  if (Date.now() > session.expiresAt) {
    activeTokens.delete(token);
    return null;
  }
  return { username: session.username };
}

app.post("/api/auth/login", (req, res) => {
  const { username, password } = req.body || {};

  if (!username || typeof username !== "string" || !password || typeof password !== "string") {
    return res.status(400).json({
      error: "Username and password are required"
    });
  }

  if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
    return res.status(401).json({
      error: "Invalid username or password"
    });
  }

  const token = generateAuthToken(username);
  return res.status(200).json({
    token,
    user: {
      username,
      role: "admin"
    }
  });
});

app.get("/api/auth/me", (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      error: "Missing or invalid authorization token"
    });
  }

  const token = authHeader.slice(7).trim();
  const session = verifyAuthToken(token);

  if (!session) {
    return res.status(401).json({
      error: "Invalid or expired session"
    });
  }

  return res.status(200).json({
    user: {
      username: session.username,
      role: "admin"
    }
  });
});

app.post("/api/auth/logout", (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.slice(7).trim();
    activeTokens.delete(token);
  }

  return res.status(200).json({
    message: "Logged out successfully"
  });
});



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
  const idempotencyKey = req.get("Idempotency-Key")?.trim();

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

  if (
    idempotencyKey &&
    (idempotencyKey.length > 200 || idempotencyKey.length === 0)
  ) {
    return res.status(400).json({
      error: "Idempotency-Key must contain between 1 and 200 characters"
    });
  }
  if (idempotencyKey) {
    const existing = db.prepare(`
      SELECT t.*
      FROM idempotency_keys k
      JOIN transactions t ON t.id = k.transaction_id
      WHERE k.key = ?
    `).get(idempotencyKey) as {
      id: string;
      status: string;
      created_at: string;
      amount: number;
      currency: string;
      description: string;
    } | undefined;

    if (existing) {
      const samePayload =
        existing.amount === amount &&
        existing.currency === currency &&
        existing.description === description.trim();

      if (!samePayload) {
        return res.status(409).json({
          error: "Idempotency key has already been used with a different request"
        });
      }

      return res.status(200).json({
        transactionId: existing.id,
        status: existing.status,
        createdAt: existing.created_at,
        idempotentReplay: true
      });
    }
  }


  const id = randomUUID();
  const createdAt = new Date().toISOString();


const createTransaction = db.transaction(() => {
  db.prepare(`
    INSERT INTO transactions (id, amount, currency, description, status, created_at)
    VALUES (?, ?, ?, ?, 'pending', ?)
  `).run(id, amount, currency, description.trim(), createdAt);

  if (idempotencyKey) {
    db.prepare(`
      INSERT INTO idempotency_keys (key, transaction_id)
      VALUES (?, ?)
    `).run(idempotencyKey, id);
  }
});
  try {
    createTransaction();
  } catch (error) {
    if (idempotencyKey) {
      const existing = db.prepare(`
        SELECT t.*
        FROM idempotency_keys k
        JOIN transactions t ON t.id = k.transaction_id
        WHERE k.key = ?
      `).get(idempotencyKey) as {
        id: string;
        status: string;
        created_at: string;
        amount: number;
        currency: string;
        description: string;
      } | undefined;

      if (existing) {
        const samePayload =
          existing.amount === amount &&
          existing.currency === currency &&
          existing.description === description.trim();

        if (!samePayload) {
          return res.status(409).json({
            error: "Idempotency key has already been used with a different request"
          });
        }

        return res.status(200).json({
          transactionId: existing.id,
          status: existing.status,
          createdAt: existing.created_at,
          idempotentReplay: true
        });
      }
    }

    console.error("Failed to save transaction:", error);

    return res.status(500).json({
      error: "Failed to save transaction"
    });
  }


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
    createdAt,
    idempotentReplay: false
  });
});



app.get("/api/transactions", (req, res) => {
  const { limit, page, status, search, startDate, endDate } = req.query;

  if (
    limit !== undefined ||
    page !== undefined ||
    status !== undefined ||
    search !== undefined ||
    startDate !== undefined ||
    endDate !== undefined
  ) {
    const limitNum = Math.min(100, Math.max(1, parseInt(String(limit || 25), 10)));
    const pageNum = Math.max(1, parseInt(String(page || 1), 10));
    const offset = (pageNum - 1) * limitNum;

    const conditions: string[] = [];
    const params: (string | number)[] = [];

    if (status && typeof status === "string" && status !== "all") {
      conditions.push("status = ?");
      params.push(status);
    }

    if (search && typeof search === "string" && search.trim().length > 0) {
      conditions.push("(id LIKE ? OR description LIKE ?)");
      params.push(`%${search.trim()}%`, `%${search.trim()}%`);
    }

    if (startDate && typeof startDate === "string" && startDate.trim().length > 0) {
      conditions.push("created_at >= ?");
      params.push(startDate.trim());
    }

    if (endDate && typeof endDate === "string" && endDate.trim().length > 0) {
      conditions.push("created_at <= ?");
      params.push(endDate.trim());
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const totalRow = db.prepare(
      `SELECT count(*) as count FROM transactions ${whereClause}`
    ).get(...params) as { count: number } | undefined;
    const total = totalRow ? totalRow.count : 0;

    const transactions = db.prepare(
      `SELECT * FROM transactions ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`
    ).all(...params, limitNum, offset);

    const statusRows = db.prepare(
      "SELECT status, count(*) as count FROM transactions GROUP BY status"
    ).all() as { status: string; count: number }[];

    const statusCounts: Record<string, number> = {
      pending: 0,
      processing: 0,
      completed: 0,
      failed: 0,
      unknown: 0
    };
    for (const row of statusRows) {
      if (row.status in statusCounts) {
        statusCounts[row.status] = row.count;
      }
    }

    return res.status(200).json({
      count: transactions.length,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
      statusCounts,
      transactions
    });
  }

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
WHERE status IN ('pending', 'unknown')
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
  await job.remove();
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

if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => {
    console.log(`Transaction API running at http://localhost:${PORT}`);
  });
}