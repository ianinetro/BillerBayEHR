import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import Badge from '../components/Badge';
import { listVisits } from '../api/visits';

const fmt = n => '$' + Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function Visits() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const { data, isLoading } = useQuery({ queryKey: ['visits', search], queryFn: () => listVisits({ search }) });
  const visits = data?.results || [];

  return (
    <div>
      <div className="header">
        <div>
          <div className="eyebrow">Visits</div>
          <div className="title">Visits</div>
          <div className="desc">Create and edit visits, billing information, billing options, diagnosis/service lines, claim linkage, balances, and notes.</div>
        </div>
        <div className="actions">
          <button className="btn" onClick={() => alert('Add visit — coming soon')}>Add visit</button>
          <button className="btn primary" onClick={() => alert('Selected visits validated. 1 ready for claim creation.')}>Validate billing info</button>
        </div>
      </div>
      <div className="card">
        <div className="toolbar">
          <div className="left">
            <input className="input" placeholder="Search visit, patient, provider, claim…" value={search} onChange={e => setSearch(e.target.value)} />
            <select className="input"><option>All statuses</option><option>Ready for billing</option><option>Missing insurance</option><option>Missing diagnosis</option></select>
            <select className="input"><option>All facilities</option><option>Apex Main</option><option>Apex North</option><option>Telehealth</option></select>
            <button className="btn">Ready for billing</button>
            <button className="btn">Missing diagnosis</button>
          </div>
          <div className="right">
            <button className="btn">Export</button>
          </div>
        </div>
        <div className="tablewrap">
          <table className="table">
            <thead>
              <tr>
                <th>Visit ID</th><th>DOS</th><th>Patient</th><th>Provider</th>
                <th>Facility</th><th>Status</th><th>Primary claim</th>
                <th className="right">Charges</th><th className="right">Balance</th><th>Next action</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && <tr><td colSpan={10} className="muted">Loading…</td></tr>}
              {!isLoading && visits.length === 0 && <tr><td colSpan={10} className="muted">No visits found.</td></tr>}
              {visits.map(v => (
                <tr key={v.id} className="clickable" onClick={() => navigate(`/visits/${v.visit_id}`)}>
                  <td className="mono">{v.visit_id}</td>
                  <td>{v.date_of_service}</td>
                  <td>{v.patient_name || v.patient}<div className="sub">{v.reason}</div></td>
                  <td>{v.provider}</td>
                  <td>{v.facility}</td>
                  <td><Badge status={v.status} /></td>
                  <td className="mono">{v.linked_claim || '—'}</td>
                  <td className="right">{fmt(v.charges)}</td>
                  <td className="right">{fmt(v.balance)}</td>
                  <td>
                    {v.linked_claim
                      ? <button className="btn" onClick={e => { e.stopPropagation(); navigate(`/claims/${v.linked_claim}`); }}>Open claim</button>
                      : <button className="btn" onClick={e => { e.stopPropagation(); alert('Claim draft created.'); }}>Create claim</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="footerNote">Click a visit to open full Visit Detail with billing info, service lines, payments, and activity.</div>
      </div>
    </div>
  );
}
