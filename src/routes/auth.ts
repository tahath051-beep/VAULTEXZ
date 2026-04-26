// Auth routes: login, refresh, logout
// POST /auth/login   → { accessToken, refreshToken }
// POST /auth/refresh → { accessToken }
// POST /auth/logout  → 200 (revokes refresh token)

import { Router }   from 'express';
import bcrypt       from 'bcryptjs';
import { pool }     from '../config/database';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  storeRefreshToken,
  revokeRefreshToken,
  isRefreshTokenValid,
} from '../config/auth';
import { authenticate } from '../middleware/auth';

export const authRouter = Router();

// ── Login ─────────────────────────────────────────────────────────────────────
authRouter.post('/login', async (req, res) => {
  const { email, password } = req.body as { email?: string; password?: string };

  if (!email || !password) {
    return res.status(400).json({ error: 'email and password are required' });
  }

  const db = await pool.connect();
  try {
    const { rows: [user] } = await db.query<{
      id: string; tenant_id: string; role_id: string;
      email: string; password_hash: string | null; is_active: boolean;
    }>(
      `SELECT id, tenant_id, role_id, email, password_hash, is_active
       FROM users
       WHERE email = $1`,
      [email.toLowerCase().trim()]
    );

    if (!user || !user.is_active || !user.password_hash) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const payload = {
      sub:      user.id,
      tenantId: user.tenant_id,
      roleId:   user.role_id,
      email:    user.email,
    };

    const accessToken  = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    await storeRefreshToken(user.id, refreshToken);
    await db.query(`UPDATE users SET last_login = NOW() WHERE id = $1`, [user.id]);

    return res.json({ accessToken, refreshToken });
  } finally {
    db.release();
  }
});

// ── Refresh ───────────────────────────────────────────────────────────────────
authRouter.post('/refresh', async (req, res) => {
  const { refreshToken } = req.body as { refreshToken?: string };

  if (!refreshToken) {
    return res.status(400).json({ error: 'refreshToken is required' });
  }

  try {
    const payload = verifyRefreshToken(refreshToken);
    const valid   = await isRefreshTokenValid(payload.sub, refreshToken);

    if (!valid) {
      return res.status(401).json({ error: 'Refresh token revoked or invalid' });
    }

    const accessToken = signAccessToken({
      sub:      payload.sub,
      tenantId: payload.tenantId,
      roleId:   payload.roleId,
      email:    payload.email,
    });

    return res.json({ accessToken });
  } catch {
    return res.status(401).json({ error: 'Invalid refresh token' });
  }
});

// ── Logout ────────────────────────────────────────────────────────────────────
authRouter.post('/logout', authenticate, async (req, res) => {
  await revokeRefreshToken(req.user.sub);
  return res.json({ message: 'Logged out successfully' });
});
