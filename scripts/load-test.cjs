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
  console.log("Duration (seconds):", result.duration);
  console.log("Autocannon request counter (includes initial estimate):", result.requests.sent);
  console.log(
    "Completed HTTP responses (status codes):",
    result["1xx"] + result["2xx"] + result["3xx"] + result["4xx"] + result["5xx"]
  );
  console.log("Successful responses (2xx):", result["2xx"]);
  console.log("Client errors (4xx):", result["4xx"]);
  console.log("Server errors (5xx):", result["5xx"]);
  console.log("Average throughput (req/sec):", result.requests.average);
  console.log("Average latency (ms):", result.latency.average);
  console.log("P99 latency (ms):", result.latency.p99);
  console.log("Errors:", result.errors);
  console.log("Timeouts:", result.timeouts);
  console.log("Resets:", result.resets);
  console.log("Non-2xx responses:", result.non2xx);
});