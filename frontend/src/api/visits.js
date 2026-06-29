import client from './client.js';

/**
 * List visits with optional filters/pagination.
 * @param {object} params - query params (patient_id, date_from, date_to, status, page, …)
 */
export function listVisits(params = {}) {
  return client.get('/visits/', { params }).then(r => r.data);
}

/**
 * Get a single visit by ID.
 * @param {string|number} id
 */
export function getVisit(id) {
  return client.get(`/visits/${id}/`).then(r => r.data);
}

/**
 * Create a new visit.
 * @param {object} data - visit fields (patient, provider, date_of_service, …)
 */
export function createVisit(data) {
  return client.post('/visits/', data).then(r => r.data);
}

/**
 * Update a visit.
 * @param {string|number} id
 * @param {object} data - partial or full visit fields
 */
export function updateVisit(id, data) {
  return client.patch(`/visits/${id}/`, data).then(r => r.data);
}
