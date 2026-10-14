
const autocannon = require("autocannon");
const { randomUUID } = require("crypto");

const instance = autocannon({
  url: "http://localhost:3000",
  connections: 20,
  duration: 10,
  overallRate: 50,
  requests: [
    {
      method: "POST",
      path: "/api/transactions",
      headers: {
        "content-type": "application/json"
      },
      setupRequest: (request) => {
        request.headers["Idempotency-Key"] = randomUUID();
        request.body = JSON.stringify({
          amount: 100,
          currency: "INR",
          description: "Controlled load test"
        });
        return request;
      }
    }
  ]
});

autocannon.track(instance, { renderProgressBar: true });

instance.on("done", (result) => {
  console.log("\nLoad test completed");
  console.log("Requests per second (average):", result.requests.average);
  console.log("Total requests:", result.requests.total);
  console.log("Latency average (ms):", result.latency.average);
  console.log("Non-2xx responses:", result.non2xx);
});
