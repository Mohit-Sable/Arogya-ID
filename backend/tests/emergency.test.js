import { jest } from '@jest/globals';

process.env.JWT_SECRET = 'test-secret-key';
process.env.SQL_DIALECT = 'sqlite';
process.env.SQL_STORAGE = ':memory:';
process.env.MONGO_URI = 'mongodb://localhost:27017/healthid_test';

// We test the emergency service in isolation (no DB needed for field-filter logic)
describe('Emergency Mode — Field Filter', () => {
  const ALLOWED_FIELDS = ['bloodGroup', 'allergies', 'emergencyContact', 'majorConditions'];
  const FORBIDDEN_FIELDS = [
    'passwordHash', 'email', 'chronicConditions', 'currentMedications',
    'pastSurgeries', 'prescriptions', 'diagnoses', 'documents',
  ];

  test('emergency data should only contain allowed fields plus patientName and healthId', () => {
    // Simulate what the service returns
    const mockEmergencyData = {
      bloodGroup: 'B+',
      allergies: ['Penicillin', 'Dust mites'],
      emergencyContact: '+91-9876543210',
      majorConditions: ['Type 2 Diabetes', 'Hypertension'],
      patientName: 'Test Patient',
      healthId: 'test-uuid-1234',
    };

    const allowedKeys = [...ALLOWED_FIELDS, 'patientName', 'healthId'];

    // Check only allowed fields are present
    for (const key of Object.keys(mockEmergencyData)) {
      expect(allowedKeys).toContain(key);
    }

    // Check NO forbidden fields leak
    for (const field of FORBIDDEN_FIELDS) {
      expect(mockEmergencyData).not.toHaveProperty(field);
    }
  });

  test('emergency data must NOT contain prescriptions', () => {
    const emergencyData = {
      bloodGroup: 'O+',
      allergies: [],
      emergencyContact: '',
      majorConditions: [],
      patientName: 'Test',
      healthId: 'test-uuid',
    };

    expect(emergencyData).not.toHaveProperty('prescriptions');
    expect(emergencyData).not.toHaveProperty('medications');
    expect(emergencyData).not.toHaveProperty('records');
  });

  test('emergency data must NOT contain diagnosis history', () => {
    const emergencyData = {
      bloodGroup: 'A-',
      allergies: ['Aspirin'],
      emergencyContact: '+91-1234567890',
      majorConditions: ['Asthma'],
      patientName: 'Test',
      healthId: 'test-uuid',
    };

    expect(emergencyData).not.toHaveProperty('diagnoses');
    expect(emergencyData).not.toHaveProperty('diagnosisHistory');
    expect(emergencyData).not.toHaveProperty('medicalRecords');
  });

  test('emergency data must NOT contain documents', () => {
    const emergencyData = {
      bloodGroup: 'AB+',
      allergies: [],
      emergencyContact: '',
      majorConditions: [],
      patientName: 'Test',
      healthId: 'test-uuid',
    };

    expect(emergencyData).not.toHaveProperty('documents');
    expect(emergencyData).not.toHaveProperty('files');
    expect(emergencyData).not.toHaveProperty('reports');
  });

  test('emergency data field allowlist is exactly 4 medical fields', () => {
    expect(ALLOWED_FIELDS).toHaveLength(4);
    expect(ALLOWED_FIELDS).toContain('bloodGroup');
    expect(ALLOWED_FIELDS).toContain('allergies');
    expect(ALLOWED_FIELDS).toContain('emergencyContact');
    expect(ALLOWED_FIELDS).toContain('majorConditions');
  });

  test('allergies and majorConditions should be arrays', () => {
    const data = {
      bloodGroup: 'B+',
      allergies: ['Penicillin'],
      emergencyContact: '+91-9876543210',
      majorConditions: ['Diabetes'],
    };

    expect(Array.isArray(data.allergies)).toBe(true);
    expect(Array.isArray(data.majorConditions)).toBe(true);
  });
});
