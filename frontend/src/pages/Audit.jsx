import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Badge from '../components/Badge';
import { listAuditLogs } from '../api/audit';
import { useToast } from '../components/Toast';

export default function Audit() {
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['audit', search, actionFilter],
    queryFn: () => listAuditLogs({
      search: search || undefined,
      action: actionFilter || undefined,
      page_size: 100,
    }),
  });
  const rows = data?.results || [];

  return (
    <div>
      <div className="header">
        <div>
          <div className="eyebrow">Audit log</div>
          <div className="title">Audit log</div>
          <div className="desc">Search sensitive edits, claim submissions, payment actions, ERA auto-post, settings changes, user access changes, exports, and reveal events.</div>
        </div>
        <div className="actions">
          <button className="btn" onClick={() => toast.info('Export audit — PHI export confirmation required.')}>
            Export audit
          </button>
        </div>
      </div>

      <div className="card">
        <div className="toolbar">
          <div className="left">
            <input
              className="input"
              placeholder="Search actor, action, entity, IP…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
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
              {isLoading && <tr><td colSpan={9} className="muted" style={{ padding: '24px 20px', textAlign: 'center' }}>Loading…</td></tr>}
              {!isLoading && rows.length === 0 && (
                <tr><td colSpan={9} className="muted" style={{ padding: '24px 20px', textAlign: 'center' }}>No audit entries match your search.</td></tr>
              )}
              {rows.map((r, i) => (
                <tr key={r.id || i}>
                  <td className="mono">{r.timestamp || r.created_at || '—'}</td>
                  <td>{r.actor || r.user || '—'}</td>
                  <td>{r.role || '—'}</td>
                  <td>{r.action}</td>
                  <td className="mono">{r.entity_type ? `${r.entity_type}/${r.entity_id}` : (r.entity || '—')}</td>
                  <td className="muted">{r.before_value || '—'}</td>
                  <td>{r.after_value || '—'}</td>
                  <td><Badge status={r.result || r.status || 'Completed'} /></td>
                  <td className="mono muted">{r.ip_address || '—'}</td>
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
