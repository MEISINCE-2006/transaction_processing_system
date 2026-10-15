
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

const axiosGet = vi.hoisted(() => vi.fn());

vi.mock("axios", async (importOriginal) => {
  const actual = await importOriginal<typeof import("axios")>();
  return {
    ...actual,
    default: {
      ...actual.default,
      get: axiosGet
    }
  };
});

import request from "supertest";
import { app } from "../src/server";
import db from "../src/db/database";
import { transactionQueue, connection } from "../src/queue/transactionQueue";

describe("Transaction recovery API", () => {
  beforeEach(async () => {
    axiosGet.mockReset();

    await transactionQueue.obliterate({ force: true });

    db.prepare("DELETE FROM idempotency_keys").run();
    db.prepare("DELETE FROM transactions").run();
  });

  it("requeues a pending transaction when it does not exist remotely", async () => {
    const transactionId = "recovery-test-001";

    db.prepare(`
      INSERT INTO transactions (id, amount, currency, description, status)
      VALUES (?, ?, ?, ?, ?)
    `).run(transactionId, 100, "INR", "Recovery test", "pending");

    axiosGet.mockRejectedValue({
      isAxiosError: true,
      response: { status: 404 }
    });

    const response = await request(app).post("/api/recovery/requeue");

    expect(response.status).toBe(200);
    expect(response.body.checked).toBe(1);
    expect(response.body.requeued).toBe(1);

    const job = await transactionQueue.getJob(transactionId);

    expect(job).toBeDefined();
    expect(job?.data.transactionId).toBe(transactionId);
  });

  it("marks a transaction completed when it already exists remotely", async () => {
    const transactionId = "recovery-test-002";

    db.prepare(`
      INSERT INTO transactions (id, amount, currency, description, status)
      VALUES (?, ?, ?, ?, ?)
    `).run(transactionId, 200, "INR", "Already posted", "pending");

    axiosGet.mockResolvedValue({
      status: 200,
      data: { id: transactionId }
    });

    const response = await request(app).post("/api/recovery/requeue");

    expect(response.status).toBe(200);
    expect(response.body.checked).toBe(1);
    expect(response.body.alreadyExists).toBe(1);
    expect(response.body.requeued).toBe(0);

    const transaction = db.prepare(
      "SELECT status FROM transactions WHERE id = ?"
    ).get(transactionId) as { status: string };

    expect(transaction.status).toBe("completed");
    expect(await transactionQueue.getJob(transactionId)).toBeUndefined();
  });

  it("does not requeue a transaction when the posting service is unavailable", async () => {
    const transactionId = "recovery-test-003";

    db.prepare(`
      INSERT INTO transactions (id, amount, currency, description, status)
      VALUES (?, ?, ?, ?, ?)
    `).run(transactionId, 300, "INR", "Uncertain recovery", "pending");

    const error = Object.assign(new Error("Service unavailable"), {
      isAxiosError: true,
      response: { status: 503 }
    });

    axiosGet.mockRejectedValue(error);

    const response = await request(app).post("/api/recovery/requeue");

    expect(response.status).toBe(200);
    expect(response.body.checked).toBe(1);
    expect(response.body.uncertain).toBe(1);
    expect(response.body.requeued).toBe(0);

    const transaction = db.prepare(
      "SELECT status FROM transactions WHERE id = ?"
    ).get(transactionId) as { status: string };

    expect(transaction.status).toBe("pending");
    expect(await transactionQueue.getJob(transactionId)).toBeUndefined();
  });
});

afterAll(async () => {
  await transactionQueue.obliterate({ force: true });
  await transactionQueue.close();
  await connection.quit();
  db.close();
});
