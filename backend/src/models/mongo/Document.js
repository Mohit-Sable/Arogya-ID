import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const documentSchema = new mongoose.Schema({
  healthId: {
    type: String,
    required: true,
    index: true,
  },
  fileName: {
    type: String,
    required: true,
  },
  filePath: {
    type: String,
    required: true,
  },
  mimeType: {
    type: String,
    default: 'application/octet-stream',
  },
  type: {
    type: String,
    enum: ['report', 'xray', 'prescription_scan', 'lab_result', 'other'],
    default: 'other',
  },
  uploadedAt: {
    type: Date,
    default: Date.now,
  },
  linkedRecordId: {
    type: String,
    default: null,
  },
});

const MongooseDocument = mongoose.models.Document || mongoose.model('Document', documentSchema);

import fs from 'fs';
import path from 'path';

const DATA_FILE = path.resolve('./data/documents.json');

const loadDocsFromDisk = () => {
  try {
    if (!fs.existsSync(path.dirname(DATA_FILE))) {
      fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
    }
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, 'utf-8');
      return JSON.parse(data || '[]');
    }
  } catch (err) {
    console.error('Error loading fallback docs:', err.message);
  }
  return [];
};

const saveDocsToDisk = (docs) => {
  try {
    if (!fs.existsSync(path.dirname(DATA_FILE))) {
      fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(docs, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving fallback docs:', err.message);
  }
};

let memoryDocuments = loadDocsFromDisk();

class QueryHelper {
  constructor(data) {
    this._data = [...data];
  }

  sort(sortObj) {
    if (sortObj && sortObj.uploadedAt === -1) {
      this._data.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
    } else if (sortObj && sortObj.uploadedAt === 1) {
      this._data.sort((a, b) => new Date(a.uploadedAt) - new Date(b.uploadedAt));
    }
    return this;
  }

  lean() {
    return this;
  }

  then(resolve, reject) {
    return Promise.resolve(this._data).then(resolve, reject);
  }
}

const Document = {
  create: async (item) => {
    if (mongoose.connection.readyState === 1) {
      return MongooseDocument.create(item);
    }
    memoryDocuments = loadDocsFromDisk();
    const doc = {
      _id: uuidv4(),
      uploadedAt: item.uploadedAt || new Date(),
      ...item,
    };
    memoryDocuments.push(doc);
    saveDocsToDisk(memoryDocuments);
    return doc;
  },

  find: (filter = {}) => {
    if (mongoose.connection.readyState === 1) {
      return MongooseDocument.find(filter);
    }
    memoryDocuments = loadDocsFromDisk();
    const matches = memoryDocuments.filter((doc) => {
      return Object.keys(filter).every((k) => doc[k] === filter[k]);
    });
    return new QueryHelper(matches);
  },

  findById: async (id) => {
    if (mongoose.connection.readyState === 1) {
      return MongooseDocument.findById(id);
    }
    memoryDocuments = loadDocsFromDisk();
    return memoryDocuments.find((d) => d._id === id || d.id === id) || null;
  },

  deleteMany: async (filter = {}) => {
    if (mongoose.connection.readyState === 1) {
      return MongooseDocument.deleteMany(filter);
    }
    memoryDocuments = loadDocsFromDisk();
    const initialLen = memoryDocuments.length;
    for (let i = memoryDocuments.length - 1; i >= 0; i--) {
      const match = Object.keys(filter).every((k) => memoryDocuments[i][k] === filter[k]);
      if (match) {
        memoryDocuments.splice(i, 1);
      }
    }
    saveDocsToDisk(memoryDocuments);
    return { deletedCount: initialLen - memoryDocuments.length };
  },
};

export default Document;
