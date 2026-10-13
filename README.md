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

status

The transaction API is implemented with SQLite storage, input validation, transaction submission and status retrieval. Redis queue processing, retries, and duplicate prevention are the next steps.
