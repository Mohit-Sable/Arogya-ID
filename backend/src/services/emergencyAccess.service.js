import { User, HealthIdMapping, AccessLog } from '../models/sql/index.js';
import { parseJsonArray } from './auth.service.js';

// Explicit allowlist — ONLY these fields are ever returned from emergency mode.
const EMERGENCY_FIELDS = ['bloodGroup', 'allergies', 'emergencyContact', 'majorConditions'];

/**
 * Get emergency data for a Health ID.
 * HARD-ENFORCED: Only returns the 4 critical fields. Never touches MedicalRecord or Document.
 * @param {string} healthId
 * @returns {{ bloodGroup, allergies, emergencyContact, majorConditions, patientName }}
 */
export const getEmergencyData = async (healthId) => {
  const mapping = await HealthIdMapping.findByPk(healthId);
  let user = null;

  if (mapping) {
    user = await User.findByPk(mapping.userId);
  }

  // Fallback: check User table directly by healthId
  if (!user) {
    user = await User.findOne({ where: { healthId } });
  }

  if (!user) {
    throw new Error('Health ID not found');
  }

  // Build the response using ONLY the allowlisted fields
  const emergencyData = {};
  for (const field of EMERGENCY_FIELDS) {
    emergencyData[field] = user[field] ?? null;
  }

  emergencyData.allergies = parseJsonArray(emergencyData.allergies);
  emergencyData.majorConditions = parseJsonArray(emergencyData.majorConditions);

  // Add patient name for identification
  emergencyData.patientName = user.name;
  emergencyData.healthId = healthId;

  return emergencyData;
};

/**
 * Log an emergency access event.
 */
export const logEmergencyAccess = async (healthId, ipAddress) => {
  await AccessLog.create({
    healthId,
    accessedBy: null,
    accessedByName: 'Emergency Access',
    role: 'emergency_responder',
    ipAddress,
    timestamp: new Date(),
    fieldsReturned: EMERGENCY_FIELDS.join(','),
    wasEmergencyMode: true,
  });
};
