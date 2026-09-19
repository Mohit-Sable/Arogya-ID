import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { User, HealthIdMapping } from '../models/sql/index.js';

const SALT_ROUNDS = 12;

/**
 * Register a new user.
 * If role is 'patient', generates a Health ID + mapping.
 */
export const register = async ({ name, email, password, role }) => {
  // Check for existing user
  const existing = await User.findOne({ where: { email } });
  if (existing) {
    throw new Error('Email already registered');
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  let healthId = null;
  if (role === 'patient') {
    healthId = uuidv4();
  }

  const user = await User.create({
    name,
    email,
    passwordHash,
    role,
    healthId,
  });

  // Create HealthIdMapping for patients
  if (role === 'patient' && healthId) {
    await HealthIdMapping.create({
      healthId,
      userId: user.id,
    });
  }

  const token = generateToken(user);

  return {
    token,
    user: sanitizeUser(user),
  };
};

/**
 * Login with email + password.
 */
export const login = async ({ email, password }) => {
  const user = await User.findOne({ where: { email } });
  if (!user) {
    throw new Error('Invalid email or password');
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    throw new Error('Invalid email or password');
  }

  const token = generateToken(user);

  return {
    token,
    user: sanitizeUser(user),
  };
};

/**
 * Get user profile by ID.
 */
export const getProfile = async (userId) => {
  const user = await User.findByPk(userId);
  if (!user) {
    throw new Error('User not found');
  }
  return sanitizeUser(user);
};

/**
 * Update patient profile fields.
 */
export const updateProfile = async (userId, updates) => {
  const user = await User.findByPk(userId);
  if (!user) {
    throw new Error('User not found');
  }

  const allowedFields = [
    'name', 'bloodGroup', 'allergies', 'emergencyContact',
    'majorConditions', 'chronicConditions', 'currentMedications', 'pastSurgeries',
  ];

  for (const field of allowedFields) {
    if (updates[field] !== undefined) {
      user[field] = updates[field];
    }
  }

  await user.save();
  return sanitizeUser(user);
};

// --- Helpers ---

function generateToken(user) {
  return jwt.sign(
    {
      userId: user.id,
      role: user.role,
      healthId: user.healthId,
      name: user.name,
    },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );
}

const JSON_ARRAY_FIELDS = [
  'allergies',
  'majorConditions',
  'chronicConditions',
  'currentMedications',
  'pastSurgeries',
];

export function parseJsonArray(val) {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  try {
    let parsed = typeof val === 'string' ? JSON.parse(val) : val;
    if (typeof parsed === 'string') parsed = JSON.parse(parsed);
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch {
    return typeof val === 'string' ? val.split(',').map(s => s.trim()).filter(Boolean) : [];
  }
}

function sanitizeUser(user) {
  const u = user.toJSON ? user.toJSON() : { ...user };
  delete u.passwordHash;
  for (const field of JSON_ARRAY_FIELDS) {
    u[field] = parseJsonArray(u[field]);
  }
  return u;
}
