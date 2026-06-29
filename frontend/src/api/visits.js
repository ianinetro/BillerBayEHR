import client from './client.js';

export function listVisits(params = {}) {
  return client.get('/visits/', { params }).then(r => r.data);
}

export function getVisit(id) {
  return client.get(`/visits/${id}/`).then(r => r.data);
}

export function createVisit(data) {
  return client.post('/visits/', data).then(r => r.data);
}

export function updateVisit(id, data) {
  return client.patch(`/visits/${id}/`, data).then(r => r.data);
}

// Nested: diagnosis lines
export function listDiagnosisLines(visitPk) {
  return client.get(`/visits/${visitPk}/diagnoses/`).then(r => r.data);
}

export function createDiagnosisLine(visitPk, data) {
  return client.post(`/visits/${visitPk}/diagnoses/`, data).then(r => r.data);
}

export function updateDiagnosisLine(visitPk, id, data) {
  return client.patch(`/visits/${visitPk}/diagnoses/${id}/`, data).then(r => r.data);
}

export function deleteDiagnosisLine(visitPk, id) {
  return client.delete(`/visits/${visitPk}/diagnoses/${id}/`);
}

// Nested: service lines
export function listServiceLines(visitPk) {
  return client.get(`/visits/${visitPk}/service-lines/`).then(r => r.data);
}

export function createServiceLine(visitPk, data) {
  return client.post(`/visits/${visitPk}/service-lines/`, data).then(r => r.data);
}

export function updateServiceLine(visitPk, id, data) {
  return client.patch(`/visits/${visitPk}/service-lines/${id}/`, data).then(r => r.data);
}

export function deleteServiceLine(visitPk, id) {
  return client.delete(`/visits/${visitPk}/service-lines/${id}/`);
}
