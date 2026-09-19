import { DataTypes } from 'sequelize';
import { sequelize } from '../../config/db.js';

const AccessLog = sequelize.define('AccessLog', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  healthId: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  accessedBy: {
    type: DataTypes.INTEGER,
    allowNull: true, // null for emergency (unauthenticated) access
  },
  accessedByName: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  role: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  ipAddress: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  timestamp: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  fieldsReturned: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  wasEmergencyMode: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
});

export default AccessLog;
