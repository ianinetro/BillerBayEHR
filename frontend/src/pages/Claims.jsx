import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import Badge from '../components/Badge';
import { listClaims } from '../api/claims';

const fmt = n => '$' + Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function Claims() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const { data, isLoading } = useQuery({ queryKey: ['claims', search], queryFn: () => listClaims({ search }) });
  const claims = data?.results || [];

  return (
    <div>
      <div className="header">
        <div>
          <div className="eyebrow">Claims</div>
          <div className="title">Claims</div>
          <div className="desc">View, validate, edit, submit, batch submit, repair rejections, and inspect payment history.</div>
        </div>
        <div className="actions">
          <button className="btn" onClick={() => alert('Batch submit modal — coming soon')}>Batch submit</button>
          <button className="btn primary" onClick={() => alert('Validation run completed. 2 claims blocked, 1 ready.')}>Validate selected</button>
        </div>
      </div>
      <div className="card">
        <div className="toolbar">
          <div className="left">
            <input className="input" placeholder="Search claim, patient, visit, payer…" value={search} onChange={e => setSearch(e.target.value)} />
            <select className="input"><option>All statuses</option><option>Draft</option><option>Validation failed</option><option>Ready to submit</option><option>Rejected</option><option>Partially paid</option></select>
            <button className="btn">Ready to submit</button>
            <button className="btn">Rejected</button>
            <button className="btn">Denied</button>
          </div>
          <div className="right">
            <button className="btn">Export</button>
          </div>
        </div>
        <div className="tablewrap">
          <table className="table">
            <thead>
              <tr>
                <th><input type="checkbox" /></th>
                <th>Claim no.</th><th>DOS</th><th>Patient</th><th>Visit</th>
                <th>Provider</th><th>Payer</th><th>Status</th><th>Validation</th>
                <th>Last response</th><th className="right">Charges</th><th className="right">Balance</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && <tr><td colSpan={13} className="muted">Loading…</td></tr>}
              {!isLoading && claims.length === 0 && <tr><td colSpan={13} className="muted">No claims found.</td></tr>}
              {claims.map(c => (
                <tr key={c.id} className="clickable" onClick={() => navigate(`/claims/${c.claim_id}`)}>
                  <td onClick={e => e.stopPropagation()}><input type="checkbox" /></td>
                  <td className="mono">{c.claim_id}</td>
                  <td>{c.date_of_service}</td>
                  <td>{c.patient_name || c.patient}</td>
                  <td className="mono">{c.visit || '—'}</td>
                  <td>{c.provider}</td>
                  <td>{c.payer}</td>
                  <td><Badge status={c.status} /></td>
                  <td><Badge status={c.validation_status} /></td>
                  <td>{c.last_response}</td>
                  <td className="right">{fmt(c.charges)}</td>
                  <td className="right">{fmt(c.balance)}</td>
                  <td><button className="btn" onClick={e => { e.stopPropagation(); navigate(`/claims/${c.claim_id}`); }}>Open</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="footerNote">Claim IDs use format BB-YYYY-######. Click a row to open the claim composer.</div>
      </div>
    </div>
  );
}
