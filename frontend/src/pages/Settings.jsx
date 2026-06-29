import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Badge from '../components/Badge';
import Modal from '../components/Modal';
import { useToast } from '../components/Toast';
import {
  getPractice, updatePractice,
  listProviders, createProvider, updateProvider, deleteProvider,
  listBillingProviders, createBillingProvider,
  listFacilities, createFacility, updateFacility, deleteFacility,
  listPayers, createPayer, updatePayer, deletePayer,
  listCPTCodes, createCPTCode, updateCPTCode,
  listDiagnosisCodes, createDiagnosisCode,
  listChartAccounts,
  getClaimDefaults, updateClaimDefaults,
  listUsers, createUser,
} from '../api/settings';

const GROUPS = ['practice setup', 'users and access', 'providers', 'billing providers', 'facilities', 'payers', 'CPT codes', 'diagnosis codes', 'chart accounts', 'claim defaults', 'security'];

export default function Settings() {
  const [tab, setTab] = useState('practice setup');
  const toast = useToast();

  return (
    <div>
      <div className="header">
        <div>
          <div className="eyebrow">Settings</div>
          <div className="title">Settings and master data</div>
          <div className="desc">Manage master data with downstream impact on claims, validation, payment posting, and access.</div>
        </div>
        <div className="actions">
          <button className="btn">Import</button>
        </div>
      </div>

      <div className="two">
        <div className="card">
          <div className="tabs" style={{ flexWrap: 'wrap' }}>
            {GROUPS.map(g => (
              <button key={g} className={`tab ${tab === g ? 'active' : ''}`} onClick={() => setTab(g)}>
                {g.charAt(0).toUpperCase() + g.slice(1)}
              </button>
            ))}
          </div>
          <div style={{ padding: 18 }}>
            {tab === 'practice setup' && <PracticeSetup toast={toast} />}
            {tab === 'users and access' && <UsersTab />}
            {tab === 'providers' && <ProvidersTab toast={toast} />}
            {tab === 'billing providers' && <BillingProvidersTab toast={toast} />}
            {tab === 'facilities' && <FacilitiesTab toast={toast} />}
            {tab === 'payers' && <PayersTab toast={toast} />}
            {tab === 'CPT codes' && <CPTTab toast={toast} />}
            {tab === 'diagnosis codes' && <DiagnosisTab toast={toast} />}
            {tab === 'chart accounts' && <ChartTab />}
            {tab === 'claim defaults' && <ClaimDefaultsTab toast={toast} />}
            {tab === 'security' && <SecurityTab />}
          </div>
        </div>

        <div className="card pad summary">
          <div className="sectionTitle">Downstream impact</div>
          <div className="sub">Changing payers, providers, facilities, CPT codes, billing provider NPI, or auto-submit rules can affect claim validation, submission, payment posting, and audit review.</div>
          <div className="divider" />
          <div className="timeline">
            <div className="event"><div className="dot" /><div><strong>Audit required</strong><span>All setting changes are logged with before/after values.</span></div></div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ----- Shared helpers ----- */

function FieldGrid({ fields, onSave }) {
  return (
    <div>
      <div className="fieldgrid">
        {fields.map(([l, v, key, onChange]) => (
          <div key={l} className="field">
            <label>{l}</label>
            <input className="input" value={v} onChange={e => onChange && onChange(e.target.value)} style={{ width: '100%' }} />
          </div>
        ))}
      </div>
      {onSave && (
        <div style={{ marginTop: 14 }}>
          <button className="btn primary" onClick={onSave}>Save changes</button>
        </div>
      )}
    </div>
  );
}

function CrudTable({ headers, rows, onAdd, addLabel = 'Add', onEdit, onDelete, loading }) {
  return (
    <div>
      <div className="toolbar" style={{ marginBottom: 12 }}>
        <div />
        {onAdd && <button className="btn primary" onClick={onAdd}>+ {addLabel}</button>}
      </div>
      <table className="table">
        <thead>
          <tr>
            {headers.map(h => <th key={h}>{h}</th>)}
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {loading && <tr><td colSpan={headers.length + 1} className="muted" style={{ textAlign: 'center', padding: '16px' }}>Loading…</td></tr>}
          {!loading && rows.length === 0 && (
            <tr><td colSpan={headers.length + 1} className="muted" style={{ textAlign: 'center', padding: '16px' }}>No records. {addLabel && `Click "+ ${addLabel}" to create the first.`}</td></tr>
          )}
          {rows.map((r, i) => (
            <tr key={r._id || i}>
              {r._cells.map((c, j) => <td key={j}>{c}</td>)}
              <td>
                {onEdit && <button className="btn sm" onClick={() => onEdit(r._raw)} style={{ marginRight: 6 }}>Edit</button>}
                {onDelete && <button className="btn sm danger" onClick={() => onDelete(r._raw.id)}>Delete</button>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ----- Practice Setup ----- */
function PracticeSetup({ toast }) {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['practice'], queryFn: getPractice });
  const mut = useMutation({
    mutationFn: d => updatePractice(d.id, d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['practice'] }); toast.success('Practice settings saved.'); },
    onError: () => toast.error('Failed to save practice settings.'),
  });
  const [form, setForm] = React.useState(null);
  React.useEffect(() => { if (data && !form) setForm(data); }, [data]);
  if (isLoading) return <p className="muted">Loading…</p>;
  if (!form) return <p className="muted">No practice record found.</p>;
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  return (
    <FieldGrid
      fields={[
        ['Company name', form.company_name || '', 'company_name', v => set('company_name', v)],
        ['Phone', form.phone || '', 'phone', v => set('phone', v)],
        ['Fax', form.fax || '', 'fax', v => set('fax', v)],
        ['Address', form.address || '', 'address', v => set('address', v)],
        ['City', form.city || '', 'city', v => set('city', v)],
        ['State', form.state || '', 'state', v => set('state', v)],
        ['Zip', form.zip || '', 'zip', v => set('zip', v)],
        ['NPI', form.npi || '', 'npi', v => set('npi', v)],
        ['Tax ID', form.tax_id || '', 'tax_id', v => set('tax_id', v)],
      ]}
      onSave={() => mut.mutate(form)}
    />
  );
}

/* ----- Providers ----- */
const PROVIDER_BLANK = { name: '', npi: '', taxonomy: '', default_facility: '', status: 'Active' };
function ProvidersTab({ toast }) {
  const qc = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(PROVIDER_BLANK);
  const { data, isLoading } = useQuery({ queryKey: ['providers'], queryFn: () => listProviders({ page_size: 200 }) });
  const items = data?.results || [];
  const saveMut = useMutation({
    mutationFn: d => editing ? updateProvider(editing.id, d) : createProvider(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['providers'] }); setShowAdd(false); setEditing(null); toast.success(editing ? 'Provider updated.' : 'Provider created.'); },
    onError: () => toast.error('Failed to save provider.'),
  });
  const deleteMut = useMutation({
    mutationFn: deleteProvider,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['providers'] }); toast.success('Provider deleted.'); },
    onError: () => toast.error('Failed to delete provider.'),
  });
  function openEdit(item) { setEditing(item); setForm({ name: item.name, npi: item.npi, taxonomy: item.taxonomy || '', default_facility: item.default_facility || '', status: item.status }); setShowAdd(true); }
  function openAdd() { setEditing(null); setForm(PROVIDER_BLANK); setShowAdd(true); }
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  return (
    <>
      <CrudTable
        headers={['Name', 'NPI', 'Taxonomy', 'Facility', 'Status']}
        loading={isLoading}
        rows={items.map(p => ({ _id: p.id, _raw: p, _cells: [p.name, p.npi, p.taxonomy || '—', p.default_facility || '—', <Badge key="s" status={p.status} />] }))}
        onAdd={openAdd} addLabel="Provider"
        onEdit={openEdit}
        onDelete={id => { if (window.confirm('Delete this provider?')) deleteMut.mutate(id); }}
      />
      <Modal open={showAdd} title={editing ? 'Edit provider' : 'Add provider'} onClose={() => setShowAdd(false)}
        footer={<><button className="btn ghost" onClick={() => setShowAdd(false)}>Cancel</button><button className="btn primary" onClick={() => saveMut.mutate(form)} disabled={saveMut.isPending}>{saveMut.isPending ? 'Saving…' : 'Save'}</button></>}>
        {['name', 'npi', 'taxonomy', 'default_facility'].map(k => (
          <div className="field" key={k}><label>{k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</label><input className="input" style={{ width: '100%' }} value={form[k]} onChange={e => set(k, e.target.value)} /></div>
        ))}
      </Modal>
    </>
  );
}

