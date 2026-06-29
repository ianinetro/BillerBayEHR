import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Badge from '../components/Badge';
import Modal from '../components/Modal';
import {
  listPayments,
  createPayment,
  importERA,
  autoPostERA,
  matchException,
  getERADashboard,
  listERAExceptions,
} from '../api/payments';
import { useToast } from '../components/Toast';

const fmt = n =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(n || 0));
const fmtN = n => new Intl.NumberFormat('en-US').format(Number(n || 0));

const TABS = ['era-dashboard', 'payments', 'era-autopost', 'unmatched', 'applied', 'reconciliation'];
const TAB_LABELS = {
  'era-dashboard': 'ERA Dashboard',
  payments: 'All Payments',
  'era-autopost': 'ERA Auto-post',
  unmatched: 'Unmatched',
  applied: 'Applied',
  reconciliation: 'Reconciliation',
};

const today = () => new Date().toISOString().slice(0, 10);
const BLANK = { payer_type: 'Insurance', payer: '', method: 'EFT', check_number: '', amount: '', payment_date: today(), note: '' };

// ── ERA Dashboard ────────────────────────────────────────────────────────────

function KpiCard({ label, value, sub, accent }) {
  return (
    <div className="card pad kpi" style={accent ? { borderTop: '3px solid var(--primary)' } : {}}>
      <div className="label">{label}</div>
      <div className="value" style={{ fontSize: 28, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{value}</div>
      {sub && <div className="hint">{sub}</div>}
    </div>
  );
}

function BarRow({ label, count, total, amount }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 3 }}>
        <span>{label || '—'}</span>
        <span style={{ fontVariantNumeric: 'tabular-nums', color: 'var(--slate)' }}>
          {fmtN(count)} · {fmt(amount)}
        </span>
      </div>
      <div style={{ height: 6, background: 'var(--border)', position: 'relative' }}>
        <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${pct}%`, background: 'var(--primary)' }} />
      </div>
    </div>
  );
}

function ERADashboardTab() {
  const { data, isLoading } = useQuery({
    queryKey: ['era-dashboard'],
    queryFn: getERADashboard,
    refetchInterval: 30000,
  });

  if (isLoading) return <div className="muted" style={{ padding: 32, textAlign: 'center' }}>Loading ERA dashboard…</div>;
  if (!data) return null;

  const { kpis, by_payer, top_denial_reasons, top_denial_groups, recent_payments, status_breakdown } = data;
  const totalDenialCount = top_denial_reasons.reduce((s, r) => s + r.count, 0);
  const totalPayerCount = by_payer.reduce((s, r) => s + r.count, 0);

  return (
    <div style={{ padding: '20px 0', display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* KPI row */}
      <div className="grid kpis" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <KpiCard label="ERA Payments" value={fmtN(kpis.total_era_payments)} sub="total imports" accent />
        <KpiCard label="Total ERA Amount" value={fmt(kpis.total_amount)} sub={`${fmt(kpis.total_applied)} applied`} />
        <KpiCard label="Unapplied" value={fmt(kpis.total_unapplied)} sub="pending posting" />
        <KpiCard label="Unresolved Exceptions" value={fmtN(kpis.unresolved_exceptions)} sub={fmt(kpis.unresolved_exception_amount) + ' at risk'} accent />
        <KpiCard label="Auto-match Rate" value={
          kpis.total_era_payments > 0
            ? Math.round(((kpis.total_era_payments - kpis.unresolved_exceptions) / Math.max(kpis.total_era_payments, 1)) * 100) + '%'
            : '—'
        } sub="of ERA lines matched" />
        <KpiCard label="Status Breakdown" value={
          status_breakdown.find(s => s.status === 'Posted')?.count
            ? fmtN(status_breakdown.find(s => s.status === 'Posted').count) + ' posted'
            : status_breakdown[0]?.status || '—'
        } sub={status_breakdown.map(s => `${s.status}: ${s.count}`).join(' · ')} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* By payer */}
        <div className="card pad">
          <div className="sectionTitle" style={{ marginBottom: 12 }}>ERA payments by payer</div>
          {by_payer.length === 0
            ? <div className="muted" style={{ fontSize: 13 }}>No ERA payments yet.</div>
            : by_payer.map(r => (
              <BarRow
                key={r.payer_name}
                label={r.payer_name}
                count={r.count}
                total={totalPayerCount}
                amount={r.total}
              />
            ))}
        </div>

        {/* Top denial reasons */}
        <div className="card pad">
          <div className="sectionTitle" style={{ marginBottom: 12 }}>Top denial reasons (unresolved)</div>
          {top_denial_reasons.length === 0
            ? <div className="muted" style={{ fontSize: 13 }}>No unresolved exceptions.</div>
            : top_denial_reasons.map(r => (
              <BarRow
                key={r.adjustment_reason || 'none'}
                label={r.adjustment_reason ? `CARC ${r.adjustment_reason}` : 'No reason code'}
                count={r.count}
                total={totalDenialCount}
                amount={r.amount}
              />
            ))}
          {top_denial_groups.length > 0 && (
            <>
              <div className="divider" />
              <div className="sectionTitle" style={{ marginBottom: 8, fontSize: 12 }}>By adjustment group</div>
              {top_denial_groups.map(r => (
                <BarRow
                  key={r.adjustment_group}
                  label={r.adjustment_group}
                  count={r.count}
                  total={totalDenialCount}
                  amount={r.amount}
                />
              ))}
            </>
          )}
        </div>
      </div>

      {/* Recent ERA payments */}
      <div className="card">
        <div className="toolbar">
          <div>
            <strong>Recent ERA payments</strong>
            <div className="sub">Latest 10 ERA imports</div>
          </div>
        </div>
        <div className="tablewrap">
          <table className="table">
            <thead>
              <tr>
                <th>Payment ID</th><th>Date</th><th>Payer</th>
                <th className="right">Amount</th><th className="right">Applied</th>
                <th className="right">Unapplied</th><th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recent_payments.length === 0 && (
                <tr><td colSpan={7} className="muted" style={{ textAlign: 'center', padding: 24 }}>No ERA payments imported yet.</td></tr>
              )}
              {recent_payments.map(p => (
                <tr key={p.payment_id}>
                  <td className="mono">{p.payment_id}</td>
                  <td>{p.payment_date}</td>
                  <td>{p.payer_name}</td>
                  <td className="right">{fmt(p.amount)}</td>
                  <td className="right">{fmt(p.applied || 0)}</td>
                  <td className="right">{fmt(p.unapplied != null ? p.unapplied : p.amount)}</td>
                  <td><Badge status={p.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── Unmatched Exceptions Tab ─────────────────────────────────────────────────

function UnmatchedTab() {
  const qc = useQueryClient();
  const toast = useToast();
  const [matchModal, setMatchModal] = useState(null); // { exc }
  const [claimIdInput, setClaimIdInput] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['era-exceptions', { resolved: false }],
    queryFn: () => listERAExceptions({ resolved: false, page_size: 100 }),
  });
  const exceptions = data?.results || [];

  const matchMut = useMutation({
    mutationFn: ({ exc, claimId }) => matchException(exc.payment, exc.id, claimId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['era-exceptions'] });
      qc.invalidateQueries({ queryKey: ['era-dashboard'] });
      qc.invalidateQueries({ queryKey: ['payments'] });
      toast.success('Exception resolved.');
      setMatchModal(null);
      setClaimIdInput('');
    },
    onError: e => toast.error(e.response?.data?.detail || 'Failed to resolve exception.'),
  });

  return (
    <div>
      <div className="tablewrap">
        <table className="table">
          <thead>
            <tr>
              <th>Patient from ERA</th><th>Claim no. from ERA</th><th>DOS</th>
              <th>CPT</th><th className="right">Charged</th><th className="right">Paid</th>
              <th>Adj group</th><th>Adj reason</th><th>Remark</th>
              <th>Possible match</th><th>Conf %</th><th>Action</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan={12} className="muted" style={{ textAlign: 'center', padding: 24 }}>Loading…</td></tr>
            )}
            {!isLoading && exceptions.length === 0 && (
              <tr>
                <td colSpan={12} className="muted" style={{ textAlign: 'center', padding: 24 }}>
                  No unresolved exceptions. Import an ERA file and run auto-post to see results here.
                </td>
              </tr>
            )}
            {exceptions.map(exc => (
              <tr key={exc.id}>
                <td>{exc.patient_name_on_era || '—'}</td>
                <td className="mono">{exc.claim_id_on_era}</td>
                <td>{exc.dos}</td>
                <td className="mono">{exc.cpt_code || '—'}</td>
                <td className="right">{fmt(exc.charged_amount)}</td>
                <td className="right">{fmt(exc.paid_amount)}</td>
                <td>{exc.adjustment_group || '—'}</td>
                <td>{exc.adjustment_reason || '—'}</td>
                <td>{exc.remark_code || '—'}</td>
                <td className="mono">{exc.possible_match_claim_id || '—'}</td>
                <td>{exc.confidence_pct > 0 ? `${exc.confidence_pct}%` : '—'}</td>
                <td>
                  <button
                    className="btn sm"
                    onClick={() => { setMatchModal({ exc }); setClaimIdInput(exc.possible_match_claim_id || ''); }}
                  >
                    Resolve
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal
        open={!!matchModal}
        title="Resolve ERA exception"
        onClose={() => setMatchModal(null)}
        footer={
          <>
            <button className="btn ghost" onClick={() => setMatchModal(null)}>Cancel</button>
            <button
              className="btn primary"
              disabled={matchMut.isPending || !claimIdInput.trim()}
              onClick={() => matchMut.mutate({ exc: matchModal.exc, claimId: claimIdInput.trim() })}
            >
              {matchMut.isPending ? 'Saving…' : 'Resolve & post'}
            </button>
          </>
        }
      >
        {matchModal && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ fontSize: 13, color: 'var(--slate)' }}>
              Patient: <strong>{matchModal.exc.patient_name_on_era}</strong> ·
              ERA claim: <strong>{matchModal.exc.claim_id_on_era}</strong> ·
              DOS: <strong>{matchModal.exc.dos}</strong> ·
              CPT: <strong>{matchModal.exc.cpt_code || '—'}</strong> ·
              Paid: <strong>{fmt(matchModal.exc.paid_amount)}</strong>
            </div>
            <div className="field">
              <label>Match to claim ID</label>
              <input
                className="input"
                value={claimIdInput}
                onChange={e => setClaimIdInput(e.target.value)}
                placeholder="BB-2026-000001"
                autoFocus
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

// ── Main Payments page ───────────────────────────────────────────────────────

export default function Payments() {
  const qc = useQueryClient();
  const toast = useToast();
  const [tab, setTab] = useState('era-dashboard');
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState(BLANK);
  const [formErr, setFormErr] = useState('');
  const eraInputRef = useRef(null);

  const { data, isLoading } = useQuery({
    queryKey: ['payments'],
    queryFn: () => listPayments({}),
  });
  const payments = data?.results || [];

  const addMutation = useMutation({
    mutationFn: createPayment,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['payments'] });
      setShowAdd(false);
      setForm({ ...BLANK, payment_date: today() });
      setFormErr('');
      toast.success('Payment saved.');
    },
    onError: e => {
      const d = e.response?.data;
      const msg = d?.detail || (typeof d === 'object' ? JSON.stringify(d) : '') || 'Error saving payment.';
      setFormErr(msg);
    },
  });

  const importMut = useMutation({
    mutationFn: importERA,
    onSuccess: r => {
      qc.invalidateQueries({ queryKey: ['payments'] });
      qc.invalidateQueries({ queryKey: ['era-dashboard'] });
      toast.success(`ERA received: ${r.payment_id}. Processing in background.`);
    },
    onError: e => toast.error(e.response?.data?.detail || 'ERA import failed.'),
  });

  const autoPostMut = useMutation({
    mutationFn: paymentId => autoPostERA(paymentId),
    onSuccess: r => {
      qc.invalidateQueries({ queryKey: ['payments'] });
      qc.invalidateQueries({ queryKey: ['era-exceptions'] });
      qc.invalidateQueries({ queryKey: ['era-dashboard'] });
      toast.success(`Auto-post: ${r.posted_applications} applied, ${r.remaining_exceptions} exception(s).`);
    },
    onError: () => toast.error('Auto-post failed.'),
  });

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.payer.trim()) { setFormErr('Payer name is required.'); return; }
    if (!form.amount || isNaN(Number(form.amount))) { setFormErr('Enter a valid amount.'); return; }
    setFormErr('');
    addMutation.mutate({ ...form, amount: Number(form.amount), payer_name: form.payer });
  }

  function handleERAFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    importMut.mutate(file);
    e.target.value = '';
  }

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  return (
    <div>
      <div className="header">
        <div>
          <div className="eyebrow">Payments and posting</div>
          <div className="title">Payments</div>
          <div className="desc">Manage ERA 835 imports, auto-post, exception resolution, manual payments, and reconciliation.</div>
        </div>
        <div className="actions">
          <button className="btn" onClick={() => { setForm({ ...BLANK, payment_date: today() }); setFormErr(''); setShowAdd(true); }}>+ Add payment</button>
          <button className="btn" onClick={() => eraInputRef.current?.click()} disabled={importMut.isPending}>
            {importMut.isPending ? 'Uploading…' : 'Import ERA'}
          </button>
          {/* Accepts raw EDI (.835, .edi, .txt), ZIP bundles, and X12 files */}
          <input
            ref={eraInputRef}
            type="file"
            accept=".835,.txt,.edi,.x12,.zip"
            style={{ display: 'none' }}
            onChange={handleERAFile}
          />
          <button
            className="btn primary"
            onClick={() => {
              const eraPayments = payments.filter(p => p.source === '835 ERA' && p.status !== 'Posted');
              if (eraPayments.length === 0) { toast.warn('No unposted ERA payments found.'); return; }
              eraPayments.forEach(p => autoPostMut.mutate(p.id));
            }}
          >
            Auto-post ERA
          </button>
        </div>
      </div>

      <div className="card">
        <div className="tabs" style={{ padding: '0 4px' }}>
          {TABS.map(t => (
            <button key={t} className={`tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
              {TAB_LABELS[t]}
            </button>
          ))}
        </div>

        {tab === 'era-dashboard' && <div style={{ padding: '0 20px' }}><ERADashboardTab /></div>}

        {tab === 'payments' && (
          <div className="tablewrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Payment ID</th><th>Date</th><th>Payer type</th><th>Payer</th><th>Method</th>
                  <th>Check / Auth</th><th className="right">Amount</th><th className="right">Applied</th>
                  <th className="right">Unapplied</th><th>Status</th><th>Where applied</th><th>Source</th>
                </tr>
              </thead>
              <tbody>
                {isLoading && <tr><td colSpan={12} className="muted" style={{ padding: '24px 20px', textAlign: 'center' }}>Loading payments…</td></tr>}
                {!isLoading && payments.length === 0 && (
                  <tr>
                    <td colSpan={12} style={{ padding: '48px 20px', textAlign: 'center', color: 'var(--slate)' }}>
                      No payments found.{' '}
                      <span className="link" onClick={() => { setForm({ ...BLANK, payment_date: today() }); setFormErr(''); setShowAdd(true); }}>
                        Add the first payment →
                      </span>
                    </td>
                  </tr>
                )}
                {payments.map(p => (
                  <tr key={p.id} className="clickable">
                    <td className="mono">{p.payment_id}</td>
                    <td>{p.payment_date}</td>
                    <td>{p.payer_type}</td>
                    <td>{p.payer_name || p.payer}</td>
                    <td>{p.method}</td>
                    <td className="mono">{p.check_auth_number || p.check_number || '—'}</td>
                    <td className="right">{fmt(p.amount)}</td>
                    <td className="right">{fmt(p.applied || 0)}</td>
                    <td className="right">{fmt(p.unapplied != null ? p.unapplied : p.amount)}</td>
                    <td><Badge status={p.status} /></td>
                    <td>{p.where_applied || '—'}</td>
                    <td>{p.source || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'era-autopost' && (
          <div className="tablewrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Payment ID</th><th>Payer</th><th className="right">Amount</th>
                  <th className="right">Applied</th><th className="right">Unapplied</th>
                  <th>ERA status</th><th>Action</th>
                </tr>
              </thead>
              <tbody>
                {payments.filter(p => p.source === '835 ERA').length === 0 && (
                  <tr><td colSpan={7} className="muted" style={{ textAlign: 'center', padding: 24 }}>No ERA payments imported yet. Use "Import ERA" to upload an 835 file or ZIP bundle.</td></tr>
                )}
                {payments.filter(p => p.source === '835 ERA').map(p => (
                  <tr key={p.id}>
                    <td className="mono">{p.payment_id}</td>
                    <td>{p.payer_name}</td>
                    <td className="right">{fmt(p.amount)}</td>
                    <td className="right">{fmt(p.applied || 0)}</td>
                    <td className="right">{fmt(p.unapplied != null ? p.unapplied : p.amount)}</td>
                    <td><Badge status={p.status} /></td>
                    <td>
                      <button
                        className="btn sm primary"
                        disabled={autoPostMut.isPending || p.status === 'Posted'}
                        onClick={() => autoPostMut.mutate(p.id)}
                      >
                        Auto-post
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'unmatched' && <UnmatchedTab />}

        {tab === 'applied' && (
          <div className="tablewrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Applied date</th><th>Patient</th><th>Visit</th><th>Claim</th>
                  <th>Type</th><th className="right">Amount</th><th>Payment</th><th>Posted by</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan={8} className="muted" style={{ textAlign: 'center', padding: 24 }}>
                    Applied payment lines load here after ERA auto-post or manual posting.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {tab === 'reconciliation' && (
          <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="alert info">
              <strong>ERA/EFT reconciliation</strong>
              <div className="sub">Import ERA files and run auto-post to see reconciliation status here.</div>
            </div>
          </div>
        )}
      </div>

      <Modal
        open={showAdd}
        title="Add payment"
        onClose={() => setShowAdd(false)}
        footer={
          <>
            <button className="btn ghost" onClick={() => setShowAdd(false)}>Cancel</button>
            <button className="btn primary" onClick={handleSubmit} disabled={addMutation.isPending}>
              {addMutation.isPending ? 'Saving…' : 'Save payment'}
            </button>
          </>
        }
      >
        {formErr && <div className="alert danger" style={{ marginBottom: 4 }}>{formErr}</div>}
        <div className="form-row">
          <div className="field">
            <label>Payer type</label>
            <select className="input" value={form.payer_type} onChange={e => set('payer_type', e.target.value)}>
              <option value="Insurance">Insurance</option>
              <option value="Patient">Patient</option>
            </select>
          </div>
          <div className="field">
            <label>Payment date</label>
            <input className="input" type="date" value={form.payment_date} onChange={e => set('payment_date', e.target.value)} />
          </div>
        </div>
        <div className="form-row">
          <div className="field">
            <label>Payer / patient name *</label>
            <input className="input" value={form.payer} onChange={e => set('payer', e.target.value)} placeholder="Medicare or Maria Sanchez" autoFocus />
          </div>
          <div className="field">
            <label>Amount *</label>
            <input className="input" type="number" min="0" step="0.01" value={form.amount} onChange={e => set('amount', e.target.value)} placeholder="0.00" />
          </div>
        </div>
        <div className="form-row">
          <div className="field">
            <label>Method</label>
            <select className="input" value={form.method} onChange={e => set('method', e.target.value)}>
              <option value="EFT">EFT</option>
              <option value="Check">Check</option>
              <option value="Card">Card</option>
              <option value="Cash">Cash</option>
            </select>
          </div>
          <div className="field">
            <label>Check / Auth no.</label>
            <input className="input" value={form.check_number} onChange={e => set('check_number', e.target.value)} placeholder="EFT-88301" />
          </div>
        </div>
        <div className="field">
          <label>Note</label>
          <input className="input" value={form.note} onChange={e => set('note', e.target.value)} placeholder="Optional note" />
        </div>
      </Modal>
    </div>
  );
}
