import type {
  AuthResponse,
  CreateTransactionPayload,
  CreateTransactionResponse,
  ReconcileResponse,
  RecoveryResponse,
  SystemHealth,
  Transaction,
  TransactionsResponse,
  User
} from '../types';

const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') ||
  'http://localhost:3000';

class ApiClient {
  private token: string | null = null;
  public lastMeasuredLatencyMs: number | null = null;

  constructor() {
    this.token = localStorage.getItem('tps_auth_token');
  }

  public setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('tps_auth_token', token);
    } else {
      localStorage.removeItem('tps_auth_token');
    }
  }

  public getToken(): string | null {
    return this.token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>)
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const startTime = performance.now();
    try {
      const response = await fetch(url, {
        ...options,
        headers
      });

      const duration = Math.round(performance.now() - startTime);
      if (endpoint.startsWith('/api/health')) {
        this.lastMeasuredLatencyMs = duration;
      }

      if (response.status === 401) {
        if (!endpoint.includes('/api/auth/login')) {
          this.setToken(null);
        }
      }

      const contentType = response.headers.get('content-type') || '';
      let data: any = null;
      if (contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        data = { message: text };
      }

      if (!response.ok) {
        const errorMessage =
          data?.error ||
          data?.message ||
          `Request failed with status ${response.status} (${response.statusText})`;
        throw new Error(errorMessage);
      }

      return data as T;
    } catch (err: any) {
      if (err instanceof TypeError && err.message.includes('fetch')) {
        throw new Error(
          `Unable to connect to backend at ${API_BASE_URL}. Ensure the backend server is running and CORS is configured.`
        );
      }
      throw err;
    }
  }

  public async login(username: string, password: string): Promise<AuthResponse> {
    const res = await this.request<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
    this.setToken(res.token);
    return res;
  }

  public async getMe(): Promise<{ user: User }> {
    return this.request<{ user: User }>('/api/auth/me', {
      method: 'GET'
    });
  }

  public async logout(): Promise<{ message: string }> {
    try {
      const res = await this.request<{ message: string }>('/api/auth/logout', {
        method: 'POST'
      });
      return res;
    } finally {
      this.setToken(null);
    }
  }

  public async getHealth(): Promise<SystemHealth> {
    return this.request<SystemHealth>('/api/health', {
      method: 'GET'
    });
  }

  public async getTransactions(params?: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<TransactionsResponse> {
    const searchParams = new URLSearchParams();
    if (params) {
      if (params.page !== undefined) searchParams.append('page', String(params.page));
      if (params.limit !== undefined) searchParams.append('limit', String(params.limit));
      if (params.status && params.status !== 'all') searchParams.append('status', params.status);
      if (params.search && params.search.trim()) searchParams.append('search', params.search.trim());
      if (params.startDate) searchParams.append('startDate', params.startDate);
      if (params.endDate) searchParams.append('endDate', params.endDate);
    }

    const query = searchParams.toString();
    const endpoint = `/api/transactions${query ? `?${query}` : ''}`;
    return this.request<TransactionsResponse>(endpoint, {
      method: 'GET'
    });
  }

  public async getTransaction(id: string): Promise<Transaction> {
    return this.request<Transaction>(`/api/transactions/${encodeURIComponent(id)}`, {
      method: 'GET'
    });
  }

  public async createTransaction(
    payload: CreateTransactionPayload
  ): Promise<CreateTransactionResponse> {
    const headers: Record<string, string> = {};
    if (payload.idempotencyKey) {
      headers['Idempotency-Key'] = payload.idempotencyKey;
    }

    return this.request<CreateTransactionResponse>('/api/transactions', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        amount: payload.amount,
        currency: payload.currency,
        description: payload.description
      })
    });
  }

  public async reconcileTransaction(id: string): Promise<ReconcileResponse> {
    return this.request<ReconcileResponse>(
      `/api/transactions/${encodeURIComponent(id)}/reconcile`,
      {
        method: 'POST'
      }
    );
  }

  public async runRecovery(): Promise<RecoveryResponse> {
    return this.request<RecoveryResponse>('/api/recovery/requeue', {
      method: 'POST'
    });
  }
}

export const apiClient = new ApiClient();
