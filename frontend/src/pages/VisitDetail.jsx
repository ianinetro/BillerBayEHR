import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import Badge from '../components/Badge';
import { getVisit } from '../api/visits';

const fmt = n => '$' + Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const TABS = ['info', 'billing', 'options', 'claim', 'payments', 'activity'];

export default function VisitDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tab, setTab] = useState('info');
  const { data: visit, isLoading } = useQuery({ queryKey: ['visit', id], queryFn: () => getVisit(id) });

  if (isLoading) return <p className="muted">Loading…</p>;
  if (!visit) return <p className="muted">Visit not found.</p>;

  return (
    <div>
      <div className="breadcrumb"><span className="link" onClick={() => navigate('/visits')}>Visits</span> / {visit.visit_id}</div>
      <div className="header">
        <div>
          <div className="eyebrow">Visit detail</div>
          <div className="title">{visit.visit_id} · {visit.patient_name || visit.patient}</div>
          <div className="desc">DOS {visit.date_of_service} · {visit.visit_type} · {visit.provider}</div>
        </div>
        <div className="actions">
          <button className="btn" onClick={() => alert('Billing information validated.')}>Validate billing info</button>
          <button className="btn primary" onClick={() => { alert('Claim draft created.'); navigate('/claims'); }}>Create claim</button>
        </div>
      </div>

      <div className="two">
        <div className="card">
          <div className="tabs">
            {TABS.map(t => (
              <button key={t} className={`tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
          <div style={{ padding: 18 }}>
            {tab === 'info' && <InfoTab visit={visit} />}
            {tab === 'billing' && <BillingTab visit={visit} />}
            {tab === 'options' && <OptionsTab />}
            {tab === 'claim' && <ClaimTab visit={visit} navigate={navigate} />}
            {tab === 'payments' && <PaymentsTab />}
            {tab === 'activity' && <ActivityTab />}
          </div>
        </div>

        <div className="card pad summary">
          <div className="sectionTitle">Visit summary</div>
          <div className="statusline"><Badge status={visit.status} /><Badge status={visit.facility} /></div>
          <div className="divider" />
          <div className="field"><label>Charges</label><div className="value right"><strong>{fmt(visit.charges)}</strong></div></div>
          <div className="field"><label>Balance</label><div className="value right"><strong>{fmt(visit.balance)}</strong></div></div>
          <div className="field"><label>Claim linkage</label><div className="value mono">{visit.linked_claim || '—'}</div></div>
          <div className="divider" />
          <button className="btn" style={{ width: '100%' }} onClick={() => navigate(`/patients/${visit.patient}`)}>Open patient</button>
        </div>
      </div>
    </div>
  );
}

function InfoTab({ visit }) {
  const fields = [
    ['Patient', visit.patient_name || visit.patient], ['Visit date', visit.date_of_service],
    ['Visit type', visit.visit_type], ['Reason', visit.reason],
    ['Chief complaint', visit.chief_complaint || 'Right knee pain'], ['Allergies', visit.allergies || 'NKDA'],
    ['Blood pressure', visit.blood_pressure || '—'], ['Weight', visit.weight || '—'],
    ['Provider', visit.provider], ['Facility', visit.facility],
    ['Status', visit.status], ['Provider notes', visit.provider_notes || '—'],
  ];
  return (
    <div className="fieldgrid">
      {fields.map(([l, v]) => (
        <div key={l} className="field"><label>{l}</label><input className="input" defaultValue={v} style={{ width: '100%' }} /></div>
      ))}
    </div>
  );
}

function BillingTab({ visit }) {
  return (
    <>
      <div className="alert warn"><strong>Line-level coding checks active</strong><div className="sub">Diagnosis pointers, modifier conflicts, inactive CPT/DX, NCCI-style edits run before claim creation.</div></div>
      <div className="divider" />
      <div className="field">
        <label>Diagnosis codes A–L</label>
        <div className="value">
          <span className="badge blueB">A M25.561 Right knee pain</span>{' '}
          <span className="badge blueB">B M17.11 Unilateral primary osteoarthritis, right knee</span>{' '}
          <button className="btn">Add diagnosis</button>
        </div>
      </div>
      <div className="divider" />
      <table className="table">
        <thead><tr><th>From DOS</th><th>To DOS</th><th>POS</th><th>CPT</th><th>Modifiers</th><th>DX pointer</th><th className="right">Charge</th><th>Units</th></tr></thead>
        <tbody>
          <tr><td>{visit.date_of_service}</td><td>{visit.date_of_service}</td><td>11</td><td>99214</td><td>25</td><td>A,B</td><td className="right">$180.00</td><td>1</td></tr>
          <tr><td>{visit.date_of_service}</td><td>{visit.date_of_service}</td><td>11</td><td>20610</td><td>RT</td><td>A,B</td><td className="right">$140.00</td><td>1</td></tr>
        </tbody>
      </table>
      <div className="actions" style={{ marginTop: 12 }}>
        <button className="btn">Add line item</button>
        <button className="btn primary" onClick={() => alert('Charge lines saved.')}>Save billing info</button>
      </div>
    </>
  );
}

function OptionsTab() {
  const fields = [
    ['Referring physician', 'Dr. Adams'], ['Supervising physician', 'Dr. Harlan'],
    ['Billing provider', 'Apex Family Care LLC'], ['Billing NPI', '1234567893'],
    ['Rendering provider', 'Dr. Harlan'], ['POS', '11'],
    ['Employment-related', 'No'], ['Onset date', '06/01/2026'],
    ['Prior authorization', 'AUTH-2026-103'], ['CLIA', '03D1234567'],
    ['Date last seen', '06/24/2026'], ['Original reference number', '—'],
  ];
  return (
    <div className="fieldgrid">
      {fields.map(([l, v]) => (
        <div key={l} className="field"><label>{l}</label><input className="input" defaultValue={v} style={{ width: '100%' }} /></div>
      ))}
    </div>
  );
}

function ClaimTab({ visit, navigate }) {
  return (
    <>
      <div className="alert info">
        <strong>Linked claim</strong>
        <div className="sub">{visit.linked_claim ? `This visit created claim ${visit.linked_claim}.` : 'No claim created yet.'}</div>
      </div>
      {visit.linked_claim && (
        <div className="actions" style={{ marginTop: 14 }}>
          <button className="btn primary" onClick={() => navigate(`/claims/${visit.linked_claim}`)}>Open claim</button>
          <button className="btn">Print billing statement</button>
        </div>
      )}
    </>
  );
}

function PaymentsTab() {
  return (
    <table className="table">
      <thead><tr><th>Payment</th><th>Source</th><th>Status</th><th className="right">Applied</th></tr></thead>
      <tbody><tr><td className="mono">PMT-9013</td><td>Manual</td><td><Badge status="Reconciled" /></td><td className="right">$50.00</td></tr></tbody>
    </table>
  );
}

function ActivityTab() {
  return (
    <div className="timeline">
      {[['Claim created', 'Lina · BB-2026-000183 created from this visit.'],
        ['Billing info saved', 'System · charge lines and diagnosis codes saved.'],
        ['Payment posted', 'PMT-9013 card $50.00 applied.']].map(([t, d], i) => (
        <div key={i} className="event"><div className="dot" /><div><strong>{t}</strong><br /><span>{d}</span></div></div>
      ))}
    </div>
  );
}
