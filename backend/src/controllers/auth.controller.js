import * as authService from '../services/auth.service.js';
import { getQrCode } from '../services/healthId.service.js';
import { z } from 'zod';

const registerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['patient', 'hospital', 'insurer', 'emergency_responder', 'pharmacist']),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
});

export const register = async (req, res) => {
  try {
    const validated = registerSchema.parse(req.body);
    const result = await authService.register(validated);

    // If patient, also generate QR code
    let qrCode = null;
    if (result.user.healthId) {
      qrCode = await getQrCode(result.user.healthId);
    }

    res.status(201).json({
      message: 'Registration successful',
      token: result.token,
      user: result.user,
      qrCode,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: err.errors });
    }
    res.status(400).json({ error: err.message });
  }
};

export const login = async (req, res) => {
  try {
    const validated = loginSchema.parse(req.body);
    const result = await authService.login(validated);

    res.json({
      message: 'Login successful',
      token: result.token,
      user: result.user,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: err.errors });
    }
    res.status(401).json({ error: err.message });
  }
};

export const getMe = async (req, res) => {
  try {
    const user = await authService.getProfile(req.user.userId);

    let qrCode = null;
    if (user.healthId) {
      qrCode = await getQrCode(user.healthId);
    }

    res.json({ user, qrCode });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
