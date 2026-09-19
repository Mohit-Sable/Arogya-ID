import { Router } from 'express';
import * as documentController from '../controllers/document.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

// POST /api/documents/upload — upload a document (patient only for now)
router.post(
  '/upload',
  authenticate,
  documentController.upload.single('file'),
  documentController.uploadDocument
);

// GET /api/documents/:healthId — list documents for a patient
router.get('/:healthId', authenticate, documentController.getDocuments);

// GET /api/documents/file/:documentId — serve a document file
router.get('/file/:documentId', authenticate, documentController.serveDocument);

export default router;
