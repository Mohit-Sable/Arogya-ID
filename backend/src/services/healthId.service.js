import { v4 as uuidv4 } from 'uuid';
import { User, HealthIdMapping } from '../models/sql/index.js';
import { generateQRDataUrl } from '../utils/qrGenerator.js';

/**
 * Generate a new Health ID for a user (idempotent — returns existing if present).
 */
export const generateHealthId = async (userId) => {
  const user = await User.findByPk(userId);
  if (!user) {
    throw new Error('User not found');
  }

  if (user.healthId) {
    return user.healthId;
  }

  const healthId = uuidv4();
  user.healthId = healthId;
  await user.save();

  await HealthIdMapping.create({
    healthId,
    userId: user.id,
  });

  return healthId;
};

/**
 * Get the QR code data URL for a Health ID.
 */
export const getQrCode = async (healthId) => {
  const mapping = await HealthIdMapping.findByPk(healthId);
  if (!mapping) {
    throw new Error('Health ID not found');
  }

  const user = await User.findByPk(mapping.userId);
  const emergencyData = user ? {
    bloodGroup: user.bloodGroup,
    allergies: user.allergies,
    emergencyContact: user.emergencyContact,
    majorConditions: user.majorConditions,
  } : {};

  return generateQRDataUrl(healthId, emergencyData);
};

/**
 * Look up a user by Health ID.
 */
export const getUserByHealthId = async (healthId) => {
  const mapping = await HealthIdMapping.findByPk(healthId);
  if (!mapping) {
    return null;
  }

  const user = await User.findByPk(mapping.userId);
  return user;
};
