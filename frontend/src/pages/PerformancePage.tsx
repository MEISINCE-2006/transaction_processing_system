import React, { useState } from 'react';
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import {
  Activity,
  Clock,
  AlertTriangle,
  Info,
  Calendar,
  Eye,
  CheckCircle2
} from 'lucide-react';
import { useDashboard } from '../context/DashboardContext';

type TimeRange = '1h' | '6h' | '24h' | '7d';

export const PerformancePage: React.FC = () => {
  const { clientLatencyMs, isDemoMode, setIsDemoMode } = useDashboard();
  const [timeRange, setTimeRange] = useState<TimeRange>('24h');

  const generateDemoThroughput = () => {
    const points = [];
    const base = 980;
    for (let i = 0; i <= 24; i++) {
      const noise = Math.sin(i / 3) * 60 + Math.random() * 40;
      points.push({
        time: `${i.toString().padStart(2, '0')}:00`,
        rps: Math.round(base + noise),
        p99: Math.round(190 + (noise > 40 ? 30 : 10)),
        avgLatency: Math.round(80 + noise / 4),
        errors: i === 14 ? 0.02 : 0.0
      });
    }
    return points;
  };

  const demoData = generateDemoThroughput();

  return (
    <div>
      <div className="alert-banner alert-banner-info" style={{ marginBottom: '20px' }}>
        <Info size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: '14px' }}>
            Telemetry & Metrics Collector Architecture
          </div>
          <p style={{ fontSize: '13px', marginTop: '4px', lineHeight: '1.5' }}>
            The current Express backend runs locally on port 3000 without an integrated time-series metrics collector (e.g. Prometheus or OpenTelemetry).
            Runtime throughput (RPS), server-side latency histograms, and HTTP error counters are not exposed by the current backend APIs.
          </p>
          <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={() => setIsDemoMode(!isDemoMode)}
              className={`btn btn-sm ${isDemoMode ? 'btn-secondary' : 'btn-primary'}`}
            >
              <Eye size={14} />
              {isDemoMode ? 'Disable Demo Simulation' : 'Enable Demo Simulation Mode'}
            </button>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              {isDemoMode ? 'Currently previewing benchmark model graphs.' : 'Currently viewing strictly live telemetry status.'}
            </span>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '24px', backgroundColor: 'var(--bg-primary)' }}>
        <div className="card-header" style={{ marginBottom: '12px' }}>
          <div>
            <h3 style={{ fontSize: '15px' }}>Live Client-to-Backend Round-Trip Time</h3>
            <p className="subtitle">Real-time HTTP measurement from browser to <code>/api/health</code></p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span className="badge badge-success">
              <CheckCircle2 size={12} />
              Active Connection
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
          <div style={{ fontSize: '32px', fontWeight: 700, color: 'var(--primary)' }}>
            {clientLatencyMs !== null ? `${clientLatencyMs} ms` : 'Measuring...'}
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Actual ping latency to port 3000
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <h2>Performance Metrics & Trends</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Calendar size={14} style={{ color: 'var(--text-muted)' }} />
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)', marginRight: '4px' }}>Range:</span>
          {(['1h', '6h', '24h', '7d'] as TimeRange[]).map(r => (
            <button
              key={r}
              onClick={() => setTimeRange(r)}
              className={`btn btn-sm ${timeRange === r ? 'btn-primary' : 'btn-outline'}`}
              style={{ padding: '4px 10px' }}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))', gap: '20px' }}>
        <div className="card">
          <div className="card-header">
            <div>
              <h3 style={{ fontSize: '15px' }}>Request Throughput (RPS)</h3>
              <p className="subtitle">HTTP requests processed per second</p>
            </div>
            {isDemoMode ? (
              <span className="badge badge-info" style={{ fontSize: '11px' }}>Demo Simulation</span>
            ) : (
              <span className="badge badge-neutral" style={{ fontSize: '11px' }}>Unsupported in API</span>
            )}
          </div>

          {isDemoMode ? (
            <div style={{ width: '100%', height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={demoData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="time" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} domain={[800, 1200]} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '6px', fontSize: '12px' }}
                  />
                  <Area type="monotone" dataKey="rps" stroke="#2563eb" fill="#eff6ff" strokeWidth={2} name="Req / sec" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div style={{ height: 260, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '20px' }}>
              <Activity size={36} style={{ color: 'var(--text-light)', marginBottom: '10px' }} />
              <div style={{ fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                Throughput Telemetry Unavailable
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', maxWidth: '320px', marginBottom: '14px' }}>
                Express backend does not expose runtime request counter metrics. Past Autocannon load testing achieved 1,001 req/s.
              </p>
              <button onClick={() => setIsDemoMode(true)} className="btn btn-outline btn-sm">
                Preview with Demo Simulation
              </button>
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-header">
            <div>
              <h3 style={{ fontSize: '15px' }}>Response Latency (Avg & P99)</h3>
              <p className="subtitle">Average latency and P99 percentiles (ms)</p>
            </div>
            {isDemoMode ? (
              <span className="badge badge-info" style={{ fontSize: '11px' }}>Demo Simulation</span>
            ) : (
              <span className="badge badge-neutral" style={{ fontSize: '11px' }}>Unsupported in API</span>
            )}
          </div>

          {isDemoMode ? (
            <div style={{ width: '100%', height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={demoData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="time" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} domain={[0, 260]} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '6px', fontSize: '12px' }}
                  />
                  <Line type="monotone" dataKey="p99" stroke="#d97706" strokeWidth={2} dot={false} name="P99 (ms)" />
                  <Line type="monotone" dataKey="avgLatency" stroke="#2563eb" strokeWidth={2} dot={false} name="Avg Latency (ms)" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div style={{ height: 260, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '20px' }}>
              <Clock size={36} style={{ color: 'var(--text-light)', marginBottom: '10px' }} />
              <div style={{ fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                Latency Histogram Unavailable
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', maxWidth: '320px', marginBottom: '14px' }}>
                Server-side response time distributions are not collected. Autocannon benchmarks recorded 85 ms average and 210 ms P99.
              </p>
              <button onClick={() => setIsDemoMode(true)} className="btn btn-outline btn-sm">
                Preview with Demo Simulation
              </button>
            </div>
          )}
        </div>

        <div className="card" style={{ gridColumn: '1 / -1' }}>
          <div className="card-header">
            <div>
              <h3 style={{ fontSize: '15px' }}>HTTP Error Rate (%)</h3>
              <p className="subtitle">Client 4xx and server 5xx error ratios</p>
            </div>
            {isDemoMode ? (
              <span className="badge badge-info" style={{ fontSize: '11px' }}>Demo Simulation</span>
            ) : (
              <span className="badge badge-neutral" style={{ fontSize: '11px' }}>Unsupported in API</span>
            )}
          </div>

          {isDemoMode ? (
            <div style={{ width: '100%', height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={demoData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="time" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} domain={[0, 0.1]} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '6px', fontSize: '12px' }}
                  />
                  <Area type="monotone" dataKey="errors" stroke="#dc2626" fill="#fef2f2" strokeWidth={2} name="Error Rate %" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div style={{ height: 200, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '20px' }}>
              <AlertTriangle size={36} style={{ color: 'var(--text-light)', marginBottom: '10px' }} />
              <div style={{ fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                Error Rate Time-Series Unavailable
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', maxWidth: '380px' }}>
                No HTTP error time-series exporter exists on the current backend. Benchmark runs demonstrated zero non-2xx errors.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
