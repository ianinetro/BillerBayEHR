import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Badge from '../components/Badge';
import { getClaim, validateClaim, submitClaim, updateClaim, generate837p } from '../api/claims';
import { useToast } from '../components/Toast';

const fmt = n => '$' + Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const TABS = ['summary', 'patient', 'diagnosis', 'service lines', 'providers', 'validation', 'submission', 'payments', 'cms preview', 'activity'];

export default function ClaimDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const toast = useToast();
  const [tab, setTab] = useState('summary');

  const { data: claim, isLoading } = useQuery({ queryKey: ['claim', id], queryFn: () => getClaim(id) });

  const validateMut = useMutation({
    mutationFn: () => validateClaim(claim.id),
    onSuccess: r => {
      qc.invalidateQueries({ queryKey: ['claim', id] });
      if (r.validation_status === 'Passed') toast.success('Validation passed — claim is ready to submit.');
      else if (r.validation_status === 'Blocking') toast.error(`Validation failed: ${r.issues?.length || 0} blocking issue(s).`);
      else toast.warn(`Validation warning: ${r.issues?.length || 0} issue(s).`);
      setTab('validation');
    },
    onError: () => toast.error('Validation run failed.'),
  });

  const submitMut = useMutation({
    mutationFn: () => submitClaim(claim.id),
    onSuccess: r => { qc.invalidateQueries({ queryKey: ['claim', id] }); toast.success('Claim submitted successfully.'); setTab('submission'); },
    onError: e => toast.error(e.response?.data?.detail || 'Submission failed.'),
  });

  const saveMut = useMutation({
    mutationFn: data => updateClaim(claim.id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['claim', id] }); toast.success('Claim saved.'); },
    onError: () => toast.error('Save failed.'),
  });

  const ediMut = useMutation({
    mutationFn: () => generate837p(claim.id),
    onSuccess: r => { toast.success('837P generated. Check EDI output below.'); console.log(r.edi); },
    onError: e => toast.warn(e.response?.data?.detail || '837P generation not available.'),
  });

  if (isLoading) return <p className="muted" style={{ padding: 24 }}>Loading…</p>;
  if (!claim) return <p className="muted" style={{ padding: 24 }}>Claim not found.</p>;

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
          <button className="btn" onClick={() => ediMut.mutate()} disabled={ediMut.isPending}>
            {ediMut.isPending ? 'Generating…' : 'Preview 837P'}
          </button>
          <button className="btn" disabled={validateMut.isPending} onClick={() => validateMut.mutate()}>
            {validateMut.isPending ? 'Validating…' : 'Validate'}
          </button>
          <button className="btn" disabled={submitMut.isPending || claim.validation_status === 'Blocking'} onClick={() => submitMut.mutate()}>
            {submitMut.isPending ? 'Submitting…' : 'Submit claim'}
          </button>
          <button className="btn primary" disabled={saveMut.isPending} onClick={() => saveMut.mutate({})}>
            {saveMut.isPending ? 'Saving…' : 'Save claim'}
          </button>
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
          {tab === 'diagnosis' && <DiagnosisTab claim={claim} />}
          {tab === 'service lines' && <ServiceLinesTab claim={claim} />}
          {tab === 'providers' && <ProvidersTab claim={claim} />}
          {tab === 'validation' && <ValidationTab claim={claim} onValidate={() => validateMut.mutate()} loading={validateMut.isPending} />}
          {tab === 'submission' && <SubmissionTab claim={claim} />}
          {tab === 'payments' && <PaymentsStatic />}
          {tab === 'cms preview' && <CmsPreviewTab claim={claim} />}
          {tab === 'activity' && <ActivityStatic />}
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
    { label: '837P submit', sub: claim.submission_status, done: claim.submission_status === 'Submitted' },
    { label: '835/payment', sub: claim.paid > 0 ? 'Received' : 'Pending', done: claim.paid > 0 },
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
            ['Patient', claim.patient_name || claim.patient], ['Linked visit', claim.visit || '—'],
            ['Payer', claim.payer], ['DOS', claim.date_of_service],
            ['Total charges', fmt(claim.charges)], ['Paid amount', fmt(claim.paid)],
            ['Balance', fmt(claim.balance)],
          ].map(([l, v]) => (
            <div key={l} className="field"><label>{l}</label><div className="value">{v}</div></div>
          ))}
        </div>
      </div>
      <div className="card pad">
        <div className="sectionTitle">Claim status</div>
        {claim.validation_status === 'Blocking'
          ? <div className="alert danger"><strong>Blocking validation errors</strong><div className="sub">Fix validation issues before submitting.</div></div>
          : claim.validation_status === 'Passed'
          ? <div className="alert info"><strong>Validation passed</strong><div className="sub">Claim is ready to submit.</div></div>
          : <div className="alert warn"><strong>Validation not run</strong><div className="sub">Run validation before submitting.</div></div>}
        <button className="btn primary" style={{ width: '100%', marginTop: 12 }} onClick={() => setTab('validation')}>
          {claim.validation_status === 'Blocking' ? 'Fix validation issues' : 'Review validation'}
        </button>
      </div>
    </div>
  );
}

