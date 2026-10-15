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


status

The core transaction processing system has been implemented and tested, including asynchronous processing with Redis and BullMQ, transaction status tracking, idempotency validation, automatic retries with exponential backoff, external service verification, and transaction reconciliation and recovery. Automated API tests and TypeScript compilation have passed. Load testing has demonstrated approximately 1,000 requests per second under the tested configuration. Further investigation of load-test response counts and additional reliability testing remain to be completed.