import { User, AccessLog } from '../models/sql/index.js';
import MedicalRecord from '../models/mongo/MedicalRecord.js';
import Document from '../models/mongo/Document.js';

import { parseJsonArray } from './auth.service.js';

/**
 * Get patient profile by user ID.
 */
export const getProfile = async (userId) => {
  const user = await User.findByPk(userId);
  if (!user) throw new Error('User not found');

  const u = user.toJSON();
  delete u.passwordHash;
  for (const field of ['allergies', 'majorConditions', 'chronicConditions', 'currentMedications', 'pastSurgeries']) {
    u[field] = parseJsonArray(u[field]);
  }
  return u;
};

/**
 * Get access logs for a patient's Health ID.
 */
export const getAccessLogs = async (healthId) => {
  return AccessLog.findAll({
    where: { healthId },
    order: [['timestamp', 'DESC']],
  });
};

/**
 * Get the patient's own medical records.
 */
export const getOwnRecords = async (healthId) => {
  return MedicalRecord.find({ healthId }).sort({ createdAt: -1 });
};

/**
 * Get the patient's own documents.
 */
export const getOwnDocuments = async (healthId) => {
  return Document.find({ healthId }).sort({ uploadedAt: -1 });
};

/**
 * Get the full timeline (records + documents merged and sorted by date).
 */
export const getTimeline = async (healthId) => {
  const [records, documents] = await Promise.all([
    MedicalRecord.find({ healthId }).lean(),
    Document.find({ healthId }).lean(),
  ]);

  const timeline = [
    ...records.map(r => ({
      ...r,
      timelineType: 'record',
      date: r.createdAt,
    })),
    ...documents.map(d => ({
      ...d,
      timelineType: 'document',
      date: d.uploadedAt,
    })),
  ];

  timeline.sort((a, b) => new Date(b.date) - new Date(a.date));

  return timeline;
};
