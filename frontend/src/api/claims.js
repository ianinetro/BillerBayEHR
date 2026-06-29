import client from './client.js';

export function listClaims(params = {}) {
  return client.get('/claims/', { params }).then(r => r.data);
}

export function getClaim(id) {
  return client.get(`/claims/${id}/`).then(r => r.data);
}

export function createClaim(data) {
  return client.post('/claims/', data).then(r => r.data);
}

export function updateClaim(id, data) {
  return client.patch(`/claims/${id}/`, data).then(r => r.data);
}

export function validateClaim(id) {
  return client.post(`/claims/${id}/validate/`).then(r => r.data);
}

export function submitClaim(id) {
  return client.post(`/claims/${id}/submit/`).then(r => r.data);
}

export function generate837p(id) {
  return client.post(`/claims/${id}/generate-837p/`).then(r => r.data);
}

export function batchSubmitClaims(claimIds) {
  return client.post('/claims/batch-submit/', { claim_ids: claimIds }).then(r => r.data);
}
