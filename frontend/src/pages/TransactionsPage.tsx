import React, { useEffect, useState, useCallback } from 'react';
import {
  Search,
  Filter,
  RefreshCw,
  Plus,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Copy,
  Check,
  X,
  AlertCircle
} from 'lucide-react';
import { apiClient } from '../api/client';
import { useToast } from '../components/common/ToastProvider';
import type { Transaction, TransactionStatus } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';
import { ErrorAlert } from '../components/common/ErrorAlert';

export const TransactionsPage: React.FC = () => {
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(25);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchInput, setSearchInput] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [isReconciling, setIsReconciling] = useState<boolean>(false);
  const [reconcileResult, setReconcileResult] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<boolean>(false);
  const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);
  const [createAmount, setCreateAmount] = useState<string>('100');
  const [createCurrency, setCreateCurrency] = useState<string>('INR');
  const [createDescription, setCreateDescription] = useState<string>('Frontend dashboard payment');
  const [createIdempotencyKey, setCreateIdempotencyKey] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState<string | null>(null);

  const fetchTransactions = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiClient.getTransactions({
        page: currentPage,
        limit: pageSize,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        search: searchQuery.trim() || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined
      });

      setTransactions(data.transactions || []);
      setTotalCount(data.total !== undefined ? data.total : (data.count || 0));
    } catch (err: any) {
      setError(err.message || 'Failed to load transactions');
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, pageSize, statusFilter, searchQuery, startDate, endDate]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    setSearchQuery(searchInput);
  };

  const handleResetFilters = () => {
    setStatusFilter('all');
    setSearchInput('');
    setSearchQuery('');
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
  };

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleReconcile = async (id: string) => {
    setIsReconciling(true);
    setReconcileResult(null);
    try {
      const res = await apiClient.reconcileTransaction(id);
      setReconcileResult(`Reconciled: Status updated to "${res.status}".`);
      setSelectedTx(prev => prev ? { ...prev, status: res.status as TransactionStatus } : null);
      setTransactions(prev =>
        prev.map(t => (t.id === id ? { ...t, status: res.status as TransactionStatus } : t))
      );
    } catch (err: any) {
      setReconcileResult(`Reconciliation note: ${err.message}`);
      toast('error', `Reconcile failed: ${err.message}`);
    } finally {
      setIsReconciling(false);
    }
  };

  const handleCreateTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    setCreateSuccess(null);

    const amountNum = parseFloat(createAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setCreateError('Amount must be a positive number.');
      return;
    }

    if (!/^[A-Z]{3}$/.test(createCurrency)) {
      setCreateError('Currency must be a 3-letter uppercase code (e.g. INR, USD, EUR).');
      return;
    }

    if (!createDescription.trim()) {
      setCreateError('Description is required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await apiClient.createTransaction({
        amount: amountNum,
        currency: createCurrency,
        description: createDescription.trim(),
        idempotencyKey: createIdempotencyKey.trim() || undefined
      });

      setCreateSuccess(
        `Transaction created: ${res.transactionId} (Status: ${res.status}${res.idempotentReplay ? ', Idempotent Replay' : ''})`
      );
      toast('success', `Transaction ${res.transactionId} created successfully`);
      fetchTransactions();
      setTimeout(() => {
        setIsCreateOpen(false);
        setCreateSuccess(null);
      }, 1500);
    } catch (err: any) {
      setCreateError(err.message || 'Failed to submit transaction');
      toast('error', `Failed to create transaction: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2>Transaction Records</h2>
          <p className="subtitle">
            Showing {transactions.length} of {totalCount.toLocaleString()} transactions
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={() => {
              setCreateIdempotencyKey(`web-${Date.now()}`);
              setIsCreateOpen(true);
            }}
            className="btn btn-primary"
          >
            <Plus size={16} />
            <span>Submit Transaction</span>
          </button>
          <button
            onClick={fetchTransactions}
            disabled={isLoading}
            className="btn btn-secondary"
            title="Refresh list"
          >
            <RefreshCw size={14} className={isLoading ? 'spinner' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {error && <ErrorAlert message={error} onRetry={fetchTransactions} />}

      <div className="card" style={{ padding: '16px', marginBottom: '20px' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          {/* Search */}
          <div style={{ flex: '1 1 240px' }}>
            <label className="form-label">Search (ID / Description)</label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                className="form-input"
                placeholder="Search UUID or description..."
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                style={{ paddingLeft: '34px' }}
              />
              <Search
                size={15}
                style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }}
              />
            </div>
          </div>
          <div style={{ width: '160px' }}>
            <label className="form-label">Status</label>
            <select
              className="form-select"
              value={statusFilter}
              onChange={e => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="all">All Statuses</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="failed">Failed</option>
              <option value="unknown">Unknown</option>
            </select>
          </div>
          <div style={{ width: '160px' }}>
            <label className="form-label">Created From</label>
            <input
              type="date"
              className="form-input"
              value={startDate}
              onChange={e => {
                setStartDate(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>

          <div style={{ width: '160px' }}>
            <label className="form-label">Created To</label>
            <input
              type="date"
              className="form-input"
              value={endDate}
              onChange={e => {
                setEndDate(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button type="submit" className="btn btn-secondary">
              <Filter size={14} />
              Filter
            </button>
            <button
              type="button"
              onClick={handleResetFilters}
              className="btn btn-outline"
            >
              Reset
            </button>
          </div>
        </form>
      </div>
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {isLoading ? (
          <LoadingSpinner message="Loading transactions from SQLite database..." />
        ) : transactions.length === 0 ? (
          <EmptyState
            title="No transactions found"
            description="No matching transaction records found with the applied filters."
            action={
              <button onClick={handleResetFilters} className="btn btn-secondary btn-sm">
                Clear Filters
              </button>
            }
          />
        ) : (
          <div className="table-container" style={{ border: 'none' }}>
            <table>
              <thead>
                <tr>
                  <th>Transaction ID</th>
                  <th>Amount</th>
                  <th>Currency</th>
                  <th>Description</th>
                  <th>Status</th>
                  <th>Created At</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map(tx => (
                  <tr key={tx.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <code style={{ fontSize: '12px' }} title={tx.id}>
                          {tx.id.slice(0, 8)}...{tx.id.slice(-4)}
                        </code>
                        <button
                          onClick={() => handleCopyId(tx.id)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-light)', padding: '2px' }}
                          title="Copy full UUID"
                        >
                          <Copy size={12} />
                        </button>
                      </div>
                    </td>
                    <td style={{ fontWeight: 600 }}>
                      {tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td>
                      <span className="badge badge-neutral" style={{ fontSize: '11px' }}>
                        {tx.currency}
                      </span>
                    </td>
                    <td style={{ maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={tx.description}>
                      {tx.description}
                    </td>
                    <td>
                      <StatusBadge status={tx.status} />
                    </td>
                    <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {new Date(tx.created_at).toLocaleString()}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        onClick={() => {
                          setSelectedTx(tx);
                          setReconcileResult(null);
                        }}
                        className="btn btn-outline btn-sm"
                      >
                        <ExternalLink size={12} />
                        <span>Inspect</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 18px',
            borderTop: '1px solid var(--border-color)',
            backgroundColor: 'var(--bg-secondary)',
            fontSize: '13px',
            color: 'var(--text-secondary)',
            flexWrap: 'wrap',
            gap: '12px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>Page size:</span>
            <select
              className="form-select"
              style={{ width: '80px', padding: '4px 8px', fontSize: '12px' }}
              value={pageSize}
              onChange={e => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span>
              Showing {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, totalCount)} of {totalCount.toLocaleString()}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage <= 1 || isLoading}
              className="btn btn-outline btn-sm"
            >
              <ChevronLeft size={14} />
              <span>Previous</span>
            </button>
            <span style={{ fontWeight: 600 }}>
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages || isLoading}
              className="btn btn-outline btn-sm"
            >
              <span>Next</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
      {selectedTx && (
        <div className="modal-overlay" onClick={() => setSelectedTx(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontSize: '16px' }}>Transaction Details</h3>
              <button
                onClick={() => setSelectedTx(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={18} />
              </button>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <span className="form-label">Transaction ID</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                  <code style={{ fontSize: '13px', wordBreak: 'break-all', backgroundColor: 'var(--bg-secondary)', padding: '6px 10px', borderRadius: '4px', flex: 1 }}>
                    {selectedTx.id}
                  </code>
                  <button
                    onClick={() => handleCopyId(selectedTx.id)}
                    className="btn btn-secondary btn-sm"
                  >
                    {copiedId ? <Check size={14} color="var(--success)" /> : <Copy size={14} />}
                  </button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <span className="form-label">Amount & Currency</span>
                  <div style={{ fontSize: '16px', fontWeight: 700, marginTop: '2px' }}>
                    {selectedTx.amount.toLocaleString()} {selectedTx.currency}
                  </div>
                </div>

                <div>
                  <span className="form-label">Current Status</span>
                  <div style={{ marginTop: '4px' }}>
                    <StatusBadge status={selectedTx.status} />
                  </div>
                </div>
              </div>

              <div>
                <span className="form-label">Description</span>
                <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '8px 12px', borderRadius: '4px', fontSize: '13px', marginTop: '4px' }}>
                  {selectedTx.description}
                </div>
              </div>

              <div>
                <span className="form-label">Timestamp</span>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {new Date(selectedTx.created_at).toISOString()} ({new Date(selectedTx.created_at).toLocaleString()})
                </div>
              </div>

              {reconcileResult && (
                <div className="alert-banner alert-banner-info" style={{ margin: 0 }}>
                  <AlertCircle size={16} />
                  <div>{reconcileResult}</div>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button
                onClick={() => handleReconcile(selectedTx.id)}
                disabled={isReconciling}
                className="btn btn-secondary"
                title="Verify transaction status against external posting service"
              >
                {isReconciling ? <span className="spinner" /> : <RefreshCw size={14} />}
                <span>Reconcile External Status</span>
              </button>
              <button
                onClick={() => setSelectedTx(null)}
                className="btn btn-primary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {isCreateOpen && (
        <div className="modal-overlay" onClick={() => setIsCreateOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontSize: '16px' }}>Submit New Transaction</h3>
              <button
                onClick={() => setIsCreateOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateTransaction}>
              <div className="modal-body">
                {createError && (
                  <div className="alert-banner alert-banner-danger" style={{ marginBottom: '14px' }}>
                    <AlertCircle size={16} />
                    <div>{createError}</div>
                  </div>
                )}

                {createSuccess && (
                  <div className="alert-banner alert-banner-info" style={{ marginBottom: '14px' }}>
                    <Check size={16} />
                    <div>{createSuccess}</div>
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Amount</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-input"
                      value={createAmount}
                      onChange={e => setCreateAmount(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Currency (3-letter)</label>
                    <input
                      type="text"
                      maxLength={3}
                      className="form-input"
                      value={createCurrency}
                      onChange={e => setCreateCurrency(e.target.value.toUpperCase())}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Description</label>
                  <input
                    type="text"
                    className="form-input"
                    value={createDescription}
                    onChange={e => setCreateDescription(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Idempotency Key (Optional)</label>
                  <input
                    type="text"
                    className="form-input"
                    value={createIdempotencyKey}
                    onChange={e => setCreateIdempotencyKey(e.target.value)}
                    placeholder="e.g. unique-request-id"
                  />
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '3px' }}>
                    Used to guarantee exactly-once execution.
                  </span>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="btn btn-outline"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <span className="spinner" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    'Submit to Queue'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
