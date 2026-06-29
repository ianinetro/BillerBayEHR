import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import Badge from '../components/Badge';
import { getPatient } from '../api/patients';

const fmt = n => '$' + Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const TABS = ['overview', 'demographics', 'insurance', 'visits', 'claims', 'payments', 'activity'];

export default function PatientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tab, setTab] = useState('overview');
  const { data: patient, isLoading } = useQuery({ queryKey: ['patient', id], queryFn: () => getPatient(id) });

  if (isLoading) return <div className="main"><p className="muted">Loading…</p></div>;
  if (!patient) return <div className="main"><p className="muted">Patient not found.</p></div>;

  return (
    <div>
      <div className="breadcrumb"><span className="link" onClick={() => navigate('/patients')}>Patients</span> / {patient.name}</div>
      <div className="header">
        <div>
          <div className="eyebrow">Patient profile</div>
          <div className="title">{patient.name}</div>
          <div className="desc">Patient ID {patient.patient_id} · DOB {patient.dob} · {patient.sex} · Primary {patient.primary_insurance}</div>
        </div>
        <div className="actions">
          <button className="btn" onClick={() => alert('Add visit — coming soon')}>Add visit</button>
          <button className="btn" onClick={() => alert('Eligibility check completed. Medicare active.')}>Verify eligibility</button>
          <button className="btn primary" onClick={() => alert('Patient changes saved.')}>Save changes</button>
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
            {tab === 'overview' && <OverviewTab patient={patient} navigate={navigate} />}
            {tab === 'demographics' && <DemographicsTab patient={patient} />}
            {tab === 'insurance' && <InsuranceTab patient={patient} />}
            {tab === 'visits' && <VisitsTab patientId={patient.patient_id} navigate={navigate} />}
            {tab === 'claims' && <ClaimsTab patientId={patient.patient_id} navigate={navigate} />}
            {tab === 'payments' && <PaymentsTab />}
            {tab === 'activity' && <ActivityTab />}
          </div>
        </div>

        <div className="card pad summary">
          <div className="sectionTitle">Patient summary</div>
          <div className="statusline">
            <Badge status={patient.status} />
            <Badge status={patient.primary_insurance} />
            {patient.balance > 0 && <Badge status="Balance due" />}
          </div>
          <div className="divider" />
          <div className="field"><label>Patient responsibility</label><div className="value right"><strong>{fmt(patient.balance)}</strong></div></div>
          <div className="field"><label>Last eligibility</label><div className="value">06/27/2026 · 271 active</div></div>
          <div className="field"><label>Next best action</label><div className="value">Review open claim BB-2026-000183 and fix subscriber relationship.</div></div>
          <div className="divider" />
          <button className="btn primary" style={{ width: '100%' }} onClick={() => navigate('/claims/BB-2026-000183')}>Open blocking claim</button>
        </div>
      </div>
    </div>
  );
}

function OverviewTab({ patient, navigate }) {
  return (
    <>
      <div className="grid" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
        <div className="alert info"><strong>Identity clean</strong><div className="sub">No duplicate patient found. Demographics last updated 06/27/2026.</div></div>
        <div className="alert warn"><strong>Balance due</strong><div className="sub">{fmt(patient.balance)} patient responsibility remains after last ERA.</div></div>
        <div className="alert danger"><strong>Claim blocked</strong><div className="sub">One claim has validation errors before submission.</div></div>
      </div>
      <div className="divider" />
      <div className="sectionTitle">Related records</div>
      <div className="grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <VisitsTab patientId={patient.patient_id} navigate={navigate} mini />
        <ClaimsTab patientId={patient.patient_id} navigate={navigate} mini />
      </div>
    </>
  );
}

function DemographicsTab({ patient }) {
  const fields = [
    ['First name', patient.name?.split(' ')[0] || ''],
    ['Last name', patient.name?.split(' ')[1] || ''],
    ['DOB', patient.dob], ['Sex', patient.sex],
    ['SSN', '•••-••-2388'], ['Account', patient.account_number],
    ['Primary payer', patient.primary_insurance],
    ['Address', '400 Cypress Ave'], ['City', 'Phoenix'], ['State', 'AZ'], ['Zip', '85001'],
    ['Home phone', '(602) 555-0101'], ['Cell phone', '(602) 555-1189'],
    ['Email', 'patient@example.com'], ['Language', 'English'],
    ['Emergency contact', 'Luis Sanchez'],
  ];
  return (
    <div className="fieldgrid">
      {fields.map(([l, v]) => (
        <div key={l} className="field">
          <label>{l}</label>
          <input className="input" defaultValue={v} style={{ width: '100%' }} />
        </div>
      ))}
    </div>
  );
}

