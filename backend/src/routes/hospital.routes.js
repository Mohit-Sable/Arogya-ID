import { Router } from 'express';
import * as hospitalController from '../controllers/hospital.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/rbac.middleware.js';

const router = Router();

// All hospital routes require authentication and hospital role
router.use(authenticate);
router.use(authorize('hospital'));

// POST /api/hospital/records — add a medical record
router.post('/records', hospitalController.addRecord);

// GET /api/hospital/patients/:healthId — get patient info
router.get('/patients/:healthId', hospitalController.getPatientInfo);

// GET /api/hospital/patients/:healthId/records — get patient records
router.get('/patients/:healthId/records', hospitalController.getPatientRecords);

// POST /api/hospital/consent — request consent from patient
router.post('/consent', hospitalController.requestConsent);

export default router;
