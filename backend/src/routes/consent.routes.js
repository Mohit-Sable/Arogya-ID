import { Router } from 'express';
import * as consentController from '../controllers/consent.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/rbac.middleware.js';

const router = Router();

router.use(authenticate);

// POST /api/consent/request — hospital/insurer requests access
router.post('/request', authorize('hospital', 'insurer', 'pharmacist'), consentController.requestAccess);

// GET /api/consent/pending — patient sees pending requests
router.get('/pending', authorize('patient'), consentController.getPendingRequests);

// PUT /api/consent/:id/approve — patient approves
router.put('/:id/approve', authorize('patient'), consentController.approveRequest);

// PUT /api/consent/:id/deny — patient denies
router.put('/:id/deny', authorize('patient'), consentController.denyRequest);

// GET /api/consent/status/:healthId — requester checks consent status
router.get('/status/:healthId', consentController.checkConsentStatus);

export default router;