/* ----- Billing Providers ----- */
const BP_BLANK = { name: '', group_npi: '', tax_id: '', organization_type: 'Group', status: 'Active' };
function BillingProvidersTab({ toast }) {
  const qc = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState(BP_BLANK);
  const { data, isLoading } = useQuery({ queryKey: ['billing-providers'], queryFn: () => listBillingProviders({ page_size: 200 }) });
  const items = data?.results || [];
  const saveMut = useMutation({
    mutationFn: createBillingProvider,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['billing-providers'] }); setShowAdd(false); toast.success('Billing provider created.'); },
    onError: () => toast.error('Failed to save.'),
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  return (
    <>
      <CrudTable
        headers={['Name', 'Group NPI', 'Tax ID', 'Org type', 'Status']}
        loading={isLoading}
        rows={items.map(p => ({ _id: p.id, _raw: p, _cells: [p.name, p.group_npi || '—', p.tax_id || '—', p.organization_type || '—', <Badge key="s" status={p.status} />] }))}
        onAdd={() => { setForm(BP_BLANK); setShowAdd(true); }} addLabel="Billing Provider"
      />
      <Modal open={showAdd} title="Add billing provider" onClose={() => setShowAdd(false)}
        footer={<><button className="btn ghost" onClick={() => setShowAdd(false)}>Cancel</button><button className="btn primary" onClick={() => saveMut.mutate(form)} disabled={saveMut.isPending}>{saveMut.isPending ? 'Saving…' : 'Save'}</button></>}>
        {['name', 'group_npi', 'tax_id', 'organization_type'].map(k => (
          <div className="field" key={k}><label>{k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</label><input className="input" style={{ width: '100%' }} value={form[k]} onChange={e => set(k, e.target.value)} /></div>
        ))}
      </Modal>
    </>
  );
}

