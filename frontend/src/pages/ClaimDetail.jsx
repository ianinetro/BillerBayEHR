import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import Badge from '../components/Badge';
import { getClaim } from '../api/claims';

const fmt = n => '$' + Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const TABS = ['summary', 'patient', 'diagnosis', 'service lines', 'providers', 'validation', 'submission', 'payments', 'cms preview', 'activity'];

export default function ClaimDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tab, setTab] = useState('summary');
  const { data: claim, isLoading } = useQuery({ queryKey: ['claim', id], queryFn: () => getClaim(id) });

  if (isLoading) return <p className="muted">Loading…</p>;
  if (!claim) return <p className="muted">Claim not found.</p>;

  return (
    <div>
      <div className="breadcrumb"><span className="link" onClick={() => navigate('/claims')}>Claims</span> / {claim.claim_id}</div>
      <div className="header">
        <div>
          <div className="eyebrow">Claim composer</div>
          <div className="title">{claim.claim_id}</div>
          <div className="desc">Professional claim · {claim.patient_name || claim.patient} · {claim.payer}</div>
        </div>
        <div className="actions">
          <button className="btn" onClick={() => alert('CMS-1500 preview generated.')}>Preview CMS-1500</button>
          <button className="btn" onClick={() => alert('Claim submitted.')}>Submit claim</button>
          <button className="btn primary" onClick={() => alert('Claim saved.')}>Save claim</button>
        </div>
      </div>

      <div className="card">
        <div className="tabs">
          {TABS.map(t => (
            <button key={t} className={`tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
        <div style={{ padding: 18 }}>
          {tab === 'summary' && <SummaryTab claim={claim} setTab={setTab} />}
          {tab === 'patient' && <PatientTab claim={claim} />}
          {tab === 'diagnosis' && <DiagnosisTab />}
          {tab === 'service lines' && <ServiceLinesTab claim={claim} />}
          {tab === 'providers' && <ProvidersTab claim={claim} />}
          {tab === 'validation' && <ValidationTab claim={claim} />}
          {tab === 'submission' && <SubmissionTab claim={claim} />}
          {tab === 'payments' && <PaymentsTab />}
          {tab === 'cms preview' && <CmsPreviewTab />}
          {tab === 'activity' && <ActivityTab />}
        </div>
      </div>
    </div>
  );
}

function SummaryTab({ claim, setTab }) {
  const nodes = [
    { label: 'Visit created', sub: claim.visit || '—', done: true },
    { label: 'Claim created', sub: claim.created_at?.slice(0, 10) || '—', done: true },
    { label: 'Validation', sub: claim.validation_status, done: claim.validation_status === 'Passed', bad: claim.validation_status === 'Blocking' },
    { label: '837P submit', sub: claim.submission_status, done: false },
    { label: '835/payment', sub: 'Pending', done: false },
  ];
  return (
    <div className="grid" style={{ gridTemplateColumns: '1fr 360px', alignItems: 'start' }}>
      <div>
        <div className="claimflow">
          {nodes.map((n, i) => (
            <React.Fragment key={i}>
              {i > 0 && <span className="arrow">→</span>}
              <div className={`flowNode ${n.done ? 'done' : ''} ${n.bad ? 'bad' : ''}`}>
                {n.label}<br /><span className="sub">{n.sub}</span>
              </div>
            </React.Fragment>
          ))}
        </div>
        <div className="divider" />
        <div className="fieldgrid">
          {[
            ['Claim status', claim.status], ['Claim type', 'Professional / 837P'],
            ['Primary or secondary', 'Primary'], ['Patient', claim.patient_name || claim.patient],
            ['Linked visit', claim.visit || '—'], ['Payer', claim.payer],
            ['DOS', claim.date_of_service], ['Total charges', fmt(claim.charges)],
            ['Paid amount', fmt(claim.paid)], ['Balance', fmt(claim.balance)],
          ].map(([l, v]) => (
            <div key={l} className="field"><label>{l}</label><div className="value">{v}</div></div>
          ))}
        </div>
      </div>
      <div className="card pad">
        <div className="sectionTitle">Blocking reason</div>
        <div className="alert danger">
          <strong>Missing insured relationship</strong>
          <div className="sub">Claim cannot be submitted until subscriber relationship is set for {claim.payer}.</div>
        </div>
        <button className="btn primary" style={{ width: '100%', marginTop: 12 }} onClick={() => setTab('validation')}>Fix validation issue</button>
      </div>
    </div>
  );
}

function PatientTab({ claim }) {
  const fields = [
    ['Patient', claim.patient_name || claim.patient], ['Patient ID', claim.patient],
    ['Patient DOB', '03/14/1978'], ['Insured name', 'Maria Sanchez'],
    ['Relationship to insured', 'Missing'], ['Subscriber ID', '1EG4-TE5-MK73'],
    ['Primary payer', claim.payer], ['Payer ID', claim.payer_id_on_file || 'MEDICARE-AZ'],
    ['Release of info', 'Yes'], ['Signature on file', 'Yes'],
  ];
  return (
    <div className="fieldgrid">
      {fields.map(([l, v]) => (
        <div key={l} className="field"><label>{l}</label><input className="input" defaultValue={v} style={{ width: '100%' }} /></div>
      ))}
    </div>
  );
}

function DiagnosisTab() {
  return (
    <>
      <div className="field">
        <label>Diagnosis list</label>
        <div className="value">
          <span className="badge blueB">A M25.561</span> Right knee pain<br />
          <span className="badge blueB">B M17.11</span> Unilateral primary osteoarthritis, right knee
        </div>
      </div>
      <div className="alert info" style={{ marginTop: 14 }}>
        <strong>Smart coding check</strong>
        <div className="sub">RT modifier agrees with right-side diagnosis. Inactive ICDs and non-primary ICD rules checked before submission.</div>
      </div>
    </>
  );
}

function ServiceLinesTab({ claim }) {
  return (
    <>
      <table className="table">
        <thead><tr><th>CPT</th><th>Description</th><th>Modifiers</th><th>DX pointers</th><th>Units</th><th className="right">Charge</th><th>Validation</th></tr></thead>
        <tbody>
          <tr><td>99214</td><td>Office/outpatient visit est</td><td>25</td><td>A,B</td><td>1</td><td className="right">$180.00</td><td><Badge status="Passed" /></td></tr>
          <tr><td>20610</td><td>Arthrocentesis/injection major joint</td><td>RT</td><td>A,B</td><td>1</td><td className="right">$140.00</td><td><Badge status="Passed" /></td></tr>
        </tbody>
      </table>
      <div className="actions" style={{ marginTop: 12 }}>
        <button className="btn">Add service line</button>
        <button className="btn">Run NCCI-style check</button>
      </div>
    </>
  );
}

function ProvidersTab({ claim }) {
  const fields = [
    ['Rendering provider', 'Dr. Harlan'], ['Rendering NPI', '1740283991'],
    ['Billing provider', 'Apex Family Care LLC'], ['Billing NPI', '1234567893'],
    ['Billing tax ID', '••-•••2388'], ['Facility', claim.facility],
    ['Facility NPI', '1982773220'], ['POS', '11'],
    ['Referring provider', 'Dr. Adams'], ['Prior auth', 'AUTH-2026-103'],
  ];
  return (
    <div className="fieldgrid">
      {fields.map(([l, v]) => (
        <div key={l} className="field"><label>{l}</label><input className="input" defaultValue={v} style={{ width: '100%' }} /></div>
      ))}
    </div>
  );
}

function ValidationTab({ claim }) {
  const [fixed, setFixed] = useState(false);
  return (
    <>
      {!fixed
        ? <div className="alert danger"><strong>Blocking error</strong><div className="sub">Missing insured relationship. Fix: choose Self, Spouse, Child, or Other.</div></div>
        : <div className="alert info"><strong>Validation passed</strong><div className="sub">Relationship set to Self. Claim is ready to submit.</div></div>}
      <div className="divider" />
      <table className="table">
        <thead><tr><th>Severity</th><th>Issue</th><th>Location</th><th>Why it matters</th><th>Fix</th></tr></thead>
        <tbody>
          <tr>
            <td><Badge status={fixed ? 'Passed' : 'Blocking'} /></td>
            <td>Missing insured relationship</td>
            <td>Patient and insured</td>
            <td>Required for 837P subscriber loop</td>
            <td>
              {!fixed
                ? <button className="btn primary" onClick={() => setFixed(true)}>Set to Self</button>
                : <span className="muted">Resolved</span>}
            </td>
          </tr>
          <tr>
            <td><Badge status="Warning" /></td>
            <td>Deductible remaining</td>
            <td>Insurance</td>
            <td>Patient responsibility likely after adjudication</td>
            <td><button className="btn">Acknowledge</button></td>
          </tr>
        </tbody>
      </table>
    </>
  );
}

function SubmissionTab({ claim }) {
  return (
    <div className="grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
      <div className="card pad">
        <div className="sectionTitle">Submission history</div>
        <div className="timeline">
          <div className="event"><div className="dot" /><div><strong>Claim created</strong><span>Lina · {claim.created_at?.slice(0, 10)}</span></div></div>
          <div className="event"><div className="dot" /><div><strong>Validation run</strong><span>System · missing insured relationship.</span></div></div>
        </div>
      </div>
      <div className="card pad">
        <div className="sectionTitle">EDI transactions</div>
        <table className="table">
          <thead><tr><th>Type</th><th>Status</th><th>Control</th></tr></thead>
          <tbody>
            <tr><td>837P</td><td><Badge status="Draft" /></td><td>—</td></tr>
            <tr><td>999</td><td><Badge status="Not submitted" /></td><td>—</td></tr>
            <tr><td>277CA</td><td><Badge status="Not submitted" /></td><td>—</td></tr>
          </tbody>
        </table>
      </div>
    </div>
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

function CmsPreviewTab() {
  return (
    <>
      <div className="alert info"><strong>CMS-1500 02/12 preview</strong><div className="sub">This preview is for review/print/download. Editing stays in operational sections above.</div></div>
      <div className="card pad" style={{ marginTop: 14, background: '#fafafa' }}>
        <div style={{ border: '2px solid #999', padding: 20, minHeight: 300, background: 'white' }}>
          <strong>CMS-1500 Preview</strong>
          <div className="fieldgrid" style={{ marginTop: 14 }}>
            <div className="fakeinput">1a Insured ID: 1EG4-TE5-MK73</div>
            <div className="fakeinput">21 Diagnosis: M25.561, M17.11</div>
            <div className="fakeinput">24D Procedures: 99214-25, 20610-RT</div>
          </div>
        </div>
      </div>
    </>
  );
}

function ActivityTab() {
  return (
    <div className="timeline">
      {[['Claim created', 'Lina · from V-20491.'],
        ['Validation run', 'System · missing insured relationship.'],
        ['Payment posted', 'PMT-9013 card $50.00 applied.'],
        ['Audit log', 'Admin · claim viewed.']].map(([t, d], i) => (
        <div key={i} className="event"><div className="dot" /><div><strong>{t}</strong><br /><span>{d}</span></div></div>
      ))}
    </div>
  );
}
