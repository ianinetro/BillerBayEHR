import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Badge from '../components/Badge';
import Modal from '../components/Modal';
import { getVisit, listDiagnosisLines, createDiagnosisLine, deleteDiagnosisLine, listServiceLines, createServiceLine, deleteServiceLine } from '../api/visits';
import { createClaim, validateClaim } from '../api/claims';
import { useToast } from '../components/Toast';

const fmt = n => '$' + Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const TABS = ['info', 'billing', 'options', 'claim', 'payments', 'activity'];

export default function VisitDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const toast = useToast();
  const [tab, setTab] = useState('info');

  const { data: visit, isLoading } = useQuery({ queryKey: ['visit', id], queryFn: () => getVisit(id) });

  const claimMut = useMutation({
    mutationFn: () => createClaim({ visit: visit.id }),
    onSuccess: c => { qc.invalidateQueries({ queryKey: ['visit', id] }); toast.success('Claim created.'); navigate(`/claims/${c.claim_id}`); },
    onError: () => toast.error('Could not create claim. Ensure diagnosis codes and service lines are added.'),
  });

  const validateMut = useMutation({
    mutationFn: () => validateClaim(visit.linked_claim),
    onSuccess: r => { toast.info(`Validation: ${r.validation_status}. ${r.issues?.length || 0} issue(s).`); },
    onError: () => toast.error('Validation failed — no linked claim found.'),
  });

  if (isLoading) return <p className="muted" style={{ padding: 24 }}>Loading…</p>;
  if (!visit) return <p className="muted" style={{ padding: 24 }}>Visit not found.</p>;

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
          {visit.linked_claim
            ? <button className="btn" disabled={validateMut.isPending} onClick={() => validateMut.mutate()}>
                {validateMut.isPending ? 'Validating…' : 'Validate claim'}
              </button>
            : null}
          {!visit.linked_claim
            ? <button className="btn primary" disabled={claimMut.isPending} onClick={() => claimMut.mutate()}>
                {claimMut.isPending ? 'Creating…' : 'Create claim'}
              </button>
            : <button className="btn primary" onClick={() => navigate(`/claims/${visit.linked_claim}`)}>Open claim</button>}
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
            {tab === 'billing' && <BillingTab visit={visit} toast={toast} qc={qc} />}
            {tab === 'options' && <OptionsTab visit={visit} />}
            {tab === 'claim' && <ClaimTab visit={visit} navigate={navigate} />}
            {tab === 'payments' && <PaymentsStatic />}
            {tab === 'activity' && <ActivityStatic />}
          </div>
        </div>

        <div className="card pad summary">
          <div className="sectionTitle">Visit summary</div>
          <div className="statusline"><Badge status={visit.status} />{visit.facility && <Badge status={visit.facility} />}</div>
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
    ['Visit type', visit.visit_type || '—'], ['Reason', visit.reason || '—'],
    ['Provider', visit.provider || '—'], ['Facility', visit.facility || '—'],
    ['Status', visit.status],
  ];
  return (
    <div className="fieldgrid">
      {fields.map(([l, v]) => (
        <div key={l} className="field"><label>{l}</label><input className="input" defaultValue={v} style={{ width: '100%' }} readOnly /></div>
      ))}
    </div>
  );
}

