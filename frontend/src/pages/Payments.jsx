import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Badge from '../components/Badge';
import Modal from '../components/Modal';
import { listPayments, createPayment, importERA, autoPostERA, matchException } from '../api/payments';
import { useToast } from '../components/Toast';

const fmt = n => '$' + Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const TABS = ['payments', 'applied', 'era-autopost', 'unmatched', 'reconciliation'];
const TAB_LABELS = { payments: 'Payments', applied: 'Applied', 'era-autopost': 'ERA Auto-post', unmatched: 'Unmatched', reconciliation: 'Reconciliation' };

const today = () => new Date().toISOString().slice(0, 10);
const BLANK = { payer_type: 'Insurance', payer: '', method: 'EFT', check_number: '', amount: '', payment_date: today(), note: '' };

export default function Payments() {
  const qc = useQueryClient();
  const toast = useToast();
  const [tab, setTab] = useState('payments');
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
    onSuccess: r => { qc.invalidateQueries({ queryKey: ['payments'] }); toast.success(`ERA received: ${r.payment_id}. Processing in background.`); },
    onError: () => toast.error('ERA import failed.'),
  });

  const autoPostMut = useMutation({
    mutationFn: paymentId => autoPostERA(paymentId),
    onSuccess: r => { qc.invalidateQueries({ queryKey: ['payments'] }); toast.success(`Auto-post: ${r.posted_applications} applied, ${r.remaining_exceptions} exception(s).`); },
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
          <div className="desc">Manage deposits, manual payments, ERA import, auto-post, applied payments, unapplied balances, unmatched payments, adjustments, reversals, and reconciliation.</div>
        </div>
        <div className="actions">
          <button className="btn" onClick={() => { setForm({ ...BLANK, payment_date: today() }); setFormErr(''); setShowAdd(true); }}>+ Add payment</button>
          <button className="btn" onClick={() => eraInputRef.current?.click()} disabled={importMut.isPending}>
            {importMut.isPending ? 'Uploading…' : 'Import ERA'}
          </button>
          <input ref={eraInputRef} type="file" accept=".835,.txt,.edi,.x12" style={{ display: 'none' }} onChange={handleERAFile} />
          <button className="btn primary" onClick={() => {
            const eraPayments = payments.filter(p => p.source === '835 ERA' && p.status !== 'Posted');
            if (eraPayments.length === 0) { toast.warn('No unposted ERA payments found.'); return; }
            eraPayments.forEach(p => autoPostMut.mutate(p.id));
          }}>Auto-post ERA</button>
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

        {tab === 'applied' && (
          <div className="tablewrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Applied date</th><th>Patient</th><th>Visit</th><th>Claim</th>
                  <th>Type</th><th className="right">Amount</th><th>Payment</th><th>Posted by</th><th>Action</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan={9} className="muted" style={{ textAlign: 'center', padding: 24 }}>
                    Applied payment lines load here after ERA auto-post or manual posting.
                  </td>
                </tr>
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
                  <tr><td colSpan={7} className="muted" style={{ textAlign: 'center', padding: 24 }}>No ERA payments imported yet. Use "Import ERA" to upload an 835 file.</td></tr>
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
                      <button className="btn sm primary" disabled={autoPostMut.isPending} onClick={() => autoPostMut.mutate(p.id)}>
                        Auto-post
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'unmatched' && (
          <div className="tablewrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Patient from ERA</th><th>Claim no. from ERA</th><th>DOS</th>
                  <th className="right">Paid</th><th>Adj reason</th><th>Possible match</th><th>Confidence</th><th>Action</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan={8} className="muted" style={{ textAlign: 'center', padding: 24 }}>
                    Unmatched ERA lines appear here after auto-post runs.
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
