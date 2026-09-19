import { ConsentRecord } from '../models/sql/index.js';

/**
 * Request access to a patient's record.
 * Creates a ConsentRecord with status 'pending'.
 */
export const requestAccess = async (healthId, requestedBy, requestedByName, requestedByRole) => {
  // Check if there's already a pending/approved request
  const existing = await ConsentRecord.findOne({
    where: {
      healthId,
      requestedBy,
      status: 'pending',
    },
  });

  if (existing) {
    return { message: 'Access request already pending', consent: existing };
  }

  const consent = await ConsentRecord.create({
    healthId,
    requestedBy,
    requestedByName,
    requestedByRole,
    status: 'pending',
    requestedAt: new Date(),
  });

  return { message: 'Access request submitted', consent };
};

/**
 * Get pending consent requests for a patient.
 */
export const getPendingRequests = async (healthId) => {
  return ConsentRecord.findAll({
    where: { healthId, status: 'pending' },
    order: [['requestedAt', 'DESC']],
  });
};

/**
 * Get all consent records for a patient (all statuses).
 */
export const getAllConsents = async (healthId) => {
  return ConsentRecord.findAll({
    where: { healthId },
    order: [['requestedAt', 'DESC']],
  });
};

/**
 * Approve a consent request.
 * Verifies the consent belongs to the given patient's healthId.
 */
export const approveRequest = async (consentId, patientHealthId) => {
  const consent = await ConsentRecord.findByPk(consentId);
  if (!consent) {
    throw new Error('Consent request not found');
  }

  if (consent.healthId !== patientHealthId) {
    throw new Error('Unauthorized: this consent does not belong to your Health ID');
  }

  if (consent.status !== 'pending') {
    throw new Error(`Consent already ${consent.status}`);
  }

  consent.status = 'approved';
  consent.decidedAt = new Date();
  await consent.save();

  return consent;
};

/**
 * Deny a consent request.
 */
export const denyRequest = async (consentId, patientHealthId) => {
  const consent = await ConsentRecord.findByPk(consentId);
  if (!consent) {
    throw new Error('Consent request not found');
  }

  if (consent.healthId !== patientHealthId) {
    throw new Error('Unauthorized: this consent does not belong to your Health ID');
  }

  if (consent.status !== 'pending') {
    throw new Error(`Consent already ${consent.status}`);
  }

  consent.status = 'denied';
  consent.decidedAt = new Date();
  await consent.save();

  return consent;
};

/**
 * Check if a user has approved consent for a given Health ID.
 * Returns true only if there's an 'approved' consent.
 */
export const hasApprovedConsent = async (healthId, requestedByUserId) => {
  const consent = await ConsentRecord.findOne({
    where: {
      healthId,
      requestedBy: requestedByUserId,
      status: 'approved',
    },
  });

  return !!consent;
};
