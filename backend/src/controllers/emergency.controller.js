import * as emergencyService from '../services/emergencyAccess.service.js';

export const getEmergencyData = async (req, res) => {
  try {
    const { healthId } = req.params;

    // Log access FIRST (before returning any data)
    const ip = req.ip || req.connection?.remoteAddress || 'unknown';
    await emergencyService.logEmergencyAccess(healthId, ip);

    // Fetch ONLY the 4 critical fields
    const data = await emergencyService.getEmergencyData(healthId);

    res.json({ emergency: data });
  } catch (err) {
    if (err.message === 'Health ID not found' || err.message === 'Patient record not found') {
      return res.status(404).json({ error: err.message });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};
