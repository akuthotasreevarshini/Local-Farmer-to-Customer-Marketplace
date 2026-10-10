import { createHash, randomBytes } from 'node:crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../../models/User';
import { RefreshToken } from '../../models/RefreshToken';
import { FarmerProfile } from '../../models/FarmerProfile';
import { AppError } from '../../middleware/errorHandler';
import { env } from '../../config/env';

const BCRYPT_COST = 12;
const REFRESH_TOKEN_BYTES = 40;
const REFRESH_TOKEN_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;

export function validatePasswordComplexity(password: string): { valid: boolean; reason?: string } {
  if (password.length < 8) return { valid: false, reason: 'Password must be at least 8 characters.' };
  if (!/[A-Z]/.test(password)) return { valid: false, reason: 'Password must contain an uppercase letter.' };
  if (!/[a-z]/.test(password)) return { valid: false, reason: 'Password must contain a lowercase letter.' };
  if (!/\d/.test(password)) return { valid: false, reason: 'Password must contain a digit.' };
  if (!/[^A-Za-z0-9]/.test(password)) return { valid: false, reason: 'Password must contain a special character.' };
  return { valid: true };
}

function hashToken(raw: string): string {
  return createHash('sha256').update(raw).digest('hex');
}

function signAccessToken(user: { _id: unknown; email: string; role: string; isActive: boolean }): string {
  const opts: jwt.SignOptions = { expiresIn: (env.jwtAccessExpiry || "15m") as jwt.SignOptions["expiresIn"] };
  return jwt.sign(
    { sub: String(user._id), email: user.email, role: user.role, isActive: user.isActive },
    env.jwtAccessSecret as string,
    opts,
  );
}

async function createRefreshToken(userId: string): Promise<string> {
  const raw = randomBytes(REFRESH_TOKEN_BYTES).toString('hex');
  const hashed = hashToken(raw);
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS);
  await RefreshToken.create({ userId, token: hashed, expiresAt, isRevoked: false });
  return raw;
}

export async function register(
  name: string,
  email: string,
  password: string,
  role: 'customer' | 'farmer',
) {
  const complexity = validatePasswordComplexity(password);
  if (!complexity.valid) throw new AppError(complexity.reason ?? 'Invalid password.', 400);

  const existing = await User.findOne({ email: email.toLowerCase().trim() });
  if (existing) throw new AppError('Email already in use.', 409);

  const passwordHash = await bcrypt.hash(password, BCRYPT_COST);
  const user = await User.create({ name: name.trim(), email: email.toLowerCase().trim(), passwordHash, role, isActive: true });

  if (role === 'farmer') {
    await FarmerProfile.create({
      userId: user._id,
      farmName: name.trim(),
      farmDescription: 'Tell customers about your farm.',
      district: 'Not set',
      state: 'Not set',
      profilePhotoUrl: '',
      contactPhone: '0000000',
      verificationStatus: 'pending',
      easyModeEnabled: false,
    });
  }

  const refreshRaw = await createRefreshToken(String(user._id));
  const accessToken = signAccessToken(user);
  return { user: { _id: user._id, name: user.name, email: user.email, role: user.role, isActive: user.isActive, createdAt: user.createdAt, updatedAt: user.updatedAt }, accessToken, refreshRaw };
}

export async function login(email: string, password: string) {
  const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+passwordHash');
  if (!user) throw new AppError('Invalid email or password.', 401);
  if (!user.isActive) throw new AppError('Account suspended. Contact support.', 403);

  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) throw new AppError('Invalid email or password.', 401);

  const refreshRaw = await createRefreshToken(String(user._id));
  const accessToken = signAccessToken(user);
  return { user: { _id: user._id, name: user.name, email: user.email, role: user.role, isActive: user.isActive, createdAt: user.createdAt, updatedAt: user.updatedAt }, accessToken, refreshRaw };
}

export async function refresh(rawToken: string | undefined) {
  if (!rawToken) throw new AppError('Refresh token missing.', 401);
  const hashed = hashToken(rawToken);
  const stored = await RefreshToken.findOne({ token: hashed, isRevoked: false });
  if (!stored || stored.expiresAt < new Date()) throw new AppError('Refresh token invalid or expired.', 401);

  const user = await User.findById(stored.userId);
  if (!user || !user.isActive) throw new AppError('User not found or inactive.', 401);

  const accessToken = signAccessToken(user);
  return { accessToken };
}

export async function logout(rawToken: string | undefined) {
  if (!rawToken) return;
  const hashed = hashToken(rawToken);
  await RefreshToken.updateOne({ token: hashed }, { isRevoked: true });
}


