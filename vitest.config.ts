import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
  environment: "node",
  setupFiles: ["./tests/setup.ts"],
  maxWorkers: 1,
  env: {
    DB_PATH: "test-transactions.db",
    QUEUE_NAME: "transaction-processing-test"
  }
}
});