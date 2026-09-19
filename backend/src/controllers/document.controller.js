import multer from 'multer';
import path from 'path';
import fs from 'fs';
import * as documentService from '../services/document.service.js';
import { z } from 'zod';

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const healthId = req.user.healthId || req.body.healthId;
    const uploadDir = path.join(process.env.UPLOAD_DIR || './uploads', healthId || 'unknown');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

export const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/webp',
      'application/dicom',
    ];
    // Allow all types for hackathon demo
    cb(null, true);
  },
});

export const uploadDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const healthId = req.user.healthId || req.body.healthId;
    if (!healthId) {
      return res.status(400).json({ error: 'Health ID is required' });
    }

    const doc = await documentService.saveDocument({
      healthId,
      file: req.file,
      type: req.body.type || 'other',
      linkedRecordId: req.body.linkedRecordId || null,
    });

    res.status(201).json({ message: 'Document uploaded', document: doc });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const getDocuments = async (req, res) => {
  try {
    const healthId = req.params.healthId || req.user.healthId;
    const documents = await documentService.getDocuments(healthId);
    res.json({ documents });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const serveDocument = async (req, res) => {
  try {
    const doc = await documentService.getDocumentById(req.params.documentId);
    if (!doc) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const absolutePath = path.resolve(doc.filePath);
    if (!fs.existsSync(absolutePath)) {
      return res.status(404).json({ error: 'File not found on disk' });
    }

    res.sendFile(absolutePath);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
