import React, { useState } from 'react';
import Badge from '../components/Badge';

const fmt = n => '$' + Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const PAYMENTS = [
  { id: 'PMT-9012', date: '06/27/2026', payerType: 'Insurance', payer: 'Medicare', method: 'EFT', check: 'EFT-88301', amount: 12840.45, applied: 12410.45, unapplied: 430, status: 'Posted with warnings', where: '18 claims', source: '835 ERA' },
  { id: 'PMT-9013', date: '06/26/2026', payerType: 'Patient', payer: 'Maria Sanchez', method: 'Card', check: 'AUTH-2910', amount: 50, applied: 50, unapplied: 0, status: 'Reconciled', where: 'V-20491', source: 'Manual' },
  { id: 'PMT-9014', date: '06/26/2026', payerType: 'Insurance', payer: 'BCBS', method: 'Check', check: 'CHK-10882', amount: 3120.78, applied: 0, unapplied: 3120.78, status: 'Unmatched', where: 'Needs matching', source: 'EOB' },
];

const TABS = ['payments', 'applied', 'era-autopost', 'unmatched', 'reconciliation'];
const TAB_LABELS = { payments: 'Payments', applied: 'Applied', 'era-autopost': 'ERA Auto-post', unmatched: 'Unmatched', reconciliation: 'Reconciliation' };

export default function Payments() {
  const [tab, setTab] = useState('payments');

  return (
    <div>
      <div className="header">
        <div>
          <div className="eyebrow">Payments and posting</div>
          <div className="title">Payments</div>
          <div className="desc">Manage deposits, manual payments, ERA import, auto-post, applied payments, unapplied balances, unmatched payments, adjustments, reversals, receipts, and reconciliation.</div>
        </div>
        <div className="actions">
          <button className="btn" onClick={() => alert('Add payment modal — coming soon')}>Add payment</button>
          <button className="btn" onClick={() => alert('Import ERA modal — coming soon')}>Import ERA</button>
          <button className="btn primary" onClick={() => alert('Auto-post ERA modal — coming soon')}>Auto-post ERA</button>
        </div>
      </div>

      <div className="card">
        <div className="tabs">
          {TABS.map(t => (
            <button key={t} className={`tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>{TAB_LABELS[t]}</button>
          ))}
        </div>
        <div style={{ padding: 0 }}>
          {tab === 'payments' && (
            <div className="tablewrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Payment date</th><th>Payer type</th><th>Payer</th><th>Method</th>
                    <th>Check/Auth</th><th className="right">Amount</th><th className="right">Applied</th>
                    <th className="right">Unapplied</th><th>Status</th><th>Where applied</th><th>Source</th>
                  </tr>
                </thead>
                <tbody>
                  {PAYMENTS.map(p => (
                    <tr key={p.id} className="clickable">
                      <td>{p.date}</td><td>{p.payerType}</td><td>{p.payer}</td><td>{p.method}</td>
                      <td className="mono">{p.check}</td>
                      <td className="right">{fmt(p.amount)}</td>
                      <td className="right">{fmt(p.applied)}</td>
                      <td className="right">{fmt(p.unapplied)}</td>
                      <td><Badge status={p.status} /></td>
                      <td>{p.where}</td><td>{p.source}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {tab === 'applied' && (
            <div className="tablewrap">
              <table className="table">
                <thead><tr><th>Applied date</th><th>Patient</th><th>Visit</th><th>Claim</th><th>Type</th><th className="right">Amount</th><th>Payment</th><th>Posted by</th><th>Action</th></tr></thead>
                <tbody>
                  <tr><td>06/27/2026</td><td>Maria Sanchez</td><td>V-20491</td><td>BB-2026-000183</td><td>Patient payment</td><td className="right">$50.00</td><td>PMT-9013</td><td>Lina</td><td><button className="btn danger">Reverse</button></td></tr>
                  <tr><td>06/27/2026</td><td>Victor Chen</td><td>V-20460</td><td>BB-2026-000171</td><td>Insurance payment</td><td className="right">$92.00</td><td>PMT-9012</td><td>System</td><td><button className="btn">View</button></td></tr>
                </tbody>
              </table>
            </div>
          )}
          {tab === 'era-autopost' && (
            <div className="tablewrap">
              <table className="table">
                <thead><tr><th>Check</th><th>Payer on claim</th><th>Payer on check</th><th className="right">Payment</th><th className="right">Applied</th><th className="right">Unapplied</th><th>ERA status</th><th>Confidence</th><th>Exceptions</th><th>Next action</th></tr></thead>
                <tbody>
                  <tr><td>EFT-88301</td><td>Medicare</td><td>Medicare</td><td className="right">$12,840.45</td><td className="right">$12,410.45</td><td className="right">$430.00</td><td><Badge status="Posted with warnings" /></td><td>92%</td><td>3</td><td><button className="btn primary" onClick={() => alert('Opening ERA exceptions…')}>Review exceptions</button></td></tr>
                  <tr><td>CHK-10882</td><td>BCBS</td><td>BCBS Texas</td><td className="right">$3,120.78</td><td className="right">$0.00</td><td className="right">$3,120.78</td><td><Badge status="Unmatched" /></td><td>41%</td><td>8</td><td><button className="btn">Manual match</button></td></tr>
                </tbody>
              </table>
            </div>
          )}
          {tab === 'unmatched' && (
            <div className="tablewrap">
              <table className="table">
                <thead><tr><th>Patient from ERA</th><th>Claim no. from ERA</th><th>DOS</th><th>CPT</th><th className="right">Paid</th><th>Adj reason</th><th>Possible match</th><th>Confidence</th><th>Action</th></tr></thead>
                <tbody>
                  <tr><td>M Sanchez</td><td>BB-2026-000183</td><td>06/24/2026</td><td>20610</td><td className="right">$0.00</td><td>Deductible</td><td>Maria Sanchez / V-20491</td><td>62%</td><td><button className="btn primary" onClick={() => alert('ERA line matched and queued for posting review.')}>Accept match</button></td></tr>
                  <tr><td>T Green</td><td>LEGACY-744</td><td>05/29/2026</td><td>99214</td><td className="right">$88.00</td><td>CO-45</td><td>BB-2026-000177</td><td>74%</td><td><button className="btn">Review</button></td></tr>
                </tbody>
              </table>
            </div>
          )}
          {tab === 'reconciliation' && (
            <div style={{ padding: 16 }}>
              <div className="grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                <div className="alert info"><strong>ERA/EFT reconciliation</strong><div className="sub">PMT-9012 ERA total $12,840.45; EFT matched $12,840.45; $430 requires manual exception review.</div></div>
                <div className="alert warn"><strong>Unapplied balance</strong><div className="sub">PMT-9014 has $3,120.78 unapplied. Assign owner or resolve before close.</div></div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