/* ----- Facilities ----- */
const FAC_BLANK = { name: '', npi: '', address: '', status: 'Active' };
function FacilitiesTab({ toast }) {
  const qc = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(FAC_BLANK);
  const { data, isLoading } = useQuery({ queryKey: ['facilities'], queryFn: () => listFacilities({ page_size: 200 }) });
  const items = data?.results || [];
  const saveMut = useMutation({
    mutationFn: d => editing ? updateFacility(editing.id, d) : createFacility(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['facilities'] }); setShowAdd(false); setEditing(null); toast.success('Facility saved.'); },
    onError: () => toast.error('Failed to save facility.'),
  });
  const deleteMut = useMutation({
    mutationFn: deleteFacility,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['facilities'] }); toast.success('Facility deleted.'); },
    onError: () => toast.error('Failed to delete.'),
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  function openEdit(item) { setEditing(item); setForm({ name: item.name, npi: item.npi || '', address: item.address || '', status: item.status }); setShowAdd(true); }
  return (
    <>
      <CrudTable
        headers={['Name', 'NPI', 'Address', 'Status']}
        loading={isLoading}
        rows={items.map(f => ({ _id: f.id, _raw: f, _cells: [f.name, f.npi || '—', f.address || '—', <Badge key="s" status={f.status} />] }))}
        onAdd={() => { setEditing(null); setForm(FAC_BLANK); setShowAdd(true); }} addLabel="Facility"
        onEdit={openEdit}
        onDelete={id => { if (window.confirm('Delete this facility?')) deleteMut.mutate(id); }}
      />
      <Modal open={showAdd} title={editing ? 'Edit facility' : 'Add facility'} onClose={() => setShowAdd(false)}
        footer={<><button className="btn ghost" onClick={() => setShowAdd(false)}>Cancel</button><button className="btn primary" onClick={() => saveMut.mutate(form)} disabled={saveMut.isPending}>{saveMut.isPending ? 'Saving…' : 'Save'}</button></>}>
        {['name', 'npi', 'address'].map(k => (
          <div className="field" key={k}><label>{k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</label><input className="input" style={{ width: '100%' }} value={form[k]} onChange={e => set(k, e.target.value)} /></div>
        ))}
      </Modal>
    </>
  );
}

