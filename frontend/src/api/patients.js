import client from './client.js';

/**
 * List patients with optional filters/pagination.
 * @param {object} params - query params (q, page, page_size, status, …)
 */
export function listPatients(params = {}) {
  return client.get('/patients/', { params }).then(r => r.data);
}

/**
 * Get a single patient by ID.
 * @param {string|number} id
 */
export function getPatient(id) {
  return client.get(`/patients/${id}/`).then(r => r.data);
}

/**
 * Create a new patient.
 * @param {object} data - patient fields
 */
export function createPatient(data) {
  return client.post('/patients/', data).then(r => r.data);
}

/**
 * Update an existing patient.
 * @param {string|number} id
 * @param {object} data - partial or full patient fields
 */
export function updatePatient(id, data) {
  return client.patch(`/patients/${id}/`, data).then(r => r.data);
}