function PatientTab({ claim }) {
  const fields = [
    ['Patient', claim.patient_name || claim.patient], ['Linked visit', claim.visit || '—'],
    ['Primary payer', claim.payer], ['Payer ID on file', claim.payer_id_on_file || '—'],
    ['Date of service', claim.date_of_service], ['Claim type', claim.claim_type || '837P'],
  ];
  return (
    <div className="fieldgrid">
      {fields.map(([l, v]) => (
        <div key={l} className="field"><label>{l}</label><input className="input" defaultValue={v} style={{ width: '100%' }} /></div>
      ))}
    </div>
  );
}

function DiagnosisTab({ claim }) {
  return (
    <>
      <div className="sectionTitle">Diagnosis codes</div>
      <div className="alert info"><strong>Smart coding check</strong><div className="sub">ICD validity, laterality, and active-code checks run during validation.</div></div>
      <div style={{ marginTop: 14 }}>
        {claim.visit
          ? <p className="muted">Diagnosis codes are managed on the <strong>Visit</strong> record. Open the visit to add/edit/remove codes.</p>
          : <p className="muted">No linked visit — add diagnosis codes via the Visit detail page.</p>}
      </div>
    </>
  );
}

function ServiceLinesTab({ claim }) {
  return (
    <>
      <div className="sectionTitle">Service lines</div>
      {claim.visit
        ? <p className="muted">Service lines are managed on the <strong>Visit</strong> record. Open the visit to add/edit/remove lines.</p>
        : <p className="muted">No linked visit — add service lines via the Visit detail page.</p>}
      <div style={{ marginTop: 14 }}>
        <div className="alert info"><strong>Auto-totalled</strong><div className="sub">Claim charges are recalculated from visit service lines when the claim is created or updated.</div></div>
      </div>
    </>
  );
}

function ProvidersTab({ claim }) {
  const fields = [
    ['Rendering provider', claim.provider || '—'],
    ['Facility', claim.facility || '—'],
    ['Payer', claim.payer || '—'],
    ['Payer ID on file', claim.payer_id_on_file || '—'],
  ];
  return (
    <div className="fieldgrid">
      {fields.map(([l, v]) => (
        <div key={l} className="field"><label>{l}</label><input className="input" defaultValue={v} style={{ width: '100%' }} /></div>
      ))}
    </div>
  );
}

