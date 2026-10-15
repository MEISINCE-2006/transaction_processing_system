export type TransactionStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'unknown';

export interface Transaction {
  id: string;
  amount: number;
  currency: string;
  description: string;
  status: TransactionStatus;
  created_at: string;
}

export interface StatusCounts {
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  unknown: number;
}

export interface TransactionsResponse {
  count: number;
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
  statusCounts?: StatusCounts;
  transactions: Transaction[];
}

export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  services: {
    database: 'connected' | 'disconnected';
    redis: 'connected' | 'disconnected';
  };
  queue: {
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
  };
  timestamp: string;
}

export interface ReconcileResponse {
  transactionId: string;
  status: TransactionStatus | 'not_found';
  reconciled?: boolean;
  message?: string;
}

export interface RecoveryResponse {
  checked: number;
  requeued: number;
  alreadyExists: number;
  uncertain: number;
  errors: number;
}

export interface CreateTransactionPayload {
  amount: number;
  currency: string;
  description: string;
  idempotencyKey?: string;
}

export interface CreateTransactionResponse {
  transactionId: string;
  status: TransactionStatus;
  createdAt: string;
  idempotentReplay: boolean;
}

export interface User {
  username: string;
  role: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export type AlertSeverity = 'critical' | 'warning' | 'info';

export interface SystemAlert {
  id: string;
  severity: AlertSeverity;
  title: string;
  description: string;
  timestamp: string;
  status: 'active' | 'resolved';
  source: 'database' | 'redis' | 'queue' | 'api' | 'worker';
}

export interface ApiPerformanceMetric {
  timestamp: string;
  rps: number;
  avgLatency: number;
  p99Latency: number;
  errorRate: number;
}
