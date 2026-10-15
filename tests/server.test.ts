
import { afterAll, describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "../src/server";
import { connection, transactionQueue } from "../src/queue/transactionQueue";
import db from "../src/db/database";

describe("Transaction Processing API", () => {
  it("returns a healthy API response", async () => {
    const response = await request(app).get("/api/health");

    expect(response.status).toBe(200);
    expect(response.body.status).toBe("healthy");
    expect(response.body.services.database).toBe("connected");
    expect(response.body.services.redis).toBe("connected");
  });

  it("rejects an invalid transaction amount", async () => {
    const response = await request(app)
      .post("/api/transactions")
      .send({
        amount: -10,
        currency: "INR",
        description: "Invalid transaction"
      });

    expect(response.status).toBe(400);
  });
  it.each([
  {
    amount: 0,
    currency: "INR",
    description: "Zero amount"
  },
  {
    amount: 100,
    currency: "inr",
    description: "Invalid currency"
  },
  {
    amount: 100,
    currency: "INR",
    description: ""
  }
])("rejects invalid transaction data: $description", async (payload) => {
  const response = await request(app)
    .post("/api/transactions")
    .send(payload);

  expect(response.status).toBe(400);
});

  it("returns the same transaction for repeated idempotency keys", async () => {
    const payload = {
      amount: 125,
      currency: "INR",
      description: "Automated idempotency test"
    };

    const first = await request(app)
      .post("/api/transactions")
      .set("Idempotency-Key", "vitest-idempotency-001")
      .send(payload);

    const second = await request(app)
      .post("/api/transactions")
      .set("Idempotency-Key", "vitest-idempotency-001")
      .send(payload);

    expect([200, 202]).toContain(first.status);
    expect(second.status).toBe(200);
    expect(second.body.transactionId).toBe(first.body.transactionId);
    expect(second.body.idempotentReplay).toBe(true);
  });

  it("rejects the same idempotency key with a different payload", async () => {
    const first = await request(app)
      .post("/api/transactions")
      .set("Idempotency-Key", "vitest-idempotency-conflict-001")
      .send({
        amount: 100,
        currency: "INR",
        description: "First payment"
      });

    const second = await request(app)
      .post("/api/transactions")
      .set("Idempotency-Key", "vitest-idempotency-conflict-001")
      .send({
        amount: 999,
        currency: "INR",
        description: "Different payment"
      });

    expect([200, 202]).toContain(first.status);
    expect(second.status).toBe(409);
    expect(second.body.error).toContain("different request");
  });
});

afterAll(async () => {
  await transactionQueue.close();
  await connection.quit();
  db.close();
});
