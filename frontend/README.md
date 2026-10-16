# OpenFabric TPS - Advanced Monitoring Dashboard

Clean, professional light-themed frontend dashboard for monitoring the OpenFabric Transaction Processing System (TPS). Built with React 19, TypeScript, Vite, Recharts, and Lucide React.

## Features

- **System Overview**: Live transaction counts (Total, Pending, Processing, Completed, Failed, Unknown) queried directly from SQLite, BullMQ queue depth, Redis health, and recent transactions.
- **Transaction Explorer**: Search, pagination, status filtering, date-range filtering, inspect detail modal, manual reconciliation against external services, and test transaction submission with optional idempotency keys.
- **API Performance**: Real-time client-to-backend ping latency monitoring, transparent status indicators for metrics not supported by the Express backend, and a toggleable Demo Simulation Mode for previewing Autocannon benchmark throughput and latency histograms.
- **Queue & Worker Monitoring**: BullMQ job state breakdown (Waiting, Active, Completed, Failed, Delayed), Redis connection details, worker concurrency metrics, and Dead Letter Queue (DLQ) Recovery & Requeue trigger.
- **System Alerts**: Live evaluation of system health (Redis disconnection, Database degradation, BullMQ job failures) with severity filters and acknowledgement tracking.
- **Authentication**: Session-based login with show/hide password, input validation, and protected routes.

## Prerequisites

- Node.js (v18+)
- Running TPS Backend on `http://localhost:3000`
- Redis server on `127.0.0.1:6379`

## Installation

```bash
cd frontend
npm install
```

## Configuration

Create or update `.env` in the `frontend` directory:

```env
VITE_API_BASE_URL=http://localhost:3000
```

## Running Development Server

```bash
npm run dev
```

The frontend will be available at: `http://localhost:5173`

## Building for Production

```bash
npm run build
```

To preview the production build locally:

```bash
npm run preview
```

## Default Local Development Credentials

Configure these environment variables in your backend environment:

- **Username**: `admin`
- **Password**: `admin123`
