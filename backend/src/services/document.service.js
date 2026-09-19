import path from 'path';
import fs from 'fs';
import Document from '../models/mongo/Document.js';

/**
 * Save a document record after file upload.
 */
export const saveDocument = async ({ healthId, file, type, linkedRecordId }) => {
  const doc = new Document({
    healthId,
    fileName: file.originalname,
    filePath: file.path,
    mimeType: file.mimetype,
    type: type || 'other',
    uploadedAt: new Date(),
    linkedRecordId: linkedRecordId || null,
  });

  await doc.save();
  return doc;
};

/**
 * Get all documents for a patient.
 */
export const getDocuments = async (healthId) => {
  return Document.find({ healthId }).sort({ uploadedAt: -1 });
};

/**
 * Get a single document by ID.
 */
export const getDocumentById = async (documentId) => {
  return Document.findById(documentId);
};

/**
 * Ensure the upload directory exists for a given Health ID.
 */
export const ensureUploadDir = (healthId) => {
  const uploadBase = process.env.UPLOAD_DIR || './uploads';
  const dir = path.join(uploadBase, healthId);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
};
