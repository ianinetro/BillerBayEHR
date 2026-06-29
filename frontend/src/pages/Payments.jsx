import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Badge from '../components/Badge';
import Modal from '../components/Modal';
import { listPayments, createPayment } from '../api/payments';

const fmt = n => '$' + Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const TABS = ['payments', 'applied', 'era-autopost', 'unmatched', 'reconciliation'];
const TAB_LABELS = { payments: 'Payments', applied: 'Applied', 'era-autopost': 'ERA Auto-post', unmatched: 'Unmatched', reconciliation: 'Reconciliation' };

const today = () => new Date().toISOString().slice(0, 10);
const BLANK = { payer_type: 'Insurance', payer: '', method: 'EFT', check_number: '', amount: '', payment_date: today(), note: '' };

export default function Payments() {
  const qc = useQueryClient();
  const [tab, setTab] = useState('payments');
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState(BLANK);
  const [formErr, setFormErr] = useState('');

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
    },
    onError: e => {
      const d = e.response?.data;
      setFormErr(d?.detail || (typeof d === 'object' ? JSON.stringify(d) : '') || 'Error saving payment.');
    },
  });

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.payer.trim()) { setFormErr('Payer name is required.'); return; }
    if (!form.amount || isNaN(Number(form.amount))) { setFormErr('Enter a valid amount.'); return; }
    setFormErr('');
    addMutation.mutate({ ...form, amount: Number(form.amount) });
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
          <button className="btn" onClick={() => alert('Import ERA — select 835 file to upload.')}>Import ERA</button>
          <button className="btn primary" onClick={() => alert('Auto-post ERA — review and confirm ERA matching.')}>Auto-post ERA</button>
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
                    <td>{p.payer}</td>
                    <td>{p.method}</td>
                    <td className="mono">{p.check_number || '—'}</td>
                    <td className="right">{fmt(p.amount)}</td>
                    <td className="right">{fmt(p.applied || 0)}</td>
                    <td className="right">{fmt(p.unapplied || p.amount)}</td>
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
                  <td>06/27/2026</td><td>Maria Sanchez</td><td>V-20491</td><td>BB-2026-000183</td>
                  <td>Patient payment</td><td className="right">$50.00</td><td className="mono">PMT-9013</td><td>Lina</td>
                  <td><button className="btn sm danger">Reverse</button></td>
                </tr>
                <tr>
                  <td>06/27/2026</td><td>Victor Chen</td><td>V-20460</td><td>BB-2026-000171</td>
                  <td>Insurance payment</td><td className="right">$92.00</td><td className="mono">PMT-9012</td><td>System</td>
                  <td><button className="btn sm">View</button></td>
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
                  <th>Check</th><th>Payer on claim</th><th>Payer on check</th>
                  <th className="right">Payment</th><th className="right">Applied</th><th className="right">Unapplied</th>
                  <th>ERA status</th><th>Confidence</th><th>Exceptions</th><th>Next action</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>EFT-88301</td><td>Medicare</td><td>Medicare</td>
                  <td className="right">$12,840.45</td><td className="right">$12,410.45</td><td className="right">$430.00</td>
                  <td><Badge status="Posted with warnings" /></td><td>92%</td><td>3</td>
                  <td><button className="btn sm primary" onClick={() => alert('Opening ERA exceptions…')}>Review exceptions</button></td>
                </tr>
                <tr>
                  <td>CHK-10882</td><td>BCBS</td><td>BCBS Texas</td>
                  <td className="right">$3,120.78</td><td className="right">$0.00</td><td className="right">$3,120.78</td>
                  <td><Badge status="Unmatched" /></td><td>41%</td><td>8</td>
                  <td><button className="btn sm">Manual match</button></td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {tab === 'unmatched' && (
          <div className="tablewrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Patient from ERA</th><th>Claim no. from ERA</th><th>DOS</th><th>CPT</th>
                  <th className="right">Paid</th><th>Adj reason</th><th>Possible match</th><th>Confidence</th><th>Action</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>M Sanchez</td><td>BB-2026-000183</td><td>06/24/2026</td><td>20610</td>
                  <td className="right">$0.00</td><td>Deductible</td><td>Maria Sanchez / V-20491</td><td>62%</td>
                  <td><button className="btn sm primary" onClick={() => alert('ERA line matched.')}>Accept match</button></td>
                </tr>
                <tr>
                  <td>T Green</td><td>LEGACY-744</td><td>05/29/2026</td><td>99214</td>
                  <td className="right">$88.00</td><td>CO-45</td><td>BB-2026-000177</td><td>74%</td>
                  <td><button className="btn sm">Review</button></td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {tab === 'reconciliation' && (
          <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="alert info">
              <strong>ERA/EFT reconciliation</strong>
              <div className="sub">PMT-9012 ERA total $12,840.45; EFT matched $12,840.45; $430 requires manual exception review.</div>
            </div>
            <div className="alert warn">
              <strong>Unapplied balance</strong>
              <div className="sub">PMT-9014 has $3,120.78 unapplied. Assign owner or resolve before close.</div>
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
