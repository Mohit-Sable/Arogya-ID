import { jest } from '@jest/globals';
import jwt from 'jsonwebtoken';

// Set env vars for tests
process.env.JWT_SECRET = 'test-secret-key';
process.env.MONGO_URI = 'mongodb://localhost:27017/healthid_test';
process.env.SQL_DIALECT = 'sqlite';
process.env.SQL_STORAGE = ':memory:';

// Mock the authenticate middleware
const { authenticate } = await import('../src/middleware/auth.middleware.js');

describe('Auth Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = { headers: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
  });

  test('should reject request with no token', () => {
    authenticate(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.any(String) })
    );
    expect(next).not.toHaveBeenCalled();
  });

  test('should reject request with invalid token', () => {
    req.headers.authorization = 'Bearer invalid-token-here';
    authenticate(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  test('should reject request with malformed authorization header', () => {
    req.headers.authorization = 'NotBearer some-token';
    authenticate(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  test('should pass with valid token and attach user to req', () => {
    const payload = { userId: 1, role: 'patient', healthId: 'test-uuid', name: 'Test User' };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
    req.headers.authorization = `Bearer ${token}`;

    authenticate(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user).toBeDefined();
    expect(req.user.userId).toBe(1);
    expect(req.user.role).toBe('patient');
    expect(req.user.healthId).toBe('test-uuid');
    expect(req.user.name).toBe('Test User');
  });

  test('should reject expired token', () => {
    const payload = { userId: 1, role: 'patient', healthId: 'test-uuid', name: 'Test' };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '0s' });
    req.headers.authorization = `Bearer ${token}`;

    // Small delay to ensure expiration
    setTimeout(() => {
      authenticate(req, res, next);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    }, 100);
  });
});
