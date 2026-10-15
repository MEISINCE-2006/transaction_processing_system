const autocannon = require("autocannon");
const { randomUUID } = require("crypto");

const runId = `load-test-${Date.now()}`;

console.log("Test run ID:", runId);

const instance = autocannon({
  url: "http://localhost:3000",
  connections: 100,
  duration: 30,
  overallRate: 1000,
  requests: [
    {
      method: "POST",
      path: "/api/transactions",
      headers: {
        "content-type": "application/json",
        "x-load-test-run": runId
      },
      setupRequest: (request) => {
        request.headers["Idempotency-Key"] = randomUUID();
        request.body = JSON.stringify({
          amount: 100,
          currency: "INR",
          description: runId
        });
        return request;
      }
    }
  ]
});

autocannon.track(instance, { renderProgressBar: true });

instance.on("done", (result) => {
  console.log("\nLoad test completed");
  console.log("Test run ID:", runId);
  console.log("Requests sent:", result.requests.sent);
  console.log("Responses received:", result.requests.total);
  console.log("Average throughput (req/sec):", result.requests.average);
  console.log("Average latency (ms):", result.latency.average);
  console.log("P99 latency (ms):", result.latency.p99);
  console.log("Non-2xx responses:", result.non2xx);
  console.log("HTTP status counts:", {
    "2xx": result["2xx"],
    "4xx": result["4xx"],
    "5xx": result["5xx"],
    errors: result.errors,
    timeouts: result.timeouts,
    resets: result.resets
  });
});