import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import Badge from '../components/Badge';
import { listWorkQueue } from '../api/billing';

const fmt = n => '$' + Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function kpisFromQueue(items) {
  const byType = {};
  for (const item of items) {
    if (!byType[item.item_type]) byType[item.item_type] = { count: 0, amount: 0 };
    byType[item.item_type].count++;
    byType[item.item_type].amount += Number(item.amount || 0);
  }
  return [
    { label: 'Ready to submit', value: byType['Ready to submit']?.count ?? 0, hint: fmt(byType['Ready to submit']?.amount) + ' total charges' },
    { label: 'Validation failed', value: byType['Validation failed']?.count ?? 0, hint: 'Blocking issues' },
    { label: 'Rejected claims', value: byType['Rejected claim']?.count ?? 0, hint: 'Need rework' },
    { label: 'ERA exceptions', value: byType['ERA unmatched']?.count ?? 0, hint: fmt(byType['ERA unmatched']?.amount) + ' unmatched' },
    { label: 'A/R follow-up', value: byType['A/R follow-up']?.count ?? 0, hint: fmt(byType['A/R follow-up']?.amount) + ' at risk' },
  ];
}

const TIMELINE = [
  { title: 'Patient updated', detail: 'Insurance verification complete.' },
  { title: 'Visit ready for billing', detail: 'Visit has diagnosis and service lines.' },
  { title: 'Claim blocked', detail: 'Claim needs subscriber relationship.' },
  { title: 'ERA imported', detail: 'ERA imported — exceptions need review.' },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({
    queryKey: ['work-queue'],
    queryFn: () => listWorkQueue({ resolved: false, page_size: 100 }),
  });
  const items = data?.results || [];
  const kpis = kpisFromQueue(items);
  const topWork = items.slice(0, 5);

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
        {kpis.map(k => (
          <div key={k.label} className="card pad kpi">
            <div className="label">{k.label}</div>
            <div className="value">{isLoading ? '…' : k.value}</div>
            <div className="hint">{k.hint}</div>
          </div>
        ))}
      </div>

      <div className="grid" style={{ gridTemplateColumns: '1.4fr .8fr', marginTop: 16 }}>
        <div className="card">
          <div className="toolbar">
            <div>
              <strong>Highest priority work</strong>
              <div className="sub">Queue items with reason, owner, age, and next action.</div>
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
                {isLoading && <tr><td colSpan={10} className="muted" style={{ padding: '24px 20px', textAlign: 'center' }}>Loading…</td></tr>}
                {!isLoading && topWork.length === 0 && (
                  <tr><td colSpan={10} className="muted" style={{ padding: '24px 20px', textAlign: 'center' }}>No open work items.</td></tr>
                )}
                {topWork.map(r => (
                  <tr key={r.id} className="clickable"
                    onClick={() => r.claim_id && navigate(`/claims/${r.claim_id}`)}>
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
