import { DataTypes } from 'sequelize';
import { sequelize } from '../../config/db.js';

const HealthIdMapping = sequelize.define('HealthIdMapping', {
  healthId: {
    type: DataTypes.STRING,
    primaryKey: true,
    allowNull: false,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
}, {
  timestamps: true,
  updatedAt: false, // Only createdAt needed
});

export default HealthIdMapping;