function BillingTab({ visit, toast, qc }) {
  const [showAddDx, setShowAddDx] = useState(false);
  const [dxForm, setDxForm] = useState({ icd_code: '', description: '', pointer: 'A' });
  const [showAddSvc, setShowAddSvc] = useState(false);
  const [svcForm, setSvcForm] = useState({ cpt_code: '', modifiers: '', charge: '', units: '1' });

  const { data: dxData } = useQuery({ queryKey: ['visit-dx', visit.id], queryFn: () => listDiagnosisLines(visit.id) });
  const dxLines = dxData?.results || (Array.isArray(dxData) ? dxData : []);

  const { data: svcData } = useQuery({ queryKey: ['visit-svc', visit.id], queryFn: () => listServiceLines(visit.id) });
  const svcLines = svcData?.results || (Array.isArray(svcData) ? svcData : []);

  const addDxMut = useMutation({
    mutationFn: () => createDiagnosisLine(visit.id, dxForm),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['visit-dx', visit.id] }); setShowAddDx(false); toast.success('Diagnosis added.'); },
    onError: () => toast.error('Failed to add diagnosis.'),
  });

  const deleteDxMut = useMutation({
    mutationFn: dxId => deleteDiagnosisLine(visit.id, dxId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['visit-dx', visit.id] }); toast.success('Diagnosis removed.'); },
  });

  const addSvcMut = useMutation({
    mutationFn: () => createServiceLine(visit.id, { ...svcForm, charge: Number(svcForm.charge), units: Number(svcForm.units) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['visit-svc', visit.id] }); setShowAddSvc(false); toast.success('Service line added.'); },
    onError: () => toast.error('Failed to add service line.'),
  });

  const deleteSvcMut = useMutation({
    mutationFn: svcId => deleteServiceLine(visit.id, svcId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['visit-svc', visit.id] }); toast.success('Service line removed.'); },
  });

  return (
    <>
      <div className="alert warn"><strong>Line-level coding checks active</strong><div className="sub">Modifier conflicts, inactive CPT/DX, and coding checks run before claim creation.</div></div>
      <div className="divider" />

      <div className="toolbar" style={{ marginBottom: 8 }}>
        <strong>Diagnosis codes</strong>
        <button className="btn sm" onClick={() => setShowAddDx(true)}>+ Add diagnosis</button>
      </div>
      {dxLines.length === 0
        ? <p className="muted">No diagnosis codes. Add at least one before creating a claim.</p>
        : <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
            {dxLines.map((dx, i) => (
              <span key={dx.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <span className="badge blueB">{String.fromCharCode(65 + i)} {dx.icd_code}</span>
                <span style={{ fontSize: 12, color: 'var(--slate)' }}>{dx.description}</span>
                <button className="btn sm danger" onClick={() => deleteDxMut.mutate(dx.id)}>×</button>
              </span>
            ))}
          </div>}

      <div className="divider" />
      <div className="toolbar" style={{ marginBottom: 8 }}>
        <strong>Service lines</strong>
        <button className="btn sm" onClick={() => setShowAddSvc(true)}>+ Add service line</button>
      </div>
      {svcLines.length === 0
        ? <p className="muted">No service lines. Add CPT codes before creating a claim.</p>
        : <table className="table">
            <thead><tr><th>CPT</th><th>Modifiers</th><th>Units</th><th className="right">Charge</th><th></th></tr></thead>
            <tbody>
              {svcLines.map(s => (
                <tr key={s.id}>
                  <td>{s.cpt_code}</td><td>{s.modifiers || '—'}</td><td>{s.units}</td>
                  <td className="right">{fmt(s.charge)}</td>
                  <td><button className="btn sm danger" onClick={() => deleteSvcMut.mutate(s.id)}>Remove</button></td>
                </tr>
              ))}
            </tbody>
          </table>}

      <Modal open={showAddDx} title="Add diagnosis code" onClose={() => setShowAddDx(false)}
        footer={<><button className="btn ghost" onClick={() => setShowAddDx(false)}>Cancel</button><button className="btn primary" onClick={() => addDxMut.mutate()} disabled={addDxMut.isPending}>{addDxMut.isPending ? 'Adding…' : 'Add'}</button></>}>
        <div className="field"><label>ICD-10 code *</label><input className="input" style={{ width: '100%' }} value={dxForm.icd_code} onChange={e => setDxForm(f => ({ ...f, icd_code: e.target.value }))} placeholder="M25.561" autoFocus /></div>
        <div className="field"><label>Description</label><input className="input" style={{ width: '100%' }} value={dxForm.description} onChange={e => setDxForm(f => ({ ...f, description: e.target.value }))} placeholder="Right knee pain" /></div>
      </Modal>

      <Modal open={showAddSvc} title="Add service line" onClose={() => setShowAddSvc(false)}
        footer={<><button className="btn ghost" onClick={() => setShowAddSvc(false)}>Cancel</button><button className="btn primary" onClick={() => addSvcMut.mutate()} disabled={addSvcMut.isPending}>{addSvcMut.isPending ? 'Adding…' : 'Add'}</button></>}>
        <div className="form-row">
          <div className="field"><label>CPT/HCPCS *</label><input className="input" value={svcForm.cpt_code} onChange={e => setSvcForm(f => ({ ...f, cpt_code: e.target.value }))} placeholder="99214" autoFocus /></div>
          <div className="field"><label>Modifiers</label><input className="input" value={svcForm.modifiers} onChange={e => setSvcForm(f => ({ ...f, modifiers: e.target.value }))} placeholder="25 RT" /></div>
        </div>
        <div className="form-row">
          <div className="field"><label>Charge ($) *</label><input className="input" type="number" min="0" step="0.01" value={svcForm.charge} onChange={e => setSvcForm(f => ({ ...f, charge: e.target.value }))} placeholder="180.00" /></div>
          <div className="field"><label>Units</label><input className="input" type="number" min="1" value={svcForm.units} onChange={e => setSvcForm(f => ({ ...f, units: e.target.value }))} /></div>
        </div>
      </Modal>
    </>
  );
}

function OptionsTab({ visit }) {
  const fields = [
    ['Referring physician', visit.referring_provider || '—'],
    ['Billing provider', visit.billing_provider || '—'],
    ['Rendering provider', visit.provider || '—'],
    ['POS', visit.pos || '11'],
    ['Prior authorization', visit.prior_auth || '—'],
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
        <div className="sub">{visit.linked_claim ? `This visit created claim ${visit.linked_claim}.` : 'No claim created yet. Add diagnosis codes and service lines, then click "Create claim".'}</div>
      </div>
      {visit.linked_claim && (
        <div className="actions" style={{ marginTop: 14 }}>
          <button className="btn primary" onClick={() => navigate(`/claims/${visit.linked_claim}`)}>Open claim</button>
        </div>
      )}
    </>
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

function ActivityStatic() {
  return (
    <div className="timeline">
      <div className="event"><div className="dot" /><div><strong>Visit created</strong><span>Activity logged in Audit module.</span></div></div>
    </div>
  );
}
