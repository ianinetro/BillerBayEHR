import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Badge from '../components/Badge';

const STATIC_ROWS = [
  { ts: '06/27/2026 09:12', actor: 'Lina Morris', role: 'Billing', action: 'Claim validation', entity: 'BB-2026-000183', before: 'Draft', after: 'Validation failed', result: 'Completed', ip: '10.0.2.18' },
  { ts: '06/27/2026 09:18', actor: 'System', role: 'Automation', action: 'ERA auto-post', entity: 'PMT-9012', before: 'Imported', after: 'Posted with warnings', result: 'Warning', ip: 'Worker-02' },
  { ts: '06/27/2026 10:02', actor: 'Omar Reed', role: 'Admin', action: 'Settings change', entity: 'CPT 20610', before: '$135', after: '$140', result: 'Completed', ip: '10.0.2.33' },
];

export default function Audit() {
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');

  const rows = STATIC_ROWS.filter(r => {
    const q = search.toLowerCase();
    const matchSearch = !q || r.actor.toLowerCase().includes(q) || r.action.toLowerCase().includes(q) || r.entity.toLowerCase().includes(q);
    const matchAction = !actionFilter || r.action === actionFilter;
    return matchSearch && matchAction;
  });

  return (
    <div>
      <div className="header">
        <div>
          <div className="eyebrow">Audit log</div>
          <div className="title">Audit log</div>
          <div className="desc">Search sensitive edits, claim submissions, payment actions, ERA auto-post, settings changes, user access changes, exports, and reveal events.</div>
        </div>
        <div className="actions">
          <button className="btn" onClick={() => alert('Export audit — PHI export confirmation required.')}>Export audit</button>
        </div>
      </div>

      <div className="card">
        <div className="toolbar">
          <div className="left">
            <input className="input" placeholder="Search actor, action, entity, IP…" value={search} onChange={e => setSearch(e.target.value)} />
            <select className="input" value={actionFilter} onChange={e => setActionFilter(e.target.value)}>
              <option value="">All actions</option>
              <option>Claim validation</option>
              <option>ERA auto-post</option>
              <option>Settings change</option>
              <option>Payment posting</option>
              <option>Claim submission</option>
            </select>
          </div>
        </div>
        <div className="tablewrap">
          <table className="table">
            <thead>
              <tr>
                <th>Timestamp</th><th>Actor</th><th>Role</th><th>Action</th>
                <th>Entity</th><th>Before</th><th>After</th><th>Result</th><th>IP / device</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && <tr><td colSpan={9} className="muted">No audit entries match your search.</td></tr>}
              {rows.map((r, i) => (
                <tr key={i}>
                  <td className="mono">{r.ts}</td>
                  <td>{r.actor}</td>
                  <td>{r.role}</td>
                  <td>{r.action}</td>
                  <td className="mono">{r.entity}</td>
                  <td className="muted">{r.before}</td>
                  <td>{r.after}</td>
                  <td><Badge status={r.result} /></td>
                  <td className="mono muted">{r.ip}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="footerNote">Audit log is immutable. Export requires confirmation for PHI/PII records.</div>
      </div>
    </div>
  );
}
