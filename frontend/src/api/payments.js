import client from './client.js';

export function listPayments(params = {}) {
  return client.get('/payments/', { params }).then(r => r.data);
}

export function getPayment(id) {
  return client.get(`/payments/${id}/`).then(r => r.data);
}

export function createPayment(data) {
  return client.post('/payments/', data).then(r => r.data);
}

export function autoPostERA(paymentId) {
  return client.post(`/payments/${paymentId}/auto-post-era/`).then(r => r.data);
}

export function matchException(paymentId, exceptionId, claimId, notes = '') {
  return client.post(`/payments/${paymentId}/match-exception/`, {
    exception_id: exceptionId,
    claim_id: claimId,
    notes,
  }).then(r => r.data);
}

export function importERA(file) {
  const form = new FormData();
  form.append('file', file);
  return client.post('/payments/import-era/', form).then(r => r.data);
}

export function getERADashboard() {
  return client.get('/payments/era-dashboard/').then(r => r.data);
}

export function listERAExceptions(params = {}) {
  return client.get('/payments/era-exceptions/', { params }).then(r => r.data);
}
