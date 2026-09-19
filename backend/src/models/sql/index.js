import User from './User.js';
import HealthIdMapping from './HealthIdMapping.js';
import AccessLog from './AccessLog.js';
import ConsentRecord from './ConsentRecord.js';

// Associations
User.hasOne(HealthIdMapping, { foreignKey: 'userId', as: 'healthIdMapping' });
HealthIdMapping.belongsTo(User, { foreignKey: 'userId' });

export { User, HealthIdMapping, AccessLog, ConsentRecord };
