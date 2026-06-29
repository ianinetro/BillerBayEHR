import client from './client.js';

/**
 * List payments / ERAs with optional filters.
 * @param {object} params - (payer_id, date_from, date_to, status, page, …)
 */
export function listPayments(params = {}) {
  return client.get('/payments/', { params }).then(r => r.data);
}

/**
 * Get a single payment / ERA by ID.
 * @param {string|number} id
 */
export function getPayment(id) {
  return client.get(`/payments/${id}/`).then(r => r.data);
}

/**
 * Create a manual payment (patient payment, check, etc.).
 * @param {object} data - (amount, payment_date, method, claim_id or patient_id, …)
 */
export function createPayment(data) {
  return client.post('/payments/', data).then(r => r.data);
}

/**
 * Auto-post an ERA payment — applies all line-level adjustments automatically.
 * @param {string|number} paymentId - ERA / payment record ID
 */
export function autoPostERA(paymentId) {
  return client.post(`/payments/${paymentId}/auto-post/`).then(r => r.data);
}

/**
 * Manually match an unmatched ERA line exception to a specific claim.
 * @param {string|number} exceptionId - the unmatched ERA line record ID
 * @param {string|number} claimId     - the claim to match it against
 */
export function matchException(exceptionId, claimId) {
  return client.post(`/payments/exceptions/${exceptionId}/match/`, { claim_id: claimId }).then(r => r.data);
}
