import * as patientService from '../services/patient.service.js';
import * as authService from '../services/auth.service.js';
import * as consentService from '../services/consent.service.js';
import { getQrCode } from '../services/healthId.service.js';
import { generateSummary } from '../services/aiSummary.service.js';
import MedicalRecord from '../models/mongo/MedicalRecord.js';
import { z } from 'zod';

const profileUpdateSchema = z.object({
  name: z.string().optional(),
  bloodGroup: z.string().optional(),
  allergies: z.array(z.string()).optional(),
  emergencyContact: z.string().optional(),
  majorConditions: z.array(z.string()).optional(),
  chronicConditions: z.array(z.string()).optional(),
  currentMedications: z.array(z.string()).optional(),
  pastSurgeries: z.array(z.string()).optional(),
});

export const getProfile = async (req, res) => {
  try {
    const profile = await patientService.getProfile(req.user.userId);
    let qrCode = null;
    if (profile.healthId) {
      qrCode = await getQrCode(profile.healthId);
    }
    res.json({ profile, qrCode });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const validated = profileUpdateSchema.parse(req.body);
    const updated = await authService.updateProfile(req.user.userId, validated);
    res.json({ message: 'Profile updated', profile: updated });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: err.errors });
    }
    res.status(400).json({ error: err.message });
  }
};

export const getAccessLogs = async (req, res) => {
  try {
    const logs = await patientService.getAccessLogs(req.user.healthId);
    res.json({ logs });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const getOwnRecords = async (req, res) => {
  try {
    const records = await patientService.getOwnRecords(req.user.healthId);
    res.json({ records });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const getOwnDocuments = async (req, res) => {
  try {
    const documents = await patientService.getOwnDocuments(req.user.healthId);
    res.json({ documents });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const getTimeline = async (req, res) => {
  try {
    const timeline = await patientService.getTimeline(req.user.healthId);
    res.json({ timeline });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const getConsentRequests = async (req, res) => {
  try {
    const consents = await consentService.getAllConsents(req.user.healthId);
    res.json({ consents });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const approveConsent = async (req, res) => {
  try {
    const consent = await consentService.approveRequest(
      parseInt(req.params.id),
      req.user.healthId
    );
    res.json({ message: 'Consent approved', consent });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const denyConsent = async (req, res) => {
  try {
    const consent = await consentService.denyRequest(
      parseInt(req.params.id),
      req.user.healthId
    );
    res.json({ message: 'Consent denied', consent });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const getAiSummary = async (req, res) => {
  try {
    const profile = await patientService.getProfile(req.user.userId);
    const records = await MedicalRecord.find({ healthId: req.user.healthId });
    const summary = await generateSummary(records, profile);
    res.json({ summary });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
