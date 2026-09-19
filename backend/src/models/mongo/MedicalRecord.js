import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const medicalRecordSchema = new mongoose.Schema({
  healthId: {
    type: String,
    required: true,
    index: true,
  },
  type: {
    type: String,
    required: true,
    enum: ['prescription', 'diagnosis', 'surgery', 'vaccination', 'discharge_summary'],
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
  },
  addedBy: {
    type: Number, // User.id from SQL
    required: true,
  },
  addedByName: {
    type: String,
    default: '',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const MongooseMedicalRecord = mongoose.models.MedicalRecord || mongoose.model('MedicalRecord', medicalRecordSchema);

import fs from 'fs';
import path from 'path';

const DATA_FILE = path.resolve('./data/records.json');

const loadRecordsFromDisk = () => {
  try {
    if (!fs.existsSync(path.dirname(DATA_FILE))) {
      fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
    }
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, 'utf-8');
      return JSON.parse(data || '[]');
    }
  } catch (err) {
    console.error('Error loading fallback records:', err.message);
  }
  return [];
};

const saveRecordsToDisk = (records) => {
  try {
    if (!fs.existsSync(path.dirname(DATA_FILE))) {
      fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(records, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving fallback records:', err.message);
  }
};

let memoryRecords = loadRecordsFromDisk();

class QueryHelper {
  constructor(data) {
    this._data = [...data];
  }

  sort(sortObj) {
    if (sortObj && sortObj.createdAt === -1) {
      this._data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (sortObj && sortObj.createdAt === 1) {
      this._data.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
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

const MedicalRecord = {
  create: async (item) => {
    if (mongoose.connection.readyState === 1) {
      return MongooseMedicalRecord.create(item);
    }
    memoryRecords = loadRecordsFromDisk();
    const record = {
      _id: uuidv4(),
      createdAt: item.createdAt || new Date(),
      ...item,
    };
    memoryRecords.push(record);
    saveRecordsToDisk(memoryRecords);
    return record;
  },

  insertMany: async (items) => {
    if (mongoose.connection.readyState === 1) {
      return MongooseMedicalRecord.insertMany(items);
    }
    memoryRecords = loadRecordsFromDisk();
    const created = items.map((item) => ({
      _id: uuidv4(),
      createdAt: item.createdAt || new Date(),
      ...item,
    }));
    memoryRecords.push(...created);
    saveRecordsToDisk(memoryRecords);
    return created;
  },

  deleteMany: async (filter = {}) => {
    if (mongoose.connection.readyState === 1) {
      return MongooseMedicalRecord.deleteMany(filter);
    }
    memoryRecords = loadRecordsFromDisk();
    const initialLen = memoryRecords.length;
    for (let i = memoryRecords.length - 1; i >= 0; i--) {
      const match = Object.keys(filter).every((k) => memoryRecords[i][k] === filter[k]);
      if (match) {
        memoryRecords.splice(i, 1);
      }
    }
    saveRecordsToDisk(memoryRecords);
    return { deletedCount: initialLen - memoryRecords.length };
  },

  find: (filter = {}) => {
    if (mongoose.connection.readyState === 1) {
      return MongooseMedicalRecord.find(filter);
    }
    memoryRecords = loadRecordsFromDisk();
    const matches = memoryRecords.filter((rec) => {
      return Object.keys(filter).every((k) => rec[k] === filter[k]);
    });
    return new QueryHelper(matches);
  },

  findById: async (id) => {
    if (mongoose.connection.readyState === 1) {
      return MongooseMedicalRecord.findById(id);
    }
    memoryRecords = loadRecordsFromDisk();
    return memoryRecords.find((r) => r._id === id || r.id === id) || null;
  },
};

export default MedicalRecord;
