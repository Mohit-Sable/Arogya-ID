import { DataTypes } from 'sequelize';
import { sequelize } from '../../config/db.js';

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  passwordHash: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  role: {
    type: DataTypes.ENUM('patient', 'hospital', 'insurer', 'emergency_responder', 'pharmacist'),
    allowNull: false,
    defaultValue: 'patient',
  },
  healthId: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  // Patient profile fields
  bloodGroup: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  allergies: {
    type: DataTypes.TEXT, // JSON array stored as text
    allowNull: true,
    defaultValue: '[]',
    get() {
      const raw = this.getDataValue('allergies');
      try { return JSON.parse(raw || '[]'); } catch { return []; }
    },
    set(val) {
      this.setDataValue('allergies', JSON.stringify(val || []));
    },
  },
  emergencyContact: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  majorConditions: {
    type: DataTypes.TEXT,
    allowNull: true,
    defaultValue: '[]',
    get() {
      const raw = this.getDataValue('majorConditions');
      try { return JSON.parse(raw || '[]'); } catch { return []; }
    },
    set(val) {
      this.setDataValue('majorConditions', JSON.stringify(val || []));
    },
  },
  chronicConditions: {
    type: DataTypes.TEXT,
    allowNull: true,
    defaultValue: '[]',
    get() {
      const raw = this.getDataValue('chronicConditions');
      try { return JSON.parse(raw || '[]'); } catch { return []; }
    },
    set(val) {
      this.setDataValue('chronicConditions', JSON.stringify(val || []));
    },
  },
  currentMedications: {
    type: DataTypes.TEXT,
    allowNull: true,
    defaultValue: '[]',
    get() {
      const raw = this.getDataValue('currentMedications');
      try { return JSON.parse(raw || '[]'); } catch { return []; }
    },
    set(val) {
      this.setDataValue('currentMedications', JSON.stringify(val || []));
    },
  },
  pastSurgeries: {
    type: DataTypes.TEXT,
    allowNull: true,
    defaultValue: '[]',
    get() {
      const raw = this.getDataValue('pastSurgeries');
      try { return JSON.parse(raw || '[]'); } catch { return []; }
    },
    set(val) {
      this.setDataValue('pastSurgeries', JSON.stringify(val || []));
    },
  },
});

export default User;
