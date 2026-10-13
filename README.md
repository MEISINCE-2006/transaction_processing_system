A backend project for submitting transactions, storing transaction details, and tracking their status.



Tech Stack

Node.js
TypeScript
Express.js
SQLite

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



status

The transaction API, SQLite storage, Redis-backed queue, background worker, and external posting service integration have been implemented and tested with a successful transaction.