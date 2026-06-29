import client from './client.js';

/**
 * List claims with optional filters/pagination.
 * @param {object} params - (patient_id, visit_id, status, payer_id, date_from, date_to, page, …)
 */
export function listClaims(params = {}) {
  return client.get('/claims/', { params }).then(r => r.data);
}

/**
 * Get a single claim by ID.
 * @param {string|number} id
 */
export function getClaim(id) {
  return client.get(`/claims/${id}/`).then(r => r.data);
}

/**
 * Create a new claim.
 * @param {object} data - claim fields (visit, payer, lines, …)
 */
export function createClaim(data) {
  return client.post('/claims/', data).then(r => r.data);
}

/**
 * Update a claim (pre-submission edits).
 * @param {string|number} id
 * @param {object} data - partial or full claim fields
 */
export function updateClaim(id, data) {
  return client.patch(`/claims/${id}/`, data).then(r => r.data);
}

/**
 * Run claim validation rules.
 * Returns validation result with errors/warnings.
 * @param {string|number} id
 */
export function validateClaim(id) {
  return client.post(`/claims/${id}/validate/`).then(r => r.data);
}

/**
 * Submit a claim to the payer (or clearinghouse).
 * @param {string|number} id
 */
export function submitClaim(id) {
  return client.post(`/claims/${id}/submit/`).then(r => r.data);
}
