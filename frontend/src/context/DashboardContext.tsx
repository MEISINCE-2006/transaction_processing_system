import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { apiClient } from '../api/client';
import type { StatusCounts, SystemAlert, SystemHealth, Transaction } from '../types';

interface DashboardContextType {
  health: SystemHealth | null;
  statusCounts: StatusCounts | null;
  totalTransactions: number;
  recentTransactions: Transaction[];
  alerts: SystemAlert[];
  clientLatencyMs: number | null;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  lastUpdated: Date | null;
  isDemoMode: boolean;
  setIsDemoMode: (val: boolean) => void;
  refreshDashboard: () => Promise<void>;
  dismissAlert: (id: string) => void;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export const DashboardProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [statusCounts, setStatusCounts] = useState<StatusCounts | null>(null);
  const [totalTransactions, setTotalTransactions] = useState<number>(0);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [clientLatencyMs, setClientLatencyMs] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const [isDemoMode, setIsDemoModeState] = useState<boolean>(() => {
    return localStorage.getItem('tps_demo_mode') === 'true';
  });

  const setIsDemoMode = (val: boolean) => {
    setIsDemoModeState(val);
    localStorage.setItem('tps_demo_mode', val ? 'true' : 'false');
  };

  const isFetchingRef = useRef<boolean>(false);
  const isTabVisibleRef = useRef<boolean>(!document.hidden);

  const evaluateAlerts = useCallback((currHealth: SystemHealth): SystemAlert[] => {
    const generated: SystemAlert[] = [];
    const now = new Date().toISOString();

    if (currHealth.services.redis === 'disconnected') {
      generated.push({
        id: 'redis-down',
        severity: 'critical',
        title: 'Redis Service Disconnected',
        description: 'Unable to communicate with Redis at 127.0.0.1:6379. Queue processing is halted.',
        timestamp: now,
        status: 'active',
        source: 'redis'
      });
    }

    if (currHealth.services.database === 'disconnected') {
      generated.push({
        id: 'db-down',
        severity: 'critical',
        title: 'SQLite Database Disconnected',
        description: 'Failed to query local SQLite database. Transaction storage is unavailable.',
        timestamp: now,
        status: 'active',
        source: 'database'
      });
    }

    if (currHealth.status === 'degraded' || currHealth.status === 'unhealthy') {
      generated.push({
        id: 'health-degraded',
        severity: 'warning',
        title: 'API Health Status Degraded',
        description: `Overall system health returned status "${currHealth.status}". Review service dependencies.`,
        timestamp: now,
        status: 'active',
        source: 'api'
      });
    }

    if (currHealth.queue.failed > 0) {
      generated.push({
        id: 'jobs-failed',
        severity: 'warning',
        title: `${currHealth.queue.failed} Failed BullMQ Job(s) Detected`,
        description: 'Jobs failed during posting verification or processing. Requeue candidates via Queue Recovery.',
        timestamp: now,
        status: 'active',
        source: 'queue'
      });
    }

    if (currHealth.queue.waiting > 50) {
      generated.push({
        id: 'queue-backlog',
        severity: 'info',
        title: 'BullMQ Queue Backlog',
        description: `${currHealth.queue.waiting} jobs waiting in queue. Check worker throughput.`,
        timestamp: now,
        status: 'active',
        source: 'queue'
      });
    }

    return generated;
  }, []);

  const refreshDashboard = useCallback(async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    setIsRefreshing(true);

    try {
      const healthData = await apiClient.getHealth();
      setHealth(healthData);
      setClientLatencyMs(apiClient.lastMeasuredLatencyMs);

      const currentAlerts = evaluateAlerts(healthData);
      setAlerts(prev => {
        const activeIds = new Set(currentAlerts.map(a => a.id));
        const retained = prev.map(a => {
          if (!activeIds.has(a.id) && a.status === 'active') {
            return { ...a, status: 'resolved' as const };
          }
          return a;
        });
        const existingIds = new Set(retained.map(a => a.id));
        const newAlerts = currentAlerts.filter(a => !existingIds.has(a.id));
        return [...newAlerts, ...retained];
      });

      try {
        const txData = await apiClient.getTransactions({ limit: 5, page: 1 });
        setRecentTransactions(txData.transactions || []);
        if (txData.statusCounts) {
          setStatusCounts(txData.statusCounts);
        }
        if (txData.total !== undefined) {
          setTotalTransactions(txData.total);
        } else if (txData.count !== undefined) {
          setTotalTransactions(txData.count);
        }
      } catch (txErr: any) {
        console.warn('Failed to load transaction summary:', txErr.message);
      }

      setLastUpdated(new Date());
      setError(null);
    } catch (err: any) {
      console.error('Dashboard refresh failed:', err);
      setError(err.message || 'Failed to connect to backend server');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
      isFetchingRef.current = false;
    }
  }, [evaluateAlerts]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      const isVisible = document.visibilityState === 'visible';
      isTabVisibleRef.current = isVisible;
      if (isVisible) {
        refreshDashboard();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [refreshDashboard]);

  useEffect(() => {
    refreshDashboard();

    const interval = setInterval(() => {
      if (isTabVisibleRef.current) {
        refreshDashboard();
      }
    }, 7000);

    return () => clearInterval(interval);
  }, [refreshDashboard]);

  const dismissAlert = (id: string) => {
    setAlerts(prev =>
      prev.map(alert =>
        alert.id === id ? { ...alert, status: 'resolved' as const } : alert
      )
    );
  };

  return (
    <DashboardContext.Provider
      value={{
        health,
        statusCounts,
        totalTransactions,
        recentTransactions,
        alerts,
        clientLatencyMs,
        isLoading,
        isRefreshing,
        error,
        lastUpdated,
        isDemoMode,
        setIsDemoMode,
        refreshDashboard,
        dismissAlert
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
};

export const useDashboard = () => {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
};
