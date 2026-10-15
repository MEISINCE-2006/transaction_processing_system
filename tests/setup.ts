import { beforeAll } from "vitest";

beforeAll(() => {
  if (process.env.DB_PATH !== "test-transactions.db") {
    throw new Error("Tests must use the separate test database");
  }
});