/* ----- Payers ----- */
const PAYER_BLANK = { name: '', payer_id: '', submission_method: 'Clearinghouse', timely_filing_days: 365, status: 'Active' };
function PayersTab({ toast }) {
  const qc = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(PAYER_BLANK);
  const { data, isLoading } = useQuery({ queryKey: ['payers'], queryFn: () => listPayers({ page_size: 200 }) });
  const items = data?.results || [];
  const saveMut = useMutation({
    mutationFn: d => editing ? updatePayer(editing.id, d) : createPayer(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['payers'] }); setShowAdd(false); setEditing(null); toast.success('Payer saved.'); },
    onError: () => toast.error('Failed to save payer.'),
  });
  const deleteMut = useMutation({
    mutationFn: deletePayer,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['payers'] }); toast.success('Payer deleted.'); },
    onError: () => toast.error('Failed to delete.'),
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  function openEdit(item) { setEditing(item); setForm({ name: item.name, payer_id: item.payer_id || '', submission_method: item.submission_method || 'Clearinghouse', timely_filing_days: item.timely_filing_days || 365, status: item.status }); setShowAdd(true); }
  return (
    <>
      <CrudTable
        headers={['Name', 'Payer ID', 'Submission', 'TFL days', 'Status']}
        loading={isLoading}
        rows={items.map(p => ({ _id: p.id, _raw: p, _cells: [p.name, p.payer_id || '—', p.submission_method || '—', p.timely_filing_days || '—', <Badge key="s" status={p.status} />] }))}
        onAdd={() => { setEditing(null); setForm(PAYER_BLANK); setShowAdd(true); }} addLabel="Payer"
        onEdit={openEdit}
        onDelete={id => { if (window.confirm('Delete this payer?')) deleteMut.mutate(id); }}
      />
      <Modal open={showAdd} title={editing ? 'Edit payer' : 'Add payer'} onClose={() => setShowAdd(false)}
        footer={<><button className="btn ghost" onClick={() => setShowAdd(false)}>Cancel</button><button className="btn primary" onClick={() => saveMut.mutate(form)} disabled={saveMut.isPending}>{saveMut.isPending ? 'Saving…' : 'Save'}</button></>}>
        {[['name', 'Name'], ['payer_id', 'Payer ID'], ['submission_method', 'Submission method'], ['timely_filing_days', 'Timely filing days']].map(([k, label]) => (
          <div className="field" key={k}><label>{label}</label><input className="input" style={{ width: '100%' }} value={form[k]} onChange={e => set(k, e.target.value)} /></div>
        ))}
      </Modal>
    </>
  );
}

/* ----- CPT Codes ----- */
const CPT_BLANK = { code: '', description: '', default_pos: '11', default_charge: '', status: 'Active' };
function CPTTab({ toast }) {
  const qc = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(CPT_BLANK);
  const [search, setSearch] = useState('');
  const { data, isLoading } = useQuery({ queryKey: ['cpt-codes', search], queryFn: () => listCPTCodes({ search: search || undefined, page_size: 200 }) });
  const items = data?.results || [];
  const saveMut = useMutation({
    mutationFn: d => editing ? updateCPTCode(editing.id, d) : createCPTCode(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['cpt-codes'] }); setShowAdd(false); setEditing(null); toast.success('CPT code saved.'); },
    onError: () => toast.error('Failed to save CPT code.'),
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  function openEdit(item) { setEditing(item); setForm({ code: item.code, description: item.description || '', default_pos: item.default_pos || '11', default_charge: item.default_charge || '', status: item.status }); setShowAdd(true); }
  return (
    <>
      <div className="toolbar" style={{ marginBottom: 12 }}>
        <input className="input" placeholder="Search CPT/HCPCS…" style={{ maxWidth: 240 }} value={search} onChange={e => setSearch(e.target.value)} />
        <button className="btn primary" onClick={() => { setEditing(null); setForm(CPT_BLANK); setShowAdd(true); }}>+ CPT code</button>
      </div>
      <CrudTable
        headers={['CPT/HCPCS', 'Description', 'Default POS', 'Default charge', 'Status']}
        loading={isLoading}
        rows={items.map(c => ({ _id: c.id, _raw: c, _cells: [c.code, c.description || '—', c.default_pos || '11', c.default_charge ? `$${c.default_charge}` : '—', <Badge key="s" status={c.status} />] }))}
        onEdit={openEdit}
      />
      <Modal open={showAdd} title={editing ? 'Edit CPT code' : 'Add CPT code'} onClose={() => setShowAdd(false)}
        footer={<><button className="btn ghost" onClick={() => setShowAdd(false)}>Cancel</button><button className="btn primary" onClick={() => saveMut.mutate(form)} disabled={saveMut.isPending}>{saveMut.isPending ? 'Saving…' : 'Save'}</button></>}>
        {[['code', 'CPT/HCPCS code'], ['description', 'Description'], ['default_pos', 'Default POS'], ['default_charge', 'Default charge']].map(([k, label]) => (
          <div className="field" key={k}><label>{label}</label><input className="input" style={{ width: '100%' }} value={form[k]} onChange={e => set(k, e.target.value)} /></div>
        ))}
      </Modal>
    </>
  );
}

