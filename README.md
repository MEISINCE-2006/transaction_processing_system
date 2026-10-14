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


status

The core transaction processing system has been implemented and tested, including asynchronous processing, transaction tracking, idempotency validation, retries and external service verification. Comprehensive load testing and further reliability testing remain to be completed.