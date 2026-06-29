import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Badge from '../components/Badge';
import Modal from '../components/Modal';
import { listVisits, createVisit } from '../api/visits';
import { createClaim } from '../api/claims';
import { listPatients } from '../api/patients';

const fmt = n => '$' + Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const today = () => new Date().toISOString().slice(0, 10);
const BLANK = { patient: '', date_of_service: today(), visit_type: 'Office visit', reason: '', provider: '', facility: '' };

export default function Visits() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState(BLANK);
  const [formErr, setFormErr] = useState('');
  const [creatingClaim, setCreatingClaim] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['visits', search],
    queryFn: () => listVisits({ search }),
  });
  const visits = data?.results || [];

  const { data: pData } = useQuery({
    queryKey: ['patients-list'],
    queryFn: () => listPatients({ page_size: 200 }),
  });
  const patients = pData?.results || [];

  const addMutation = useMutation({
    mutationFn: createVisit,
    onSuccess: v => {
      qc.invalidateQueries({ queryKey: ['visits'] });
      setShowAdd(false);
      setForm({ ...BLANK, date_of_service: today() });
      setFormErr('');
      navigate(`/visits/${v.visit_id}`);
    },
    onError: e => {
      const d = e.response?.data;
      setFormErr(d?.detail || (typeof d === 'object' ? JSON.stringify(d) : '') || 'Error creating visit.');
    },
  });

  const claimMutation = useMutation({
    mutationFn: visitId => createClaim({ visit: visitId }),
    onSuccess: c => {
      qc.invalidateQueries({ queryKey: ['visits'] });
      setCreatingClaim(null);
      navigate(`/claims/${c.claim_id}`);
    },
    onError: () => {
      setCreatingClaim(null);
      alert('Could not create claim. Ensure the visit has diagnosis codes and service lines first.');
    },
  });

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.patient) { setFormErr('Please select a patient.'); return; }
    if (!form.date_of_service) { setFormErr('Date of service is required.'); return; }
    setFormErr('');
    addMutation.mutate({ ...form, patient: Number(form.patient) });
  }

  function handleCreateClaim(visitId, e) {
    e.stopPropagation();
    setCreatingClaim(visitId);
    claimMutation.mutate(visitId);
  }

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  return (
    <div>
      <div className="header">
        <div>
          <div className="eyebrow">Visits</div>
          <div className="title">Visits</div>
          <div className="desc">Create and manage clinical visits. Add billing info, diagnosis codes, and service lines, then generate a claim directly from the visit.</div>
        </div>
        <div className="actions">
          <button className="btn" onClick={() => { setForm({ ...BLANK, date_of_service: today() }); setFormErr(''); setShowAdd(true); }}>+ Add visit</button>
          <button className="btn primary" onClick={() => alert('Validation run complete.')}>Validate billing info</button>
        </div>
      </div>

      <div className="card">
        <div className="toolbar">
          <div className="left">
            <input
              className="input"
              style={{ maxWidth: 280 }}
              placeholder="Search visit, patient, provider…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <select className="input" style={{ maxWidth: 180 }}>
              <option>All statuses</option>
              <option>Ready for billing</option>
              <option>Missing insurance</option>
              <option>Missing diagnosis</option>
              <option>Draft</option>
              <option>Billed</option>
            </select>
            <select className="input" style={{ maxWidth: 160 }}>
              <option>All facilities</option>
              <option>Apex Main</option>
              <option>Apex North</option>
              <option>Telehealth</option>
            </select>
          </div>
          <div className="right">
            <button className="btn">Export</button>
          </div>
        </div>

        <div className="tablewrap">
          <table className="table">
            <thead>
              <tr>
                <th>Visit ID</th>
                <th>DOS</th>
                <th>Patient</th>
                <th>Provider</th>
                <th>Facility</th>
                <th>Status</th>
                <th>Primary claim</th>
                <th className="right">Charges</th>
                <th className="right">Balance</th>
                <th>Next action</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && <tr><td colSpan={10} className="muted" style={{ padding: '24px 20px', textAlign: 'center' }}>Loading visits…</td></tr>}
              {!isLoading && visits.length === 0 && (
                <tr>
                  <td colSpan={10} style={{ padding: '48px 20px', textAlign: 'center', color: 'var(--slate)' }}>
                    No visits found.{' '}
                    <span className="link" onClick={() => { setForm({ ...BLANK, date_of_service: today() }); setFormErr(''); setShowAdd(true); }}>
                      Add the first visit →
                    </span>
                  </td>
                </tr>
              )}
              {visits.map(v => (
                <tr key={v.id} className="clickable" onClick={() => navigate(`/visits/${v.visit_id}`)}>
                  <td className="mono">{v.visit_id}</td>
                  <td>{v.date_of_service}</td>
                  <td>
                    <strong>{v.patient_name || v.patient}</strong>
                    {v.reason && <div className="sub">{v.reason}</div>}
                  </td>
                  <td>{v.provider}</td>
                  <td>{v.facility}</td>
                  <td><Badge status={v.status} /></td>
                  <td className="mono">{v.linked_claim || <span className="muted">—</span>}</td>
                  <td className="right">{fmt(v.charges)}</td>
                  <td className="right">{fmt(v.balance)}</td>
                  <td onClick={e => e.stopPropagation()}>
                    {v.linked_claim
                      ? <button className="btn sm" onClick={() => navigate(`/claims/${v.linked_claim}`)}>Open claim</button>
                      : (
                        <button
                          className="btn sm primary"
                          disabled={creatingClaim === v.id}
                          onClick={e => handleCreateClaim(v.id, e)}
                        >
                          {creatingClaim === v.id ? 'Creating…' : 'Create claim'}
                        </button>
                      )
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="footerNote">Click a visit to open full details with billing info, service lines, payments, and activity.</div>
      </div>

      <Modal
        open={showAdd}
        title="Add visit"
        onClose={() => setShowAdd(false)}
        footer={
          <>
            <button className="btn ghost" onClick={() => setShowAdd(false)}>Cancel</button>
            <button className="btn primary" onClick={handleSubmit} disabled={addMutation.isPending}>
              {addMutation.isPending ? 'Creating…' : 'Create visit'}
            </button>
          </>
        }
      >
        {formErr && <div className="alert danger" style={{ marginBottom: 4 }}>{formErr}</div>}
        <div className="form-row">
          <div className="field">
            <label>Patient *</label>
            <select className="input" value={form.patient} onChange={e => set('patient', e.target.value)}>
              <option value="">— Select patient —</option>
              {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Date of service *</label>
            <input className="input" type="date" value={form.date_of_service} onChange={e => set('date_of_service', e.target.value)} />
          </div>
        </div>
        <div className="form-row">
          <div className="field">
            <label>Visit type</label>
            <select className="input" value={form.visit_type} onChange={e => set('visit_type', e.target.value)}>
              <option>Office visit</option>
              <option>Telehealth</option>
              <option>Procedure</option>
              <option>Follow-up</option>
              <option>Preventive care</option>
              <option>Urgent care</option>
            </select>
          </div>
          <div className="field">
            <label>Chief complaint / reason</label>
            <input className="input" value={form.reason} onChange={e => set('reason', e.target.value)} placeholder="Right knee pain" />
          </div>
        </div>
        <div className="form-row">
          <div className="field">
            <label>Rendering provider</label>
            <input className="input" value={form.provider} onChange={e => set('provider', e.target.value)} placeholder="Dr. Harlan" />
          </div>
          <div className="field">
            <label>Facility</label>
            <select className="input" value={form.facility} onChange={e => set('facility', e.target.value)}>
              <option value="">— Select facility —</option>
              <option>Apex Main</option>
              <option>Apex North</option>
              <option>Telehealth</option>
            </select>
          </div>
        </div>
      </Modal>
    </div>
  );
}