/* ----- Diagnosis Codes ----- */
const DX_BLANK = { code_type: 'ICD-10', code: '', description: '', billable: true, status: 'Active' };
function DiagnosisTab({ toast }) {
  const qc = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState(DX_BLANK);
  const [search, setSearch] = useState('');
  const { data, isLoading } = useQuery({ queryKey: ['dx-codes', search], queryFn: () => listDiagnosisCodes({ search: search || undefined, page_size: 200 }) });
  const items = data?.results || [];
  const saveMut = useMutation({
    mutationFn: createDiagnosisCode,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['dx-codes'] }); setShowAdd(false); toast.success('Diagnosis code added.'); },
    onError: () => toast.error('Failed to save diagnosis code.'),
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  return (
    <>
      <div className="toolbar" style={{ marginBottom: 12 }}>
        <input className="input" placeholder="Search ICD-10 codes…" style={{ maxWidth: 240 }} value={search} onChange={e => setSearch(e.target.value)} />
        <button className="btn primary" onClick={() => { setForm(DX_BLANK); setShowAdd(true); }}>+ Diagnosis code</button>
      </div>
      <CrudTable
        headers={['Code type', 'Code', 'Description', 'Billable', 'Status']}
        loading={isLoading}
        rows={items.map(d => ({ _id: d.id, _raw: d, _cells: [d.code_type || 'ICD-10', d.code, d.description || '—', d.billable ? 'Yes' : 'No', <Badge key="s" status={d.status} />] }))}
      />
      <Modal open={showAdd} title="Add diagnosis code" onClose={() => setShowAdd(false)}
        footer={<><button className="btn ghost" onClick={() => setShowAdd(false)}>Cancel</button><button className="btn primary" onClick={() => saveMut.mutate(form)} disabled={saveMut.isPending}>{saveMut.isPending ? 'Saving…' : 'Save'}</button></>}>
        {[['code', 'ICD-10 code'], ['description', 'Description']].map(([k, label]) => (
          <div className="field" key={k}><label>{label}</label><input className="input" style={{ width: '100%' }} value={form[k]} onChange={e => set(k, e.target.value)} /></div>
        ))}
      </Modal>
    </>
  );
}

/* ----- Chart Accounts ----- */
function ChartTab() {
  const { data, isLoading } = useQuery({ queryKey: ['chart-accounts'], queryFn: () => listChartAccounts({ page_size: 200 }) });
  const items = data?.results || [];
  return (
    <CrudTable
      headers={['Account ID', 'Type', 'Description', 'Transaction type', 'Status']}
      loading={isLoading}
      rows={items.map(a => ({ _id: a.id, _raw: a, _cells: [a.account_number || a.id, a.account_type || '—', a.description || '—', a.transaction_type || '—', <Badge key="s" status={a.status} />] }))}
    />
  );
}

/* ----- Claim Defaults ----- */
function ClaimDefaultsTab({ toast }) {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['claim-defaults'], queryFn: getClaimDefaults });
  const [form, setForm] = React.useState(null);
  React.useEffect(() => { if (data && !form) setForm(Array.isArray(data) ? data[0] : data); }, [data]);
  const mut = useMutation({
    mutationFn: d => updateClaimDefaults(d.id, d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['claim-defaults'] }); toast.success('Claim defaults saved.'); },
    onError: () => toast.error('Failed to save claim defaults.'),
  });
  if (isLoading) return <p className="muted">Loading…</p>;
  if (!form) return <p className="muted">No claim defaults configured.</p>;
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  return (
    <FieldGrid
      fields={[
        ['Default facility', form.default_facility || '', 'default_facility', v => set('default_facility', v)],
        ['Default billing provider', form.default_billing_provider || '', 'default_billing_provider', v => set('default_billing_provider', v)],
        ['Default POS', form.default_pos || '11', 'default_pos', v => set('default_pos', v)],
        ['Auto-submit claims', form.auto_submit ? 'On' : 'Off', 'auto_submit', null],
        ['Claim form version', form.claim_form_version || 'CMS-1500 02/12', 'claim_form_version', v => set('claim_form_version', v)],
      ]}
      onSave={() => mut.mutate(form)}
    />
  );
}

