import MedicalRecord from '../models/mongo/MedicalRecord.js';
import { hasApprovedConsent } from './consent.service.js';

/**
 * Add a medical record to a patient's profile.
 * Requires the caller to have approved consent.
 */
export const addRecord = async (healthId, type, data, addedBy, addedByName) => {
  const record = new MedicalRecord({
    healthId,
    type,
    data,
    addedBy,
    addedByName,
    createdAt: new Date(),
  });

  await record.save();
  return record;
};

/**
 * Get all medical records for a patient.
 * Caller must have approved consent (enforced at controller/service call site).
 */
export const getPatientRecords = async (healthId) => {
  return MedicalRecord.find({ healthId }).sort({ createdAt: -1 });
};

/**
 * Get records filtered by type (e.g., for pharmacist role seeing only prescriptions).
 */
export const getPatientRecordsByType = async (healthId, type) => {
  return MedicalRecord.find({ healthId, type }).sort({ createdAt: -1 });
};

/**
 * Verify consent and then fetch records. Returns records or throws 403-appropriate error.
 */
export const getRecordsWithConsentCheck = async (healthId, requestedByUserId) => {
  const hasConsent = await hasApprovedConsent(healthId, requestedByUserId);
  if (!hasConsent) {
    const error = new Error('Access denied: no approved consent for this patient');
    error.statusCode = 403;
    throw error;
  }

  return getPatientRecords(healthId);
};
