import { Router } from 'express';
import * as patientController from '../controllers/patient.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/rbac.middleware.js';

const router = Router();

// All patient routes require authentication and patient role
router.use(authenticate);
router.use(authorize('patient'));

// GET /api/patient/profile
router.get('/profile', patientController.getProfile);

// PUT /api/patient/profile
router.put('/profile', patientController.updateProfile);

// GET /api/patient/access-logs
router.get('/access-logs', patientController.getAccessLogs);

// GET /api/patient/records
router.get('/records', patientController.getOwnRecords);

// GET /api/patient/documents
router.get('/documents', patientController.getOwnDocuments);

// GET /api/patient/timeline
router.get('/timeline', patientController.getTimeline);

// GET /api/patient/consents
router.get('/consents', patientController.getConsentRequests);

// PUT /api/patient/consents/:id/approve
router.put('/consents/:id/approve', patientController.approveConsent);

// PUT /api/patient/consents/:id/deny
router.put('/consents/:id/deny', patientController.denyConsent);

// GET /api/patient/ai-summary
router.get('/ai-summary', patientController.getAiSummary);

export default router;