/* ----- Users ----- */
const USER_BLANK = { username: '', email: '', password: '', role: 'Billing team member', office_access: '', status: 'Active' };
function UsersTab() {
  const qc = useQueryClient();
  const toast = useToast();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState(USER_BLANK);
  const [formErr, setFormErr] = useState('');
  const { data, isLoading } = useQuery({ queryKey: ['users'], queryFn: () => listUsers({ page_size: 200 }) });
  const items = data?.results || [];
  const saveMut = useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      setShowAdd(false);
      setForm(USER_BLANK);
      setFormErr('');
      toast.success('User created.');
    },
    onError: e => {
      const d = e.response?.data;
      setFormErr(d?.detail || (typeof d === 'object' ? JSON.stringify(d) : '') || 'Failed to create user.');
    },
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  return (
    <>
      <CrudTable
        headers={['Username', 'Email', 'Role', 'Status', 'Last login']}
        loading={isLoading}
        rows={items.map(u => ({
          _id: u.id, _raw: u,
          _cells: [
            u.username,
            u.email || '—',
            u.role || '—',
            <Badge key="s" status={u.status || 'Active'} />,
            u.last_login ? new Date(u.last_login).toLocaleDateString() : '—',
          ],
        }))}
        onAdd={() => { setForm(USER_BLANK); setFormErr(''); setShowAdd(true); }}
        addLabel="User"
      />
      <Modal open={showAdd} title="Add user" onClose={() => setShowAdd(false)}
        footer={<><button className="btn ghost" onClick={() => setShowAdd(false)}>Cancel</button><button className="btn primary" onClick={() => { if (!form.username.trim()) { setFormErr('Username is required.'); return; } if (!form.password) { setFormErr('Password is required.'); return; } setFormErr(''); saveMut.mutate(form); }} disabled={saveMut.isPending}>{saveMut.isPending ? 'Creating…' : 'Create user'}</button></>}>
        {formErr && <div className="alert danger" style={{ marginBottom: 8 }}>{formErr}</div>}
        <div className="form-row">
          <div className="field"><label>Username *</label><input className="input" style={{ width: '100%' }} value={form.username} onChange={e => set('username', e.target.value)} autoFocus /></div>
          <div className="field"><label>Email</label><input className="input" type="email" style={{ width: '100%' }} value={form.email} onChange={e => set('email', e.target.value)} /></div>
        </div>
        <div className="field"><label>Password *</label><input className="input" type="password" style={{ width: '100%' }} value={form.password} onChange={e => set('password', e.target.value)} /></div>
        <div className="form-row">
          <div className="field">
            <label>Role</label>
            <select className="input" value={form.role} onChange={e => set('role', e.target.value)}>
              <option>Admin</option>
              <option>Billing team member</option>
              <option>Payment poster</option>
              <option>Provider</option>
              <option>Read-only</option>
            </select>
          </div>
          <div className="field">
            <label>Status</label>
            <select className="input" value={form.status} onChange={e => set('status', e.target.value)}>
              <option>Active</option>
              <option>Inactive</option>
            </select>
          </div>
        </div>
        <div className="field"><label>Office access</label><input className="input" style={{ width: '100%' }} value={form.office_access} onChange={e => set('office_access', e.target.value)} placeholder="Leave blank for all offices" /></div>
      </Modal>
    </>
  );
}

/* ----- Security (static) ----- */
function SecurityTab() {
  const fields = [
    ['Session timeout', '30 minutes'],
    ['MFA requirement', 'Required'],
    ['Role permissions', 'Least privilege'],
    ['Access logs', 'Enabled'],
    ['Sensitive reveal logs', 'Enabled'],
    ['Export confirmation', 'Required for PHI/PII'],
  ];
  return (
    <div className="fieldgrid">
      {fields.map(([l, v]) => (
        <div key={l} className="field"><label>{l}</label><input className="input" defaultValue={v} style={{ width: '100%' }} readOnly /></div>
      ))}
    </div>
  );
}
