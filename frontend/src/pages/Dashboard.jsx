import React from 'react';
import { useNavigate } from 'react-router-dom';
import Badge from '../components/Badge';

const KPIS = [
  { label: 'Ready to submit', value: 18, hint: '$12,840.45 total charges' },
  { label: 'Validation failed', value: 7, hint: '4 blocking issues' },
  { label: 'Rejected claims', value: 5, hint: 'Oldest 9 days' },
  { label: 'ERA exceptions', value: 12, hint: '$430.00 unmatched' },
  { label: 'A/R over 90', value: 23, hint: '$18,920.10 at risk' },
];

const WORK = [
  { type: 'Validation failed', priority: 'Overdue', patient: 'Maria Sanchez', visit: 'V-20491', claim: 'BB-2026-000183', payer: 'Medicare', amount: '$320.00', reason: 'Missing insured relationship', owner: 'Lina', age: '2d' },
  { type: 'ERA unmatched', priority: 'Overdue', patient: 'Unknown from ERA', visit: '—', claim: 'CLM-8834', payer: 'Medicare', amount: '$430.00', reason: 'Possible match confidence 62%', owner: 'Maya', age: '1d' },
  { type: 'Rejected claim', priority: 'Overdue', patient: 'Ellen Brooks', visit: 'V-20480', claim: 'BB-2026-000178', payer: 'Aetna', amount: '$220.00', reason: '277CA invalid payer ID', owner: 'Omar', age: '9d' },
  { type: 'A/R follow-up', priority: 'Warning', patient: 'Thomas Green', visit: 'V-20460', claim: 'BB-2026-000177', payer: 'Humana', amount: '$650.00', reason: 'No payer response in 74 days', owner: 'Lina', age: '74d' },
];

const TIMELINE = [
  { title: 'Patient updated', detail: 'P10042 insurance verified 22 minutes ago.' },
  { title: 'Visit ready for billing', detail: 'V-20491 has diagnosis and service lines.' },
  { title: 'Claim blocked', detail: 'BB-2026-000183 needs subscriber relationship.' },
  { title: 'ERA imported', detail: 'PMT-9012 imported with 3 exceptions.' },
];

export default function Dashboard() {
  const navigate = useNavigate();
  return (
    <div>
      <div className="header">
        <div>
          <div className="eyebrow">Operational dashboard</div>
          <div className="title">Billing work that needs attention</div>
          <div className="desc">Review urgent work, open exceptions, and payer/payment activity.</div>
        </div>
        <div className="actions">
          <button className="btn" onClick={() => navigate('/billing')}>Open billing workbench</button>
        </div>
      </div>

      <div className="grid kpis">
        {KPIS.map(k => (
          <div key={k.label} className="card pad kpi">
            <div className="label">{k.label}</div>
            <div className="value">{k.value}</div>
            <div className="hint">{k.hint}</div>
          </div>
        ))}
      </div>

      <div className="grid" style={{ gridTemplateColumns: '1.4fr .8fr', marginTop: 16 }}>
        <div className="card">
          <div className="toolbar">
            <div>
              <strong>Highest priority work</strong>
              <div className="sub">Queue items include reason, owner, age, and next action.</div>
            </div>
            <button className="btn" onClick={() => navigate('/billing')}>View all</button>
          </div>
          <div className="tablewrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Type</th><th>Priority</th><th>Patient</th><th>Visit</th>
                  <th>Claim</th><th>Payer</th><th className="right">Amount</th>
                  <th>Reason</th><th>Owner</th><th>Age</th>
                </tr>
              </thead>
              <tbody>
                {WORK.map((r, i) => (
                  <tr key={i} className="clickable"
                    onClick={() => r.claim.startsWith('BB') && navigate(`/claims/${r.claim}`)}>
                    <td>{r.type}</td><td><Badge status={r.priority} /></td>
                    <td>{r.patient}</td><td className="mono">{r.visit}</td>
                    <td className="mono">{r.claim}</td><td>{r.payer}</td>
                    <td className="right">{r.amount}</td><td>{r.reason}</td>
                    <td>{r.owner}</td><td>{r.age}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="card pad">
          <div className="sectionTitle">Revenue-cycle lifecycle</div>
          <div className="sub">Patient → Visit → Claim → EDI → Remittance → Payment → A/R</div>
          <div className="divider" />
          <div className="timeline">
            {TIMELINE.map((e, i) => (
              <div key={i} className="event">
                <div className="dot" />
                <div><strong>{e.title}</strong><br /><span>{e.detail}</span></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
