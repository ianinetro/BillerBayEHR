import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Badge from '../components/Badge';
import Modal from '../components/Modal';
import { listPatients, createPatient } from '../api/patients';

const fmt = n => '$' + Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const BLANK = { name: '', dob: '', sex: 'M', status: 'Active', primary_insurance: '', secondary_insurance: '' };

export default function Patients() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState(BLANK);
  const [formErr, setFormErr] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['patients', search, statusFilter],
    queryFn: () => listPatients({ search, status: statusFilter || undefined }),
  });
  const patients = data?.results || [];

  const addMutation = useMutation({
    mutationFn: createPatient,
    onSuccess: p => {
      qc.invalidateQueries({ queryKey: ['patients'] });
      setShowAdd(false);
      setForm(BLANK);
      setFormErr('');
      navigate(`/patients/${p.patient_id}`);
    },
    onError: e => {
      const d = e.response?.data;
      setFormErr(d?.detail || (typeof d === 'object' ? JSON.stringify(d) : '') || 'Error creating patient.');
    },
  });

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim()) { setFormErr('Full name is required.'); return; }
    if (!form.dob) { setFormErr('Date of birth is required.'); return; }
    setFormErr('');
    addMutation.mutate(form);
  }

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  return (
    <div>
      <div className="header">
        <div>
          <div className="eyebrow">Patients</div>
          <div className="title">Patients</div>
          <div className="desc">Search, review, and maintain patient identity, demographics, insurance, balances, visits, claims, payments, and activity.</div>
        </div>
        <div className="actions">
          <button className="btn" onClick={() => { setForm(BLANK); setFormErr(''); setShowAdd(true); }}>+ Add patient</button>
          <button className="btn primary" onClick={() => alert('Eligibility batch started. Results will appear in patient activity.')}>Verify eligibility</button>
        </div>
      </div>

      <div className="card">
        <div className="toolbar">
          <div className="left">
            <input
              className="input"
              style={{ maxWidth: 280 }}
              placeholder="Search name, DOB, account…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <select className="input" style={{ maxWidth: 160 }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="">All statuses</option>
              <option value="Active">Active</option>
              <option value="Needs review">Needs review</option>
              <option value="Inactive">Inactive</option>
            </select>
            <select className="input" style={{ maxWidth: 160 }}>
              <option>All payers</option>
              <option>Medicare</option>
              <option>BCBS</option>
              <option>Aetna</option>
              <option>UnitedHealthcare</option>
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
                <th>Patient ID</th>
                <th>Patient</th>
                <th>DOB</th>
                <th>Sex</th>
                <th>Primary insurance</th>
                <th>Secondary</th>
                <th>Status</th>
                <th className="right">Balance</th>
                <th>Last visit</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && <tr><td colSpan={10} className="muted" style={{ padding: '24px 20px', textAlign: 'center' }}>Loading patients…</td></tr>}
              {!isLoading && patients.length === 0 && (
                <tr>
                  <td colSpan={10} style={{ padding: '48px 20px', textAlign: 'center', color: 'var(--slate)' }}>
                    No patients found.{' '}
                    <span className="link" onClick={() => { setForm(BLANK); setFormErr(''); setShowAdd(true); }}>
                      Add the first patient →
                    </span>
                  </td>
                </tr>
              )}
              {patients.map(p => (
                <tr key={p.id} className="clickable" onClick={() => navigate(`/patients/${p.patient_id}`)}>
                  <td className="mono">{p.patient_id}</td>
                  <td>
                    <strong>{p.name}</strong>
                    {p.account_number && <div className="sub">Acct {p.account_number}</div>}
                  </td>
                  <td>{p.dob}</td>
                  <td>{p.sex}</td>
                  <td>{p.primary_insurance || <span className="muted">—</span>}</td>
                  <td>{p.secondary_insurance || <span className="muted">—</span>}</td>
                  <td><Badge status={p.status} /></td>
                  <td className="right">{fmt(p.balance)}</td>
                  <td>{p.last_visit_date || <span className="muted">—</span>}</td>
                  <td>
                    <button className="btn sm" onClick={e => { e.stopPropagation(); navigate(`/patients/${p.patient_id}`); }}>
                      Open
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="footerNote">
          {isLoading ? 'Loading…' : `${patients.length} patient${patients.length !== 1 ? 's' : ''}. Click a row to open the full patient profile.`}
        </div>
      </div>

      <Modal
        open={showAdd}
        title="Add patient"
        onClose={() => setShowAdd(false)}
        footer={
          <>
            <button className="btn ghost" onClick={() => setShowAdd(false)}>Cancel</button>
            <button className="btn primary" onClick={handleSubmit} disabled={addMutation.isPending}>
              {addMutation.isPending ? 'Creating…' : 'Create patient'}
            </button>
          </>
        }
      >
        {formErr && <div className="alert danger" style={{ marginBottom: 4 }}>{formErr}</div>}
        <div className="form-row">
          <div className="field">
            <label>Full name *</label>
            <input className="input" value={form.name} onChange={e => set('name', e.target.value)} placeholder="Maria Sanchez" autoFocus />
          </div>
          <div className="field">
            <label>Date of birth *</label>
            <input className="input" type="date" value={form.dob} onChange={e => set('dob', e.target.value)} />
          </div>
        </div>
        <div className="form-row">
          <div className="field">
            <label>Sex</label>
            <select className="input" value={form.sex} onChange={e => set('sex', e.target.value)}>
              <option value="M">Male</option>
              <option value="F">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div className="field">
            <label>Status</label>
            <select className="input" value={form.status} onChange={e => set('status', e.target.value)}>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Needs review">Needs review</option>
            </select>
          </div>
        </div>
        <div className="form-row">
          <div className="field">
            <label>Primary insurance</label>
            <input className="input" value={form.primary_insurance} onChange={e => set('primary_insurance', e.target.value)} placeholder="Medicare" />
          </div>
          <div className="field">
            <label>Secondary insurance</label>
            <input className="input" value={form.secondary_insurance} onChange={e => set('secondary_insurance', e.target.value)} placeholder="Optional" />
          </div>
        </div>
      </Modal>
    </div>
  );
}
