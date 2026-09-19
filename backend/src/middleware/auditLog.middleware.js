import { AccessLog } from '../models/sql/index.js';

/**
 * Audit log middleware factory.
 * Wraps res.json to log the access BEFORE sending the response.
 * @param {boolean} isEmergency - Whether this is an emergency mode access.
 */
export const auditLog = (isEmergency = false) => {
  return async (req, res, next) => {
    // Store the original json method
    const originalJson = res.json.bind(res);

    res.json = async (data) => {
      try {
        const healthId = req.params.healthId || req.body?.healthId || req.query?.healthId;

        if (healthId) {
          await AccessLog.create({
            healthId,
            accessedBy: req.user?.userId || null,
            accessedByName: req.user?.name || (isEmergency ? 'Emergency Access' : 'Unknown'),
            role: req.user?.role || (isEmergency ? 'emergency_responder' : 'anonymous'),
            ipAddress: req.ip || req.connection?.remoteAddress || 'unknown',
            timestamp: new Date(),
            fieldsReturned: isEmergency
              ? 'bloodGroup,allergies,emergencyContact,majorConditions'
              : 'full_record',
            wasEmergencyMode: isEmergency,
          });
        }
      } catch (err) {
        console.error('Audit log error:', err.message);
      }

      return originalJson(data);
    };

    next();
  };
};