function ValidationTab({ claim, onValidate, loading }) {
  const issues = claim.validation_issues || [];
  return (
    <>
      {claim.validation_status === 'Passed' && <div className="alert info"><strong>Validation passed</strong><div className="sub">No blocking issues. Claim is ready to submit.</div></div>}
      {claim.validation_status === 'Blocking' && <div className="alert danger"><strong>Blocking errors</strong><div className="sub">{issues.filter(i => i.severity === 'Blocking').length} blocking issue(s) must be resolved before submission.</div></div>}
      {claim.validation_status === 'Needs run' && <div className="alert warn"><strong>Validation not run yet</strong><div className="sub">Click "Run validation" to check this claim.</div></div>}
      <div style={{ marginTop: 14 }}>
        <button className="btn primary" onClick={onValidate} disabled={loading}>{loading ? 'Running…' : 'Run validation'}</button>
      </div>
      {issues.length > 0 && (
        <>
          <div className="divider" />
          <table className="table">
            <thead><tr><th>Severity</th><th>Issue</th><th>Location</th><th>Why it matters</th></tr></thead>
            <tbody>
              {issues.map((iss, i) => (
                <tr key={iss.id || i}>
                  <td><Badge status={iss.severity} /></td>
                  <td>{iss.issue}</td>
                  <td>{iss.location}</td>
                  <td>{iss.why_it_matters}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </>
  );
}

function SubmissionTab({ claim }) {
  const history = claim.submission_history || [];
  return (
    <div className="grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
      <div className="card pad">
        <div className="sectionTitle">Submission history</div>
        {history.length === 0
          ? <p className="muted">No submission history yet.</p>
          : <div className="timeline">
              {history.map((h, i) => (
                <div key={h.id || i} className="event">
                  <div className="dot" />
                  <div><strong>{h.submission_type || 'Submission'}</strong><span>{h.submitted_at?.slice(0, 10)} · {h.status}</span></div>
                </div>
              ))}
            </div>}
      </div>
      <div className="card pad">
        <div className="sectionTitle">EDI transactions</div>
        <table className="table">
          <thead><tr><th>Type</th><th>Status</th></tr></thead>
          <tbody>
            <tr><td>837P</td><td><Badge status={claim.submission_status || 'Not submitted'} /></td></tr>
            <tr><td>999/Acknowledgment</td><td><Badge status="Pending" /></td></tr>
            <tr><td>277CA</td><td><Badge status="Pending" /></td></tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PaymentsStatic() {
  return (
    <table className="table">
      <thead><tr><th>Payment</th><th>Source</th><th>Status</th><th className="right">Applied</th></tr></thead>
      <tbody><tr><td colSpan={4} className="muted" style={{ textAlign: 'center', padding: 16 }}>Payment history available in Payments module.</td></tr></tbody>
    </table>
  );
}

function CmsPreviewTab({ claim }) {
  return (
    <>
      <div className="alert info"><strong>CMS-1500 02/12 preview</strong><div className="sub">This preview is for review/print/download. Editing stays in operational sections above.</div></div>
      <div className="card pad" style={{ marginTop: 14, background: '#fafafa' }}>
        <div style={{ border: '2px solid #999', padding: 20, minHeight: 300, background: 'white' }}>
          <strong>CMS-1500 Preview — {claim.claim_id}</strong>
          <div className="fieldgrid" style={{ marginTop: 14 }}>
            <div className="fakeinput">Patient: {claim.patient_name || claim.patient}</div>
            <div className="fakeinput">Payer: {claim.payer} ({claim.payer_id_on_file})</div>
            <div className="fakeinput">DOS: {claim.date_of_service}</div>
            <div className="fakeinput">Total charges: {fmt(claim.charges)}</div>
            <div className="fakeinput">Provider: {claim.provider}</div>
            <div className="fakeinput">Facility: {claim.facility}</div>
          </div>
        </div>
      </div>
    </>
  );
}

function ActivityStatic() {
  return (
    <div className="timeline">
      <div className="event"><div className="dot" /><div><strong>Claim created</strong><span>Full activity log available in Audit module.</span></div></div>
    </div>
  );
}
