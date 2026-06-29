import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Badge from '../components/Badge';
import Modal from '../components/Modal';
import { getPatient } from '../api/patients';
import { listVisits, createVisit } from '../api/visits';
import { listClaims } from '../api/claims';
import { useToast } from '../components/Toast';

const fmt = n => '$' + Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const TABS = ['overview', 'demographics', 'insurance', 'visits', 'claims', 'payments', 'activity'];
const today = () => new Date().toISOString().slice(0, 10);
const VISIT_BLANK = { date_of_service: today(), visit_type: 'Office visit', reason: '', provider: '', facility: '' };

export default function PatientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const toast = useToast();
  const [tab, setTab] = useState('overview');
  const [showAddVisit, setShowAddVisit] = useState(false);
  const [visitForm, setVisitForm] = useState(VISIT_BLANK);
  const [formErr, setFormErr] = useState('');

  const { data: patient, isLoading } = useQuery({ queryKey: ['patient', id], queryFn: () => getPatient(id) });

  const addVisitMut = useMutation({
    mutationFn: createVisit,
    onSuccess: v => {
      qc.invalidateQueries({ queryKey: ['visits'] });
      setShowAddVisit(false);
      toast.success('Visit created.');
      navigate(`/visits/${v.visit_id}`);
    },
    onError: e => setFormErr(e.response?.data?.detail || 'Error creating visit.'),
  });

  if (isLoading) return <div className="main"><p className="muted">Loading…</p></div>;
  if (!patient) return <div className="main"><p className="muted">Patient not found.</p></div>;

  function openAddVisit() { setVisitForm({ ...VISIT_BLANK, date_of_service: today() }); setFormErr(''); setShowAddVisit(true); }
  function setV(k, v) { setVisitForm(f => ({ ...f, [k]: v })); }

  return (
    <div>
      <div className="breadcrumb"><span className="link" onClick={() => navigate('/patients')}>Patients</span> / {patient.name}</div>
      <div className="header">
        <div>
          <div className="eyebrow">Patient profile</div>
          <div className="title">{patient.name}</div>
          <div className="desc">Patient ID {patient.patient_id} · DOB {patient.dob} · {patient.sex} · Primary {patient.primary_insurance || '—'}</div>
        </div>
        <div className="actions">
          <button className="btn" onClick={openAddVisit}>Add visit</button>
          <button className="btn" onClick={() => toast.info('Eligibility check queued.')}>Verify eligibility</button>
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
            {tab === 'overview' && <OverviewTab patient={patient} navigate={navigate} onAddVisit={openAddVisit} />}
            {tab === 'demographics' && <DemographicsTab patient={patient} />}
            {tab === 'insurance' && <InsuranceTab patient={patient} />}
            {tab === 'visits' && <VisitsTab patientId={patient.id} navigate={navigate} onAddVisit={openAddVisit} />}
            {tab === 'claims' && <ClaimsTab patientId={patient.id} navigate={navigate} />}
            {tab === 'payments' && <PaymentsStatic />}
            {tab === 'activity' && <ActivityStatic />}
          </div>
        </div>

        <div className="card pad summary">
          <div className="sectionTitle">Patient summary</div>
          <div className="statusline">
            <Badge status={patient.status} />
            {patient.primary_insurance && <Badge status={patient.primary_insurance} />}
            {patient.balance > 0 && <Badge status="Balance due" />}
          </div>
          <div className="divider" />
          <div className="field"><label>Patient responsibility</label><div className="value right"><strong>{fmt(patient.balance)}</strong></div></div>
          <div className="field"><label>Last visit</label><div className="value">{patient.last_visit_date || '—'}</div></div>
          <div className="divider" />
          <button className="btn" style={{ width: '100%' }} onClick={openAddVisit}>+ Add visit</button>
        </div>
      </div>

      <Modal
        open={showAddVisit}
        title="Add visit"
        onClose={() => setShowAddVisit(false)}
        footer={
          <>
            <button className="btn ghost" onClick={() => setShowAddVisit(false)}>Cancel</button>
            <button className="btn primary" disabled={addVisitMut.isPending} onClick={() => {
              if (!visitForm.date_of_service) { setFormErr('Date of service is required.'); return; }
              setFormErr('');
              addVisitMut.mutate({ ...visitForm, patient: patient.id });
            }}>
              {addVisitMut.isPending ? 'Creating…' : 'Create visit'}
            </button>
          </>
        }
      >
        {formErr && <div className="alert danger" style={{ marginBottom: 8 }}>{formErr}</div>}
        <div className="form-row">
          <div className="field">
            <label>Date of service *</label>
            <input className="input" type="date" value={visitForm.date_of_service} onChange={e => setV('date_of_service', e.target.value)} />
          </div>
          <div className="field">
            <label>Visit type</label>
            <select className="input" value={visitForm.visit_type} onChange={e => setV('visit_type', e.target.value)}>
              <option>Office visit</option><option>Telehealth</option><option>Procedure</option>
              <option>Follow-up</option><option>Preventive care</option><option>Urgent care</option>
            </select>
          </div>
        </div>
        <div className="form-row">
          <div className="field">
            <label>Chief complaint / reason</label>
            <input className="input" value={visitForm.reason} onChange={e => setV('reason', e.target.value)} placeholder="Right knee pain" />
          </div>
          <div className="field">
            <label>Provider</label>
            <input className="input" value={visitForm.provider} onChange={e => setV('provider', e.target.value)} placeholder="Dr. Harlan" />
          </div>
        </div>
        <div className="field">
          <label>Facility</label>
          <select className="input" value={visitForm.facility} onChange={e => setV('facility', e.target.value)}>
            <option value="">— Select facility —</option>
            <option>Apex Main</option><option>Apex North</option><option>Telehealth</option>
          </select>
        </div>
      </Modal>
    </div>
  );
}

