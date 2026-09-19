import { DataTypes } from 'sequelize';
import { sequelize } from '../../config/db.js';

const ConsentRecord = sequelize.define('ConsentRecord', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  healthId: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  requestedBy: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  requestedByName: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  requestedByRole: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'denied'),
    allowNull: false,
    defaultValue: 'pending',
  },
  requestedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  decidedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
});

export default ConsentRecord;
