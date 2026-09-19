import * as hospitalService from '../services/hospital.service.js';
import * as consentService from '../services/consent.service.js';
import { getUserByHealthId } from '../services/healthId.service.js';
import { AccessLog } from '../models/sql/index.js';
import { z } from 'zod';

const addRecordSchema = z.object({
  healthId: z.string().min(1, 'Health ID is required'),
  type: z.enum(['prescription', 'diagnosis', 'surgery', 'vaccination', 'discharge_summary']),
  data: z.record(z.any()),
});

export const addRecord = async (req, res) => {
  try {
    const validated = addRecordSchema.parse(req.body);

    // Verify consent
    const hasConsent = await consentService.hasApprovedConsent(
      validated.healthId,
      req.user.userId
    );
    if (!hasConsent) {
      return res.status(403).json({ error: 'No approved consent for this patient. Request access first.' });
    }

    const record = await hospitalService.addRecord(
      validated.healthId,
      validated.type,
      validated.data,
      req.user.userId,
      req.user.name
    );

    // Log this access
    await AccessLog.create({
      healthId: validated.healthId,
      accessedBy: req.user.userId,
      accessedByName: req.user.name,
      role: req.user.role,
      ipAddress: req.ip,
      timestamp: new Date(),
      fieldsReturned: 'write_record',
      wasEmergencyMode: false,
    });

    res.status(201).json({ message: 'Record added successfully', record });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: err.errors });
    }
    const status = err.statusCode || 400;
    res.status(status).json({ error: err.message });
  }
};

export const getPatientRecords = async (req, res) => {
  try {
    const { healthId } = req.params;

    const records = await hospitalService.getRecordsWithConsentCheck(
      healthId,
      req.user.userId
    );

    // Log this access
    await AccessLog.create({
      healthId,
      accessedBy: req.user.userId,
      accessedByName: req.user.name,
      role: req.user.role,
      ipAddress: req.ip,
      timestamp: new Date(),
      fieldsReturned: 'full_record',
      wasEmergencyMode: false,
    });

    res.json({ records });
  } catch (err) {
    const status = err.statusCode || 400;
    res.status(status).json({ error: err.message });
  }
};

export const getPatientInfo = async (req, res) => {
  try {
    const { healthId } = req.params;
    const user = await getUserByHealthId(healthId);

    if (!user) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    // Check consent status
    const hasConsent = await consentService.hasApprovedConsent(healthId, req.user.userId);

    // Return basic info (name only) without consent; full info with consent
    const info = {
      name: user.name,
      healthId: user.healthId,
      hasConsent,
    };

    if (hasConsent) {
      info.bloodGroup = user.bloodGroup;
      info.allergies = user.allergies;
      info.majorConditions = user.majorConditions;
      info.emergencyContact = user.emergencyContact;
    }

    res.json({ patient: info });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const requestConsent = async (req, res) => {
  try {
    const { healthId } = req.body;
    if (!healthId) {
      return res.status(400).json({ error: 'Health ID is required' });
    }

    const user = await getUserByHealthId(healthId);
    if (!user) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    const result = await consentService.requestAccess(
      healthId,
      req.user.userId,
      req.user.name,
      req.user.role
    );

    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
