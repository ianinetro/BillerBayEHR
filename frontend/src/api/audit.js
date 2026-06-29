import client from './client.js';

export function listAuditLogs(params = {}) {
  return client.get('/audit/', { params }).then(r => r.data);
}
