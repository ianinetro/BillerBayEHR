import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Badge from '../components/Badge';
import { listWorkQueue, resolveWorkQueueItem } from '../api/billing';
import { submitClaim, batchSubmitClaims } from '../api/claims';
import { useToast } from '../components/Toast';

const fmt = n => '$' + Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const QUEUE_TYPES = [
  { label: 'Visits ready for billing', type: 'Missing billing data', badgeType: 'success' },
  { label: 'Claims validation failed', type: 'Validation failed', badgeType: 'danger' },
  { label: 'Claims ready to submit', type: 'Ready to submit', badgeType: 'success' },
  { label: 'Claims awaiting batch', type: 'Awaiting batch', badgeType: 'warn' },
  { label: 'Rejected claims', type: 'Rejected claim', badgeType: 'danger' },
  { label: 'Denied claims', type: 'Denied', badgeType: 'danger' },
  { label: 'Secondary claims pending', type: 'Secondary pending', badgeType: 'warn' },
  { label: 'A/R follow-up', type: 'A/R follow-up', badgeType: 'danger' },
  { label: 'Patient balances', type: 'Patient balance', badgeType: 'warn' },
  { label: 'ERA unmatched', type: 'ERA unmatched', badgeType: 'danger' },
  { label: 'Stale claims', type: 'Stale claim', badgeType: 'warn' },
];

export default function Billing() {
  const navigate = useNavigate();
  const toast = useToast();
  const qc = useQueryClient();
  const [activeType, setActiveType] = useState(null);
  const [selected, setSelected] = useState(new Set());

  const { data, isLoading } = useQuery({
    queryKey: ['work-queue', activeType],
    queryFn: () => listWorkQueue({ resolved: false, item_type: activeType || undefined, page_size: 200 }),
  });
  const items = data?.results || [];

  const countsByType = {};
  for (const item of items) {
    countsByType[item.item_type] = (countsByType[item.item_type] || 0) + 1;
  }

  const resolveMut = useMutation({
    mutationFn: resolveWorkQueueItem,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['work-queue'] }); toast.success('Item resolved.'); },
    onError: () => toast.error('Could not resolve item.'),
  });

  const batchMut = useMutation({
    mutationFn: batchSubmitClaims,
    onSuccess: (d) => {
      qc.invalidateQueries({ queryKey: ['work-queue'] });
      setSelected(new Set());
      toast.success(`Batch submitted: ${d.queued} claims queued.`);
    },
    onError: () => toast.error('Batch submission failed.'),
  });

  function toggleSelect(id) {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function handleBatchSubmit() {
    const readyItems = items.filter(i => i.item_type === 'Ready to submit' && i.claim_id);
    if (readyItems.length === 0) { toast.warn('No ready-to-submit claims in current view.'); return; }
    batchMut.mutate(readyItems.map(i => i.claim_id));
  }

  return (
    <div>
      <div className="header">
        <div>
          <div className="eyebrow">Billing workbench</div>
          <div className="title">Billing work queues</div>
          <div className="desc">Every queue shows reason, priority, owner, age, next action, and bulk actions.</div>
        </div>
        <div className="actions">
          <button className="btn" onClick={() => { setActiveType(null); setSelected(new Set()); }}>All queues</button>
          <button className="btn primary" disabled={batchMut.isPending} onClick={handleBatchSubmit}>
            {batchMut.isPending ? 'Submitting…' : 'Submit ready claims'}
          </button>
        </div>
      </div>

      <div className="grid queuecards">
        {QUEUE_TYPES.map(q => {
          const count = countsByType[q.type] || 0;
          const active = activeType === q.type;
          return (
            <div
              key={q.label}
              className={`card queuecard${active ? ' active' : ''}`}
              onClick={() => setActiveType(active ? null : q.type)}
              style={{ cursor: 'pointer', outline: active ? '2px solid var(--blue)' : 'none' }}
            >
              <div className="sub">{q.label}</div>
              <div className="num">{isLoading ? '…' : count}</div>
              <div>
                <Badge status={q.badgeType === 'danger' ? 'Overdue' : q.badgeType === 'warn' ? 'Warning' : 'Active'} />
              </div>
            </div>
          );
        })}
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <div className="toolbar">
          <div>
            <strong>{activeType || 'Unified work queue'}</strong>
            <div className="sub">
              {activeType ? `Filtered to: ${activeType}` : 'All open items — sort by priority, payer, owner, age, amount.'}
            </div>
          </div>
          <div className="actions">
            {selected.size > 0 && (
              <button className="btn primary" onClick={() => {
                const claimIds = [...selected].filter(Boolean);
                batchMut.mutate(claimIds);
              }}>
                Submit {selected.size} selected
              </button>
            )}
          </div>
        </div>
        <div className="tablewrap">
          <table className="table">
            <thead>
              <tr>
                <th></th>
                <th>Type</th><th>Priority</th><th>Patient</th><th>Visit</th>
                <th>Claim</th><th>Payer</th><th className="right">Amount</th>
                <th>Reason</th><th>Owner</th><th>Age</th><th>Next action</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && <tr><td colSpan={12} className="muted" style={{ padding: '24px 20px', textAlign: 'center' }}>Loading…</td></tr>}
              {!isLoading && items.length === 0 && (
                <tr><td colSpan={12} className="muted" style={{ padding: '24px 20px', textAlign: 'center' }}>No open work items.</td></tr>
              )}
              {items.map(r => (
                <tr key={r.id} className="clickable"
                  onClick={() => r.claim_id && navigate(`/claims/${r.claim_id}`)}>
                  <td onClick={e => e.stopPropagation()}>
                    {r.claim_id && (
                      <input type="checkbox" checked={selected.has(r.claim_id)} onChange={() => toggleSelect(r.claim_id)} />
                    )}
                  </td>
                  <td>{r.item_type}</td>
                  <td><Badge status={r.priority === 'High' ? 'Overdue' : r.priority === 'Med' ? 'Warning' : r.priority} /></td>
                  <td>{r.patient_name}</td>
                  <td className="mono">{r.visit_id || '—'}</td>
                  <td className="mono">{r.claim_id || '—'}</td>
                  <td>{r.payer}</td>
                  <td className="right">{fmt(r.amount)}</td>
                  <td>{r.reason}</td>
                  <td>{r.assigned_to || '—'}</td>
                  <td>{r.age_days}d</td>
                  <td onClick={e => e.stopPropagation()}>
                    <button className="btn sm" onClick={() => resolveMut.mutate(r.id)}>Resolve</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
