import { Router } from 'express';
import * as emergencyController from '../controllers/emergency.controller.js';

const router = Router();

// GET /api/emergency/:healthId — PUBLIC, NO AUTH
// Returns ONLY critical fields: bloodGroup, allergies, emergencyContact, majorConditions
router.get('/:healthId', emergencyController.getEmergencyData);

export default router;
