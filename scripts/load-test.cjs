
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
  console.log("Autocannon requests started:", result.totalRequests);
  console.log("Autocannon responses completed:", result.totalCompletedRequests);
  console.log("Autocannon result keys:", Object.keys(result));
  console.log("Autocannon requests sent:", result.requests.sent);
  console.log("Requests sent:", result.requests.sent);
console.log("Responses counted:", result.requests.total);
console.log("HTTP status counts:", {
  "1xx": result["1xx"],
  "2xx": result["2xx"],
  "3xx": result["3xx"],
  "4xx": result["4xx"],
  "5xx": result["5xx"],
  errors: result.errors,
  timeouts: result.timeouts,
  resets: result.resets
});
  console.log("\nLoad test completed");
  console.log("Test run ID:", runId);
  console.log("Requests per second (average):", result.requests.average);
  console.log("Total requests:", result.requests.total);
  console.log("Latency average (ms):", result.latency.average);
  console.log("Non-2xx responses:", result.non2xx);
});
