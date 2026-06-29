import React, { useState } from 'react';
import Badge from '../components/Badge';

const GROUPS = ['practice setup', 'users and access', 'providers', 'billing providers', 'facilities', 'payers', 'CPT codes', 'diagnosis codes', 'chart accounts', 'claim defaults', 'security'];

export default function Settings() {
  const [tab, setTab] = useState('practice setup');

  return (
    <div>
      <div className="header">
        <div>
          <div className="eyebrow">Settings</div>
          <div className="title">Settings and master data</div>
          <div className="desc">Manage master data with downstream impact. These records control claim creation, validation, payment posting, and access.</div>
        </div>
        <div className="actions">
          <button className="btn">Import</button>
          <button className="btn primary" onClick={() => alert('Settings saved. Audit log updated.')}>Save changes</button>
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
            {tab === 'practice setup' && <PracticeSetup />}
            {tab === 'users and access' && <UsersTab />}
            {tab === 'providers' && <ProvidersTab />}
            {tab === 'billing providers' && <BillingProvidersTab />}
            {tab === 'facilities' && <FacilitiesTab />}
            {tab === 'payers' && <PayersTab />}
            {tab === 'CPT codes' && <CPTTab />}
            {tab === 'diagnosis codes' && <DiagnosisTab />}
            {tab === 'chart accounts' && <ChartTab />}
            {tab === 'claim defaults' && <ClaimDefaultsTab />}
            {tab === 'security' && <SecurityTab />}
          </div>
        </div>

        <div className="card pad summary">
          <div className="sectionTitle">Downstream impact</div>
          <div className="sub">Changing payers, providers, facilities, CPT codes, default POS, billing provider NPI, or auto-submit rules can affect claim validation, submission, payment posting, reports, and audit review.</div>
          <div className="divider" />
          <div className="timeline">
            <div className="event"><div className="dot" /><div><strong>Last changed</strong><span>Omar · today 10:12 AM</span></div></div>
            <div className="event"><div className="dot" /><div><strong>Audit required</strong><span>All setting changes are logged with before/after values.</span></div></div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FieldGrid({ fields }) {
  return (
    <div className="fieldgrid">
      {fields.map(([l, v]) => (
        <div key={l} className="field"><label>{l}</label><input className="input" defaultValue={v} style={{ width: '100%' }} /></div>
      ))}
    </div>
  );
}

function SettingsTable({ headers, rows }) {
  return (
    <table className="table">
      <thead><tr>{headers.map(h => <th key={h}>{h}</th>)}<th>Action</th></tr></thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i}>{r.map((c, j) => <td key={j}>{j === r.length - 1 ? <Badge status={c} /> : c}</td>)}<td><button className="btn">Edit</button></td></tr>
        ))}
      </tbody>
    </table>
  );
}

function PracticeSetup() {
  return <FieldGrid fields={[['Company name', 'Apex Family Care LLC'], ['Company ID', 'APEX-001'], ['Phone', '(602) 555-1000'], ['Fax', '(602) 555-1001'], ['Address', '920 Health Park Dr'], ['City', 'Phoenix'], ['State', 'AZ'], ['Zip', '85001'], ['Statement header', 'Apex Family Care Billing Department']]} />;
}

function UsersTab() {
  return (
    <table className="table">
      <thead><tr><th>User</th><th>Role</th><th>Office access</th><th>Status</th><th>MFA</th><th>Last login</th><th>Action</th></tr></thead>
      <tbody>
        <tr><td>Lina Morris</td><td>Billing team member</td><td>All offices</td><td><Badge status="Active" /></td><td><Badge status="Active" /></td><td>Today</td><td><button className="btn">Edit role</button></td></tr>
        <tr><td>Maya Bell</td><td>Payment poster</td><td>Apex Main</td><td><Badge status="Active" /></td><td><Badge status="Active" /></td><td>Yesterday</td><td><button className="btn">Edit role</button></td></tr>
      </tbody>
    </table>
  );
}

function ProvidersTab() {
  return <SettingsTable headers={['Provider ID', 'Name', 'NPI', 'Taxonomy', 'Default facility', 'Status']} rows={[['PR-100', 'Dr. Harlan', '1740283991', '207Q00000X', 'Apex Main', 'Active'], ['PR-101', 'Dr. Singh', '1659372827', '207R00000X', 'Apex North', 'Active']]} />;
}

function BillingProvidersTab() {
  return <SettingsTable headers={['Billing provider', 'Group NPI', 'Tax ID', 'Org type', 'Status']} rows={[['Apex Family Care LLC', '1234567893', '••-•••2388', 'Group', 'Active']]} />;
}

function FacilitiesTab() {
  return <SettingsTable headers={['Facility ID', 'Name', 'NPI', 'Address', 'Status']} rows={[['FAC-01', 'Apex Main', '1982773220', '920 Health Park Dr', 'Active'], ['FAC-02', 'Apex North', '1982773221', '55 North Ave', 'Active']]} />;
}

function PayersTab() {
  return <SettingsTable headers={['Insurance ID', 'Name', 'Payer ID', 'Submission method', 'Status']} rows={[['INS-01', 'Medicare', 'MEDICARE-AZ', 'Clearinghouse', 'Active'], ['INS-02', 'BCBS', 'BCBS-AZ', 'Clearinghouse', 'Active'], ['INS-03', 'Old Local Plan', 'OLD-003', 'Paper', 'Inactive']]} />;
}

function CPTTab() {
  return <SettingsTable headers={['CPT/HCPCS', 'Description', 'Default POS', 'Default charge', 'Status']} rows={[['99214', 'Office/outpatient visit est', '11', '$180.00', 'Active'], ['20610', 'Major joint injection', '11', '$140.00', 'Active']]} />;
}

function DiagnosisTab() {
  return <SettingsTable headers={['Code type', 'Code', 'Description', 'Billable', 'Status']} rows={[['ICD-10', 'M25.561', 'Pain in right knee', 'Yes', 'Active'], ['ICD-10', 'M17.11', 'Unilateral primary OA right knee', 'Yes', 'Active']]} />;
}

function ChartTab() {
  return <SettingsTable headers={['Account ID', 'Type', 'Description', 'Transaction type', 'Status']} rows={[['4000', 'Payment', 'Insurance payment', 'Credit', 'Active'], ['5000', 'Adjustment', 'Contractual adjustment', 'Debit', 'Active']]} />;
}

function ClaimDefaultsTab() {
  return <FieldGrid fields={[['Default facility', 'Apex Main'], ['Default billing provider', 'Apex Family Care LLC'], ['Default rendering provider', 'Use visit provider'], ['Default POS', '11'], ['Auto-submit claims', 'Off'], ['Claim form version', 'CMS-1500 02/12'], ['Statement defaults', 'Monthly']]} />;
}

function SecurityTab() {
  return <FieldGrid fields={[['Session timeout', '30 minutes'], ['MFA requirement', 'Required'], ['Role permissions', 'Least privilege'], ['Access logs', 'Enabled'], ['Sensitive reveal logs', 'Enabled'], ['Export confirmation', 'Required for PHI/PII']]} />;
}
