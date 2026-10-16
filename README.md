High Performance Transaction Processing System

A reliable backend service built with Node.js and TypeScript that accepts transaction requests, stores transaction details, and processes them asynchronously using Redis and BullMQ. The system includes transaction status tracking, retry handling, remote status verification, and a monitoring dashboard.

Features

    REST API for submitting and retrieving transactions
    SQLite persistence for transaction records
    Redis and BullMQ for asynchronous processing
    Background worker for transaction processing
    Transaction status tracking: pending, processing, completed and failed
    Idempotency support to help prevent duplicate requests
    Retry handling with exponential backoff
    Remote transaction verification using the mock posting service
    Health endpoint with database, Redis and queue information
    React monitoring dashboard for transactions, queue status and alerts
    Automated tests and load-testing scripts

Technology Stack
    Node.js
    TypeScript
    Express.js
    SQLite and better-sqlite3
    Redis
    BullMQ
    React
    Vite
    Vitest
    Autocannon
    Docker for the mock posting service

Architecture
    The client submits a transaction to the REST API.
    The API validates the request and stores the transaction in SQLite.
    The transaction is added to the BullMQ queue.
    The API returns the transaction ID and initial status.
    The background worker processes queued transactions asynchronously.
    The worker checks the mock posting service before submitting a transaction.
    If posting fails, the worker verifies whether the transaction was saved remotely and retries when appropriate.
    The monitoring dashboard retrieves available transaction, health, and queue information from the backend.
    
Prerequisites

Install the following before running the project:
            
            Node.js and npm
            Redis
            git
            Docker for running the provided mock posting service

Setup Instructions

Clone the repository
    
            https://github.com/MEISINCE-2006/transaction_processing_system.git
cd transaction_processing_system

Install backend dependencies
    
    npm install 

Start Redis (i used the ubuntu)

    sudo service redis-server start
    redis-cli ping
    
Start the mock posting service

    docker run -d --name mock-posting-service \
  -p 8080:8080 \
  vinhopenfabric/mock-posting-service:latest
  
  If the container already exists
        
        docker start mock-posting-service
        
configure the posting service

    Configure the backend to use the mock service URL: POSTING_SERVICE_URL=http://localhost:8080

Steps to run the project
        
        in the first terminal start the API

            npm run dev

        in the second terminal start the background worker

            npx tsx  src/worker.ts
            
        move to the frontend folder
        
            npm install
            npm run dev
        
        open the url printed by Vite
            
            http://localhost:5173
            
            
        Configure the frontend API URL using VITE_API_BASE_URL : VITE_API_BASE_URL=http://localhost:3000
        
For API

Base URL : http://localhost:3000

    Health check : to check the Redis, database, API and queue health
        
        curl -i http://localhost:3000/api/health
         
    Submit a transaction
        
        curl -i -X POST http://localhost:3000/api/transactions \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 100.50,
    "currency": "USD",
    "description": "Test transaction"
  }'
  
  List the Transations : curl -i http://localhost:3000/api/transactions
  
  Retrive a transaction by id : curl -i http://localhost:3000/api/transactions/transactionid
  
  Test the Mock Posting Service : curl -i http://localhost:8080/transactions/TRANSACTION_ID
  
Testing

    Run Automated Tests : npm test
    
    Check TypeScript Compilation : npx tsc --noEmit
    
    Run Load Tests : node scripts/load-test.cjs
  
 curl -i http://localhost:8080/transactions/TRANSACTION_ID

This endpoint is provided by the mock posting service, not your local API.

Testing

Run Automated Tests

npm test

Check TypeScript Compilation

npx tsc --noEmit

Run Load Tests

The repository includes an Autocannon load-testing script.

node scripts/load-test.cjs

Run the script only after checking its target URL and configuration. Record the test duration, request rate, latency percentiles, HTTP errors, and number of transaction records created.

Note: A high HTTP response rate does not necessarily prove that the same number of transactions was processed successfully. Compare submitted requests, stored transaction records, completed transactions, and duplicates before reporting final results.

Design Decisions and Trade-offs

Asynchronous Processing

Transactions are queued for background processing instead of waiting for the external posting service. This helps keep API submission latency low even when the external service is slow.

Redis and BullMQ

Redis stores queue state, while BullMQ manages background jobs, retries, and job execution. This introduces an additional service dependency that must be monitored and recovered when unavailable.

SQLite Persistence

SQLite provides a lightweight persistent store suitable for local development and this coding exercise. Under high concurrent write loads or multi-instance deployment, a production database may be more suitable.

Retry and Remote Verification

The mock posting service may return an error even after saving a transaction. Checking the remote transaction by ID helps distinguish a post-write failure from a pre-write failure and reduces the risk of duplicate submissions.

Idempotency and Deduplication

Idempotency keys and transaction identifiers help recognize duplicate client requests. Remote verification and careful worker coordination are also important because the mock posting service does not provide native idempotent POST operations.
 
 Monitoring

The dashboard displays available backend health, transaction, and queue information. Performance metrics that are not collected by the backend must be identified as simulated or benchmark-derived rather than represented as live production telemetry.

Areas for Improvement
    
    Add comprehensive concurrency and race-condition tests for duplicate prevention.
    Verify zero transaction loss across worker crashes and Redis restarts.
    Add persistent recovery records and stronger reconciliation monitoring.
    Integrate Prometheus or OpenTelemetry for server-side throughput and latency metrics.
    Add persistent alert storage and configurable alert thresholds.
    Implement production-grade authentication and authorization.
    Add rate limiting and request-size limits.
    Evaluate a production database for higher write concurrency and horizontal scaling.
    Add automated integration tests covering pre-write and post-write failures.
    Document verified load-test results and investigate any difference between HTTP responses and persisted transaction counts.
    Add a short demonstration video showing submission, asynchronous processing, status tracking, retries, and monitoring.
    
Known Limitations

        The mock posting service is intentionally slow and unreliable.
        Local SQLite and Redis configuration is intended for development and testing.
        Dashboard metrics may include demo simulation when actual telemetry is unavailable.
        Production deployment requires appropriate persistent storage, Redis availability, secure configuration and a reliable worker runtime.
        
Github Repository : https://github.com/MEISINCE-2006/transaction_processing_system.git
    