function InsuranceTab({ patient }) {
  const fields = [
    ['Primary insurance', patient.primary_insurance], ['Payer ID', 'MEDICARE-AZ'],
    ['Subscriber ID', '1EG4-TE5-MK73'], ['Group number', '—'],
    ['Relationship to insured', 'Self'], ['Plan name', 'Traditional Medicare'],
    ['Copay', '$20.00'], ['Deductible remaining', fmt(patient.balance)],
    ['Coinsurance', '20%'], ['Authorization number', 'AUTH-2026-103'],
    ['Visits authorized', '12'], ['Effective start', '01/01/2026'],
    ['Secondary insurance', patient.secondary_insurance || '—'],
  ];
  return (
    <>
      <div className="alert info"><strong>Eligibility active</strong><div className="sub">Last 271 check: 06/27/2026 09:12 AM. Copay $20, deductible remaining {fmt(patient.balance)}.</div></div>
      <div className="divider" />
      <div className="fieldgrid">
        {fields.map(([l, v]) => (
          <div key={l} className="field">
            <label>{l}</label>
            <input className="input" defaultValue={v} style={{ width: '100%' }} />
          </div>
        ))}
      </div>
    </>
  );
}

function VisitsTab({ patientId, navigate, mini }) {
  const STATIC = [
    { visit_id: 'V-20491', date_of_service: '06/24/2026', status: 'Ready for billing', charges: 320 },
    { visit_id: 'V-20494', date_of_service: '05/29/2026', status: 'Primary claim submitted', charges: 260 },
  ];
  return (
    <div className="card" style={{ boxShadow: 'none' }}>
      <div className="toolbar"><strong>Visits</strong><button className="btn" onClick={() => alert('Add visit')}>Add visit</button></div>
      <table className="table">
        <thead><tr><th>Visit</th><th>DOS</th><th>Status</th><th className="right">Charges</th></tr></thead>
        <tbody>
          {STATIC.map(v => (
            <tr key={v.visit_id} className="clickable" onClick={() => navigate(`/visits/${v.visit_id}`)}>
              <td className="mono">{v.visit_id}</td><td>{v.date_of_service}</td>
              <td><Badge status={v.status} /></td><td className="right">{fmt(v.charges)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ClaimsTab({ patientId, navigate, mini }) {
  const STATIC = [
    { claim_id: 'BB-2026-000183', status: 'Validation failed', response: 'Missing subscriber relationship', balance: 320 },
  ];
  return (
    <div className="card" style={{ boxShadow: 'none' }}>
      <div className="toolbar"><strong>Claims</strong><button className="btn" onClick={() => navigate('/claims')}>View claims</button></div>
      <table className="table">
        <thead><tr><th>Claim</th><th>Status</th><th>Response</th><th className="right">Balance</th></tr></thead>
        <tbody>
          {STATIC.map(c => (
            <tr key={c.claim_id} className="clickable" onClick={() => navigate(`/claims/${c.claim_id}`)}>
              <td className="mono">{c.claim_id}</td><td><Badge status={c.status} /></td>
              <td>{c.response}</td><td className="right">{fmt(c.balance)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PaymentsTab() {
  return (
    <table className="table">
      <thead><tr><th>Payment</th><th>Source</th><th>Status</th><th className="right">Applied</th></tr></thead>
      <tbody>
        <tr><td className="mono">PMT-9013</td><td>Manual</td><td><Badge status="Reconciled" /></td><td className="right">$50.00</td></tr>
        <tr><td className="mono">PMT-9012</td><td>835 ERA</td><td><Badge status="Posted with warnings" /></td><td className="right">$12,410.45</td></tr>
      </tbody>
    </table>
  );
}

function ActivityTab() {
  const events = [
    { title: 'Eligibility checked', detail: 'IA · 06/27/2026 09:12 AM · 271 response stored.' },
    { title: 'Claim created', detail: 'Lina · BB-2026-000183 from V-20491.' },
    { title: 'Payment posted', detail: 'PMT-9013 card payment applied to visit balance.' },
    { title: 'Sensitive data revealed', detail: 'Admin · SSN last four viewed · audit logged.' },
  ];
  return (
    <div className="timeline">
      {events.map((e, i) => (
        <div key={i} className="event">
          <div className="dot" />
          <div><strong>{e.title}</strong><br /><span>{e.detail}</span></div>
        </div>
      ))}
    </div>
  );
}
