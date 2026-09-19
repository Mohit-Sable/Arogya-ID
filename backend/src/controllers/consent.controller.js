import * as consentService from '../services/consent.service.js';
import { z } from 'zod';

const requestSchema = z.object({
  healthId: z.string().min(1, 'Health ID is required'),
});

export const requestAccess = async (req, res) => {
  try {
    const validated = requestSchema.parse(req.body);
    const result = await consentService.requestAccess(
      validated.healthId,
      req.user.userId,
      req.user.name,
      req.user.role
    );
    res.json(result);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: err.errors });
    }
    res.status(400).json({ error: err.message });
  }
};

export const getPendingRequests = async (req, res) => {
  try {
    const requests = await consentService.getPendingRequests(req.user.healthId);
    res.json({ requests });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const approveRequest = async (req, res) => {
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

export const denyRequest = async (req, res) => {
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

export const checkConsentStatus = async (req, res) => {
  try {
    const { healthId } = req.params;
    const hasConsent = await consentService.hasApprovedConsent(healthId, req.user.userId);
    res.json({ healthId, hasConsent });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
