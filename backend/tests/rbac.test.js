import { jest } from '@jest/globals';

process.env.JWT_SECRET = 'test-secret-key';

const { authorize } = await import('../src/middleware/rbac.middleware.js');

describe('RBAC Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {};
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
  });

  test('should reject if no user is attached to request', () => {
    const middleware = authorize('hospital');
    middleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  test('should reject if user role is not in allowed roles', () => {
    req.user = { userId: 1, role: 'patient', name: 'Test' };
    const middleware = authorize('hospital', 'insurer');
    middleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  test('should allow if user role is in allowed roles', () => {
    req.user = { userId: 1, role: 'hospital', name: 'Dr. Test' };
    const middleware = authorize('hospital', 'insurer');
    middleware(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  test('should allow patient role when patient is in allowed roles', () => {
    req.user = { userId: 1, role: 'patient', name: 'Test' };
    const middleware = authorize('patient');
    middleware(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  test('should reject emergency_responder from hospital-only routes', () => {
    req.user = { userId: 1, role: 'emergency_responder', name: 'Responder' };
    const middleware = authorize('hospital');
    middleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  test('should allow multiple roles simultaneously', () => {
    const middleware = authorize('patient', 'hospital', 'insurer');

    // Test patient
    req.user = { userId: 1, role: 'patient' };
    middleware(req, res, next);
    expect(next).toHaveBeenCalledTimes(1);

    // Test hospital
    next.mockClear();
    req.user = { userId: 2, role: 'hospital' };
    middleware(req, res, next);
    expect(next).toHaveBeenCalledTimes(1);

    // Test pharmacist (should fail)
    next.mockClear();
    res.status.mockClear();
    req.user = { userId: 3, role: 'pharmacist' };
    middleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });
});
