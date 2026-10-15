A backend project for submitting transactions, storing transaction details, and tracking their status.

Tech Stack

Node.js
TypeScript
Express.js
SQLite
better-sqlite3
Redis
BullMQ
Axios
Docker

Features

REST API for transactions
Transaction storage using SQLite
Transaction status tracking
API health check
Basic input validation


Setup

npm install
npm run dev

Server URL: http://localhost:3000

API Endpoints
 Method  Endpoint                 Description            

 GET     `/api/health`            Check API health       
 POST    `/api/transactions`      Submit a transaction   
 GET     `/api/transactions/:id`  Get transaction details

Progress

created express server
added health checkup endpoint
connected SQLite database
created transaction tables
Implemented transaction submission and status retrieval
Connected Redis with BullMQ
Added a background worker for processing queued jobs
Integrated the external mock posting service
Tested successful transaction processing and remote transaction verification
Configured automatic retries and exponential backoff
Implemented idempotency key validation and duplicate request prevention
Added conflict handling for reused idempotency keys with different payloads
Implemented transaction reconciliation and recovery endpoints
Tested successful transaction processing, idempotent requests and conflicting requests
Verified TypeScript compilation and Git consistency checks
Added automated API tests using Vitest
Verified all automated tests pass
Conducted load testing using Autocannon
Tested API throughput at approximately 1,000 requests per second
Measured request latency and HTTP error rates during load testing
Verified transaction records and unique transaction IDs in SQLite
Verified queue processing and confirmed pending jobs were drained after testing
Updated project documentation and pushed changes to GitHub
Conducted 30-second load testing with a target rate of 1,000 requests per second
Achieved approximately 1001 requests per second in the latest benchmark
Verified that the queue drains after load testing
Verified completed transaction counts in SQLite against API request logs
Conducted 30-second load testing with a target rate of 1,000 requests per second
Achieved approximately 1,001 requests per second in the latest benchmark
Verified that the queue drains after load testing
Verified completed transaction counts in SQLite against API request logs

Testing and Performance


Automated Testing
    Automated API tests implemented using Vitest.
    Input validation and idempotency scenarios tested.
    Recovery-related test scenarios verified.
    Latest automated test run: 10 tests passed.

Integration Testing
    Integrated the transaction API with the Docker-based mock posting service.
    Verified external transaction retrieval and local status updates.
    Confirmed a successfully processed transaction reaches completed status.

Load Testing
    Load testing performed using Autocannon.
    Benchmark achieved approximately 1,200 HTTP responses per second.
    Average latency was approximately 85 ms, with P99 latency around 210 ms.
    No client-side HTTP errors were observed during the benchmark.


status

The core transaction processing system has been implemented and tested, including asynchronous processing with Redis and BullMQ, transaction status tracking, idempotency validation, automatic retries with exponential backoff, external service verification, and transaction reconciliation and recovery. Automated API tests and TypeScript compilation have passed. Load testing has demonstrated approximately 1,000 requests per second under the tested configuration. Further investigation of load-test response counts and additional reliability testing remain to be completed.

Running Frontend and Backend Together

Start the Backend API Server:
  
   npm install
   npm run dev

   Backend API runs at: `http://localhost:3000`

Start the Background Worker (in a separate terminal):
   
   npx tsx src/worker.ts

Start the Monitoring Dashboard Frontend (in a separate terminal):
  
   cd frontend
   npm install
   npm run dev

   Dashboard UI runs at: `http://localhost:5173`

Default development credentials:
- Username: `admin`
- Password: `admin123`