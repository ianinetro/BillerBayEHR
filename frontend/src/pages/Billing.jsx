import React from 'react';
import { useNavigate } from 'react-router-dom';
import Badge from '../components/Badge';

const QUEUES = [
  { label: 'Visits ready for billing', count: 18, hint: '$12,840.45', type: 'success' },
  { label: 'Visits missing billing data', count: 11, hint: 'Oldest 6 days', type: 'warn' },
  { label: 'Claims validation failed', count: 7, hint: '4 blocking', type: 'danger' },
  { label: 'Claims ready to submit', count: 18, hint: 'Batch available', type: 'success' },
  { label: 'Claims awaiting batch', count: 6, hint: 'Auto-submit off', type: 'warn' },
  { label: 'Rejected claims', count: 5, hint: '277CA / payer', type: 'danger' },
  { label: 'Denied claims', count: 9, hint: 'Appeals due', type: 'danger' },
  { label: 'Secondary claims pending', count: 13, hint: 'Primary paid', type: 'warn' },
  { label: 'A/R follow-up', count: 32, hint: 'Oldest 123 days', type: 'danger' },
  { label: 'Patient balances', count: 24, hint: 'Statements due', type: 'warn' },
  { label: 'ERA unmatched', count: 12, hint: '$430 exception', type: 'danger' },
  { label: 'No activity / stale claims', count: 17, hint: '>15 days', type: 'warn' },
];

const WORK = [
  { type: 'Validation failed', priority: 'Overdue', patient: 'Maria Sanchez', visit: 'V-20491', claim: 'BB-2026-000183', payer: 'Medicare', amount: '$320.00', reason: 'Missing insured relationship', owner: 'Lina', age: '2d', action: 'Fix issue' },
  { type: 'ERA unmatched', priority: 'Overdue', patient: 'Unknown from ERA', visit: '—', claim: 'CLM-8834', payer: 'Medicare', amount: '$430.00', reason: 'Possible match confidence 62%', owner: 'Maya', age: '1d', action: 'Manual match' },
  { type: 'Rejected claim', priority: 'Overdue', patient: 'Ellen Brooks', visit: 'V-20480', claim: 'BB-2026-000178', payer: 'Aetna', amount: '$220.00', reason: '277CA invalid payer ID', owner: 'Omar', age: '9d', action: 'Correct payer' },
  { type: 'A/R follow-up', priority: 'Warning', patient: 'Thomas Green', visit: 'V-20460', claim: 'BB-2026-000177', payer: 'Humana', amount: '$650.00', reason: 'No payer response in 74 days', owner: 'Lina', age: '74d', action: 'Follow up' },
  { type: 'Secondary pending', priority: 'Warning', patient: 'Victor Chen', visit: 'V-20460', claim: 'BB-2026-000171', payer: 'UHC', amount: '$88.00', reason: 'Primary paid; secondary needed', owner: 'Maya', age: '4d', action: 'Create secondary' },
];

export default function Billing() {
  const navigate = useNavigate();
  return (
    <div>
      <div className="header">
        <div>
          <div className="eyebrow">Billing workbench</div>
          <div className="title">Billing work queues</div>
          <div className="desc">Every queue shows reason, priority, owner, age, next action, and bulk actions.</div>
        </div>
        <div className="actions">
          <button className="btn" onClick={() => alert('Visible work assigned to you.')}>Assign visible to me</button>
          <button className="btn primary" onClick={() => alert('837P batch submitted.')}>Submit ready claims</button>
        </div>
      </div>

      <div className="grid queuecards">
        {QUEUES.map(q => (
          <div key={q.label} className="card queuecard" onClick={() => alert(`Opened queue: ${q.label}`)}>
            <div className="sub">{q.label}</div>
            <div className="num">{q.count}</div>
            <div>
              <Badge status={q.type === 'danger' ? 'Overdue' : q.type === 'warn' ? 'Warning' : 'Active'} />
              {' '}<span className="sub">{q.hint}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <div className="toolbar">
          <div>
            <strong>Unified work queue</strong>
            <div className="sub">Sort by priority, payer, owner, age, amount, or next action.</div>
          </div>
          <div className="actions">
            <button className="btn">Bulk assign</button>
            <button className="btn">Bulk validate</button>
            <button className="btn primary">Bulk submit</button>
          </div>
        </div>
        <div className="tablewrap">
          <table className="table">
            <thead>
              <tr>
                <th>Type</th><th>Priority</th><th>Patient</th><th>Visit</th>
                <th>Claim</th><th>Payer</th><th className="right">Amount</th>
                <th>Reason</th><th>Owner</th><th>Age</th><th>Next action</th>
              </tr>
            </thead>
            <tbody>
              {WORK.map((r, i) => (
                <tr key={i} className="clickable" onClick={() => r.claim.startsWith('BB') && navigate(`/claims/${r.claim}`)}>
                  <td>{r.type}</td>
                  <td><Badge status={r.priority} /></td>
                  <td>{r.patient}</td>
                  <td className="mono">{r.visit}</td>
                  <td className="mono">{r.claim}</td>
                  <td>{r.payer}</td>
                  <td className="right">{r.amount}</td>
                  <td>{r.reason}</td>
                  <td>{r.owner}</td>
                  <td>{r.age}</td>
                  <td><button className="btn">{r.action}</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
