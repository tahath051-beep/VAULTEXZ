// Module 6: User Management
// GET  /users              list users in tenant
// GET  /users/roles        list available roles for tenant
// POST /users              create user (hashes password)
// PATCH /users/:id         update name, email, role
// PATCH /users/:id/deactivate   deactivate user

import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { pool }              from '../config/database';
import { authenticate }      from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';
import { ok, fail }          from '../utils/response';
import { writeAuditLog }     from '../utils/audit';

export const usersRouter = Router();
usersRouter.use(authenticate);

// ── Roles lookup (needed for create/update) ───────────────────────────────────
usersRouter.get('/roles',
  requirePermission('user_management', 'edit'),
  async (req, res, next) => {
    const { tenantId } = req.user;
    const db = await pool.connect();
    try {
      const { rows } = await db.query(
        `SELECT id, name, description FROM roles
         WHERE tenant_id = $1 ORDER BY name`,
        [tenantId]
      );
      return ok(res, { roles: rows });
    } catch (err) { next(err); } finally { db.release(); }
  }
);

// ── List ──────────────────────────────────────────────────────────────────────
usersRouter.get('/',
  requirePermission('user_management', 'edit'),
  async (req, res, next) => {
    const { tenantId } = req.user;
    const db = await pool.connect();
    try {
      const { rows } = await db.query(
        `SELECT u.id, u.email, u.full_name, u.is_active, u.last_login, u.created_at,
           r.name AS role_name
         FROM users u
         LEFT JOIN roles r ON u.role_id = r.id
         WHERE u.tenant_id = $1
         ORDER BY u.created_at DESC`,
        [tenantId]
      );
      return ok(res, { users: rows });
    } catch (err) { next(err); } finally { db.release(); }
  }
);

// ── Create ────────────────────────────────────────────────────────────────────
usersRouter.post('/',
  requirePermission('user_management', 'edit'),
  async (req, res, next) => {
    const { tenantId, sub: creatorId } = req.user;
    const { email, password, full_name, role_id } =
      req.body as Record<string, string>;

    if (!email || !password || !full_name) {
      return fail(res, 'email, password, and full_name are required');
    }
    if (password.length < 8) {
      return fail(res, 'password must be at least 8 characters');
    }

    const db = await pool.connect();
    try {
      await db.query('BEGIN');

      // Verify role belongs to this tenant (if provided)
      if (role_id) {
        const { rows: [role] } = await db.query(
          `SELECT id FROM roles WHERE id = $1 AND tenant_id = $2`,
          [role_id, tenantId]
        );
        if (!role) return fail(res, 'Role not found for this tenant', 404);
      }

      const passwordHash = await bcrypt.hash(password, 12);

      const { rows: [user] } = await db.query(
        `INSERT INTO users (tenant_id, email, password_hash, full_name, role_id)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, email, full_name, role_id, is_active, created_at`,
        [tenantId, email.toLowerCase().trim(), passwordHash,
         full_name.trim(), role_id ?? null]
      );

      await writeAuditLog(db, {
        tenantId, userId: creatorId, action: 'CREATE', module: 'user_management',
        recordId: user.id,
        newValues: { email: user.email, full_name: user.full_name, role_id },
        ipAddress: req.ip,
      });

      await db.query('COMMIT');
      return ok(res, user, 201);
    } catch (err: any) {
      await db.query('ROLLBACK');
      if (err.code === '23505') return fail(res, 'Email already registered', 409);
      next(err);
    } finally { db.release(); }
  }
);

// ── Update ────────────────────────────────────────────────────────────────────
usersRouter.patch('/:id',
  requirePermission('user_management', 'edit'),
  async (req, res, next) => {
    const { tenantId, sub: editorId } = req.user;
    const { full_name, email, role_id } = req.body as Record<string, string>;
    const db = await pool.connect();
    try {
      await db.query('BEGIN');

      const { rows: [before] } = await db.query(
        `SELECT id, email, full_name, role_id, is_active
         FROM users WHERE id = $1 AND tenant_id = $2`,
        [req.params.id, tenantId]
      );
      if (!before) return fail(res, 'User not found', 404);

      if (role_id) {
        const { rows: [role] } = await db.query(
          `SELECT id FROM roles WHERE id = $1 AND tenant_id = $2`,
          [role_id, tenantId]
        );
        if (!role) return fail(res, 'Role not found for this tenant', 404);
      }

      const { rows: [updated] } = await db.query(
        `UPDATE users
         SET full_name = COALESCE($3, full_name),
             email     = COALESCE($4, email),
             role_id   = COALESCE($5::uuid, role_id)
         WHERE id = $1 AND tenant_id = $2
         RETURNING id, email, full_name, role_id, is_active, created_at`,
        [req.params.id, tenantId, full_name ?? null,
         email ? email.toLowerCase().trim() : null, role_id ?? null]
      );

      await writeAuditLog(db, {
        tenantId, userId: editorId, action: 'UPDATE', module: 'user_management',
        recordId: updated.id, oldValues: before, newValues: updated, ipAddress: req.ip,
      });

      await db.query('COMMIT');
      return ok(res, updated);
    } catch (err: any) {
      await db.query('ROLLBACK');
      if (err.code === '23505') return fail(res, 'Email already in use', 409);
      next(err);
    } finally { db.release(); }
  }
);

// ── Deactivate ────────────────────────────────────────────────────────────────
usersRouter.patch('/:id/deactivate',
  requirePermission('user_management', 'edit'),
  async (req, res, next) => {
    const { tenantId, sub: editorId } = req.user;
    const db = await pool.connect();
    try {
      await db.query('BEGIN');

      const { rows: [user] } = await db.query(
        `UPDATE users SET is_active = false
         WHERE id = $1 AND tenant_id = $2 AND is_active = true
         RETURNING id, email, full_name, is_active`,
        [req.params.id, tenantId]
      );
      if (!user) return fail(res, 'User not found or already inactive', 404);

      await writeAuditLog(db, {
        tenantId, userId: editorId, action: 'DELETE', module: 'user_management',
        recordId: user.id,
        oldValues: { is_active: true }, newValues: { is_active: false },
        ipAddress: req.ip,
      });

      await db.query('COMMIT');
      return ok(res, user);
    } catch (err) {
      await db.query('ROLLBACK');
      next(err);
    } finally { db.release(); }
  }
);
