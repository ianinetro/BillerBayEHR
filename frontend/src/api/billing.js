import client from './client.js';

export function listWorkQueue(params = {}) {
  return client.get('/billing/work-queue/', { params }).then(r => r.data);
}

export function updateWorkQueueItem(id, data) {
  return client.patch(`/billing/work-queue/${id}/`, data).then(r => r.data);
}

export function resolveWorkQueueItem(id) {
  return client.patch(`/billing/work-queue/${id}/`, { resolved: true }).then(r => r.data);
}
