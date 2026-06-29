import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import Badge from '../components/Badge';
import { listPatients } from '../api/patients';

const fmt = n => '$' + Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function Patients() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const { data, isLoading } = useQuery({ queryKey: ['patients', search], queryFn: () => listPatients({ search }) });
  const patients = data?.results || [];

  return (
    <div>
      <div className="header">
        <div>
          <div className="eyebrow">Patients</div>
          <div className="title">Patients</div>
          <div className="desc">Search, review, and maintain patient identity, demographics, insurance, balances, related visits, claims, payments, notes, and activity.</div>
        </div>
        <div className="actions">
          <button className="btn" onClick={() => alert('Add patient modal — coming soon')}>Add patient</button>
          <button className="btn primary" onClick={() => alert('Eligibility batch started. Results will appear in patient activity.')}>Verify eligibility</button>
        </div>
      </div>
      <div className="card">
        <div className="toolbar">
          <div className="left">
            <input className="input" placeholder="Search name, DOB, account, subscriber ID…" value={search} onChange={e => setSearch(e.target.value)} />
            <select className="input"><option>All statuses</option><option>Active</option><option>Needs review</option><option>Inactive</option></select>
            <select className="input"><option>All payers</option><option>Medicare</option><option>BCBS</option><option>Aetna</option><option>UnitedHealthcare</option></select>
            <button className="btn">Missing insurance</button>
            <button className="btn">Has open claims</button>
          </div>
          <div className="right">
            <button className="btn">Columns</button>
            <button className="btn">Export</button>
          </div>
        </div>
        <div className="tablewrap">
          <table className="table">
            <thead>
              <tr>
                <th>Patient ID</th><th>Patient</th><th>DOB</th><th>Sex</th>
                <th>Primary</th><th>Secondary</th><th>Status</th>
                <th className="right">Balance</th><th>Last visit</th>
                <th>Open claims</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && <tr><td colSpan={11} className="muted">Loading…</td></tr>}
              {!isLoading && patients.length === 0 && <tr><td colSpan={11} className="muted">No patients found.</td></tr>}
              {patients.map(p => (
                <tr key={p.id} className="clickable" onClick={() => navigate(`/patients/${p.patient_id}`)}>
                  <td className="mono">{p.patient_id}</td>
                  <td><strong>{p.name}</strong><div className="sub">Acct {p.account_number}</div></td>
                  <td>{p.dob}</td>
                  <td>{p.sex}</td>
                  <td>{p.primary_insurance}</td>
                  <td>{p.secondary_insurance || '—'}</td>
                  <td><Badge status={p.status} /></td>
                  <td className="right">{fmt(p.balance)}</td>
                  <td>{p.last_visit_date || '—'}</td>
                  <td>—</td>
                  <td><button className="btn" onClick={e => { e.stopPropagation(); navigate(`/patients/${p.patient_id}`); }}>Open</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="footerNote">Showing {patients.length} patient{patients.length !== 1 ? 's' : ''}. Row click opens full patient profile.</div>
      </div>
    </div>
  );
}
