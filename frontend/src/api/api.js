import client from './client.js';

export const authApi = {
  register: (data) => client.post('/auth/register', data),
  login: (data) => client.post('/auth/login', data),
  getMe: () => client.get('/auth/me'),
};

export const patientApi = {
  getProfile: () => client.get('/patient/profile'),
  updateProfile: (data) => client.put('/patient/profile', data),
  getAccessLogs: () => client.get('/patient/access-logs'),
  getRecords: () => client.get('/patient/records'),
  getDocuments: () => client.get('/patient/documents'),
  getTimeline: () => client.get('/patient/timeline'),
  getConsents: () => client.get('/patient/consents'),
  approveConsent: (id) => client.put(`/patient/consents/${id}/approve`),
  denyConsent: (id) => client.put(`/patient/consents/${id}/deny`),
  getAiSummary: () => client.get('/patient/ai-summary'),
};

export const hospitalApi = {
  getPatientInfo: (healthId) => client.get(`/hospital/patients/${healthId}`),
  getPatientRecords: (healthId) => client.get(`/hospital/patients/${healthId}/records`),
  addRecord: (data) => client.post('/hospital/records', data),
  requestConsent: (healthId) => client.post('/hospital/consent', { healthId }),
};

export const emergencyApi = {
  getData: (healthId) => client.get(`/emergency/${healthId}`),
};

export const consentApi = {
  requestAccess: (healthId) => client.post('/consent/request', { healthId }),
  checkStatus: (healthId) => client.get(`/consent/status/${healthId}`),
};

export const documentApi = {
  upload: (formData) => client.post('/documents/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  getDocuments: (healthId) => client.get(`/documents/${healthId}`),
  getFileUrl: (documentId) => `http://localhost:5000/api/documents/file/${documentId}`,
};
