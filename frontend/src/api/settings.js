import client from './client.js';

// Practice
export const getPractice = () => client.get('/settings/practice/').then(r => r.data);
export const updatePractice = (id, data) => client.patch(`/settings/practice/${id}/`, data).then(r => r.data);

// Providers
export const listProviders = (p = {}) => client.get('/settings/providers/', { params: p }).then(r => r.data);
export const createProvider = d => client.post('/settings/providers/', d).then(r => r.data);
export const updateProvider = (id, d) => client.patch(`/settings/providers/${id}/`, d).then(r => r.data);
export const deleteProvider = id => client.delete(`/settings/providers/${id}/`);

// Billing providers
export const listBillingProviders = (p = {}) => client.get('/settings/billing-providers/', { params: p }).then(r => r.data);
export const createBillingProvider = d => client.post('/settings/billing-providers/', d).then(r => r.data);
export const updateBillingProvider = (id, d) => client.patch(`/settings/billing-providers/${id}/`, d).then(r => r.data);
export const deleteBillingProvider = id => client.delete(`/settings/billing-providers/${id}/`);

// Referring providers
export const listReferringProviders = (p = {}) => client.get('/settings/referring-providers/', { params: p }).then(r => r.data);

// Facilities
export const listFacilities = (p = {}) => client.get('/settings/facilities/', { params: p }).then(r => r.data);
export const createFacility = d => client.post('/settings/facilities/', d).then(r => r.data);
export const updateFacility = (id, d) => client.patch(`/settings/facilities/${id}/`, d).then(r => r.data);
export const deleteFacility = id => client.delete(`/settings/facilities/${id}/`);

// Payers
export const listPayers = (p = {}) => client.get('/settings/payers/', { params: p }).then(r => r.data);
export const createPayer = d => client.post('/settings/payers/', d).then(r => r.data);
export const updatePayer = (id, d) => client.patch(`/settings/payers/${id}/`, d).then(r => r.data);
export const deletePayer = id => client.delete(`/settings/payers/${id}/`);

// CPT codes
export const listCPTCodes = (p = {}) => client.get('/settings/cpt-codes/', { params: p }).then(r => r.data);
export const createCPTCode = d => client.post('/settings/cpt-codes/', d).then(r => r.data);
export const updateCPTCode = (id, d) => client.patch(`/settings/cpt-codes/${id}/`, d).then(r => r.data);
export const deleteCPTCode = id => client.delete(`/settings/cpt-codes/${id}/`);

// Diagnosis codes
export const listDiagnosisCodes = (p = {}) => client.get('/settings/diagnosis-codes/', { params: p }).then(r => r.data);
export const createDiagnosisCode = d => client.post('/settings/diagnosis-codes/', d).then(r => r.data);
export const updateDiagnosisCode = (id, d) => client.patch(`/settings/diagnosis-codes/${id}/`, d).then(r => r.data);

// Chart accounts
export const listChartAccounts = (p = {}) => client.get('/settings/chart-accounts/', { params: p }).then(r => r.data);

// Claim defaults
export const getClaimDefaults = () => client.get('/settings/claim-defaults/').then(r => r.data);
export const updateClaimDefaults = (id, d) => client.patch(`/settings/claim-defaults/${id}/`, d).then(r => r.data);

// Users / access
export const listUsers = (p = {}) => client.get('/settings/user-access/', { params: p }).then(r => r.data);
export const updateUser = (id, d) => client.patch(`/settings/user-access/${id}/`, d).then(r => r.data);
