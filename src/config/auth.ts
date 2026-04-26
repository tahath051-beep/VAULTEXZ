// JWT + refresh token config
// Access token: short-lived (15min)
// Refresh token: long-lived (7d), stored in Redis with revocation support

import jwt from 'jsonwebtoken';
import { redis } from './redis';

const ACCESS_SECRET  = process.env.JWT_ACCESS_SECRET  || 'change_me_access';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'change_me_refresh';
const ACCESS_TTL     = '15m';
const REFRESH_TTL    = 7 * 24 * 60 * 60; // 7 days in seconds

export interface JWTPayload {
  sub:      string;   // user UUID
  tenantId: string;
  roleId:   string;
  email:    string;
}

export function signAccessToken(payload: JWTPayload): string {
  return jwt.sign(payload, ACCESS_SECRET, { expiresIn: ACCESS_TTL });
}

export function signRefreshToken(payload: JWTPayload): string {
  return jwt.sign(payload, REFRESH_SECRET, { expiresIn: REFRESH_TTL });
}

export function verifyAccessToken(token: string): JWTPayload {
  return jwt.verify(token, ACCESS_SECRET) as JWTPayload;
}

export function verifyRefreshToken(token: string): JWTPayload {
  return jwt.verify(token, REFRESH_SECRET) as JWTPayload;
}

// Store refresh token in Redis (allows revocation)
export async function storeRefreshToken(userId: string, token: string): Promise<void> {
  await redis.setex(`refresh:${userId}`, REFRESH_TTL, token);
}

export async function revokeRefreshToken(userId: string): Promise<void> {
  await redis.del(`refresh:${userId}`);
}

export async function isRefreshTokenValid(userId: string, token: string): Promise<boolean> {
  const stored = await redis.get(`refresh:${userId}`);
  return stored === token;
}