function OverviewTab({ patient, navigate, onAddVisit }) {
  return (
    <>
      <div className="grid" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
        <div className="alert info"><strong>Identity clean</strong><div className="sub">No duplicate patient found.</div></div>
        {patient.balance > 0
          ? <div className="alert warn"><strong>Balance due</strong><div className="sub">{fmt(patient.balance)} patient responsibility.</div></div>
          : <div className="alert info"><strong>No balance</strong><div className="sub">Patient balance is zero.</div></div>}
        <div className="alert info"><strong>Status: {patient.status}</strong><div className="sub">Patient record is active.</div></div>
      </div>
      <div className="divider" />
      <div className="sectionTitle">Related records</div>
      <div className="grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <VisitsTab patientId={patient.id} navigate={navigate} mini onAddVisit={onAddVisit} />
        <ClaimsTab patientId={patient.id} navigate={navigate} mini />
      </div>
    </>
  );
}

function DemographicsTab({ patient }) {
  const parts = (patient.name || '').split(' ');
  const fields = [
    ['First name', parts[0] || ''], ['Last name', parts.slice(1).join(' ') || ''],
    ['DOB', patient.dob || ''], ['Sex', patient.sex || ''],
    ['Account', patient.account_number || ''],
    ['Primary insurance', patient.primary_insurance || ''],
    ['Secondary insurance', patient.secondary_insurance || ''],
  ];
  return (
    <div className="fieldgrid">
      {fields.map(([l, v]) => (
        <div key={l} className="field"><label>{l}</label><input className="input" defaultValue={v} style={{ width: '100%' }} /></div>
      ))}
    </div>
  );
}

function InsuranceTab({ patient }) {
  const fields = [
    ['Primary insurance', patient.primary_insurance || '—'],
    ['Secondary insurance', patient.secondary_insurance || '—'],
    ['Deductible remaining', fmt(patient.balance)],
  ];
  return (
    <>
      <div className="alert info"><strong>Insurance on file</strong><div className="sub">Verify eligibility to get the latest 271 response.</div></div>
      <div className="divider" />
      <div className="fieldgrid">
        {fields.map(([l, v]) => (
          <div key={l} className="field"><label>{l}</label><input className="input" defaultValue={v} style={{ width: '100%' }} /></div>
        ))}
      </div>
    </>
  );
}

function VisitsTab({ patientId, navigate, mini, onAddVisit }) {
  const { data, isLoading } = useQuery({
    queryKey: ['visits', patientId],
    queryFn: () => listVisits({ patient: patientId, page_size: mini ? 5 : 50 }),
  });
  const visits = data?.results || [];
  return (
    <div className={mini ? '' : 'card'} style={mini ? {} : { boxShadow: 'none' }}>
      <div className="toolbar">
        <strong>Visits</strong>
        {onAddVisit && <button className="btn sm" onClick={onAddVisit}>Add visit</button>}
      </div>
      <table className="table">
        <thead><tr><th>Visit</th><th>DOS</th><th>Status</th><th className="right">Charges</th></tr></thead>
        <tbody>
          {isLoading && <tr><td colSpan={4} className="muted" style={{ textAlign: 'center' }}>Loading…</td></tr>}
          {!isLoading && visits.length === 0 && <tr><td colSpan={4} className="muted" style={{ textAlign: 'center' }}>No visits.</td></tr>}
          {visits.map(v => (
            <tr key={v.id} className="clickable" onClick={() => navigate(`/visits/${v.visit_id}`)}>
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
  const { data, isLoading } = useQuery({
    queryKey: ['claims', patientId],
    queryFn: () => listClaims({ patient: patientId, page_size: mini ? 5 : 50 }),
  });
  const claims = data?.results || [];
  return (
    <div className={mini ? '' : 'card'} style={mini ? {} : { boxShadow: 'none' }}>
      <div className="toolbar">
        <strong>Claims</strong>
        <button className="btn sm" onClick={() => navigate('/claims')}>View all claims</button>
      </div>
      <table className="table">
        <thead><tr><th>Claim</th><th>Status</th><th className="right">Balance</th></tr></thead>
        <tbody>
          {isLoading && <tr><td colSpan={3} className="muted" style={{ textAlign: 'center' }}>Loading…</td></tr>}
          {!isLoading && claims.length === 0 && <tr><td colSpan={3} className="muted" style={{ textAlign: 'center' }}>No claims.</td></tr>}
          {claims.map(c => (
            <tr key={c.id} className="clickable" onClick={() => navigate(`/claims/${c.claim_id}`)}>
              <td className="mono">{c.claim_id}</td><td><Badge status={c.status} /></td>
              <td className="right">{fmt(c.balance)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PaymentsStatic() {
  return (
    <table className="table">
      <thead><tr><th>Payment</th><th>Source</th><th>Status</th><th className="right">Applied</th></tr></thead>
      <tbody>
        <tr><td colSpan={4} className="muted" style={{ textAlign: 'center', padding: 16 }}>Payment history loads from the Payments module.</td></tr>
      </tbody>
    </table>
  );
}

function ActivityStatic() {
  return (
    <div className="timeline">
      <div className="event"><div className="dot" /><div><strong>Patient record accessed</strong><span>Activity log available in Audit module.</span></div></div>
    </div>
  );
}
