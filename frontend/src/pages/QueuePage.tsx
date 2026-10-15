import React, { useState } from 'react';
import {
  Clock,
  Play,
  CheckCircle2,
  XCircle,
  PauseCircle,
  Radio,
  Cpu,
  RefreshCw,
  AlertTriangle,
  RotateCcw,
  Check
} from 'lucide-react';
import { useDashboard } from '../context/DashboardContext';
import { apiClient } from '../api/client';
import type { RecoveryResponse } from '../types';
import { MetricCard } from '../components/common/MetricCard';

export const QueuePage: React.FC = () => {
  const { health, refreshDashboard, isRefreshing } = useDashboard();
  const [isRecovering, setIsRecovering] = useState<boolean>(false);
  const [recoveryResult, setRecoveryResult] = useState<RecoveryResponse | null>(null);
  const [recoveryError, setRecoveryError] = useState<string | null>(null);

  const handleRunRecovery = async () => {
    setIsRecovering(true);
    setRecoveryError(null);
    setRecoveryResult(null);

    try {
      const res = await apiClient.runRecovery();
      setRecoveryResult(res);
      // Refresh dashboard to reflect any newly queued or updated counts
      await refreshDashboard();
    } catch (err: any) {
      setRecoveryError(err.message || 'Recovery execution failed');
    } finally {
      setIsRecovering(false);
    }
  };

  const queue = health?.queue || {
    waiting: 0,
    active: 0,
    completed: 0,
    failed: 0,
    delayed: 0
  };

  return (
    <div>
      {/* Top action header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2>BullMQ Job Queue & Worker Health</h2>
          <p className="subtitle">
            Live queue depth, Redis broker telemetry, and background worker state
          </p>
        </div>
        <button
          onClick={refreshDashboard}
          disabled={isRefreshing}
          className="btn btn-secondary btn-sm"
        >
          <RefreshCw size={14} className={isRefreshing ? 'spinner' : ''} />
          <span>Refresh Queue State</span>
        </button>
      </div>

      {/* BullMQ Job State Cards */}
      <div className="grid-cards">
        <MetricCard
          label="Waiting Jobs"
          value={queue.waiting.toLocaleString()}
          icon={<Clock size={18} />}
          subtext="Ready to be picked up by worker"
        />
        <MetricCard
          label="Active Jobs"
          value={queue.active.toLocaleString()}
          icon={<Play size={18} />}
          subtext="Currently processing in worker"
        />
        <MetricCard
          label="Completed Jobs"
          value={queue.completed.toLocaleString()}
          icon={<CheckCircle2 size={18} />}
          subtext="Successfully posted to mock service"
        />
        <MetricCard
          label="Failed Jobs"
          value={queue.failed.toLocaleString()}
          icon={<XCircle size={18} />}
          subtext="Failed after 3 retry attempts"
        />
        <MetricCard
          label="Delayed Jobs"
          value={queue.delayed.toLocaleString()}
          icon={<PauseCircle size={18} />}
          subtext="Waiting for retry backoff delay"
        />
      </div>

      {/* Infrastructure Details & Worker Architecture */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        {/* Redis Connection Card */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 style={{ fontSize: '15px' }}>Redis Message Broker</h3>
              <p className="subtitle">BullMQ communication layer</p>
            </div>
            <Radio size={18} style={{ color: 'var(--text-muted)' }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-muted)' }}>Connection Status:</span>
              {health?.services.redis === 'connected' ? (
                <span className="badge badge-success">
                  <CheckCircle2 size={12} /> Connected
                </span>
              ) : (
                <span className="badge badge-danger">
                  <XCircle size={12} /> Disconnected
                </span>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Host / Port:</span>
              <code>127.0.0.1:6379</code>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Client Driver:</span>
              <span>ioredis v6.0</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Target Queue:</span>
              <code>transaction-processing</code>
            </div>
          </div>
        </div>

        {/* Worker Engine Architecture */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 style={{ fontSize: '15px' }}>Background Worker Engine</h3>
              <p className="subtitle">BullMQ transaction processor</p>
            </div>
            <Cpu size={18} style={{ color: 'var(--text-muted)' }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-muted)' }}>Worker Process:</span>
              <span className="badge badge-info">
                <code>src/worker.ts</code>
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Concurrency:</span>
              <span style={{ fontWeight: 600 }}>100 simultaneous jobs</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Retry Strategy:</span>
              <span>3 attempts with exponential backoff (2,000ms base)</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Verification:</span>
              <span>Double-checks remote status before and after posting</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recovery and Requeue Panel */}
      <div className="card">
        <div className="card-header">
          <div>
            <h3 style={{ fontSize: '16px' }}>Transaction Recovery & Requeue Control</h3>
            <p className="subtitle">
              Inspects all local pending or unknown transactions against the remote posting service and requeues stalled jobs.
            </p>
          </div>
          <button
            onClick={handleRunRecovery}
            disabled={isRecovering}
            className="btn btn-primary"
          >
            {isRecovering ? (
              <>
                <span className="spinner" />
                <span>Running Recovery...</span>
              </>
            ) : (
              <>
                <RotateCcw size={16} />
                <span>Run Recovery Requeue</span>
              </>
            )}
          </button>
        </div>

        {recoveryError && (
          <div className="alert-banner alert-banner-danger" style={{ marginBottom: '16px' }}>
            <AlertTriangle size={16} />
            <div>{recoveryError}</div>
          </div>
        )}

        {recoveryResult && (
          <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', marginBottom: '16px' }}>
            <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--success)' }}>
              <Check size={16} />
              Recovery Run Completed Successfully
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px' }}>
              <div style={{ backgroundColor: 'var(--bg-primary)', padding: '10px', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Candidates Checked</div>
                <div style={{ fontSize: '18px', fontWeight: 700 }}>{recoveryResult.checked}</div>
              </div>
              <div style={{ backgroundColor: 'var(--bg-primary)', padding: '10px', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Jobs Requeued</div>
                <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--primary)' }}>{recoveryResult.requeued}</div>
              </div>
              <div style={{ backgroundColor: 'var(--bg-primary)', padding: '10px', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Already Completed</div>
                <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--success)' }}>{recoveryResult.alreadyExists}</div>
              </div>
              <div style={{ backgroundColor: 'var(--bg-primary)', padding: '10px', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Uncertain Remote</div>
                <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--warning)' }}>{recoveryResult.uncertain}</div>
              </div>
              <div style={{ backgroundColor: 'var(--bg-primary)', padding: '10px', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Errors</div>
                <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--danger)' }}>{recoveryResult.errors}</div>
              </div>
            </div>
          </div>
        )}

        <div style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.5' }}>
          <strong>How Recovery Works:</strong> The backend queries SQLite for records where status is <code>pending</code> or <code>unknown</code>. For each candidate, it checks if a BullMQ job is already waiting or active. If missing, it queries the external posting service. If the transaction was already posted, it updates the local status to <code>completed</code>. Otherwise, it safely requeues the transaction for processing.
        </div>
      </div>
    </div>
  );
};
