// RBAC middleware factory
// Usage: router.get('/resource', authenticate, requirePermission('module', 'action'), handler)
//
// Role permissions are cached in Redis for 5 minutes per (tenantId, roleId) pair.
// Cache is invalidated on role_permissions changes via cacheDel('perms:{tenantId}:{roleId}').

import type { Request, Response, NextFunction } from 'express';
import { pool }            from '../config/database';
import { cacheGet, cacheSet } from '../config/cache';

const PERM_CACHE_TTL = 300; // 5 minutes

export function requirePermission(module: string, action: string) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { tenantId, roleId } = req.user;
    const cacheKey = `perms:${tenantId}:${roleId}`;

    let perms = await cacheGet<string[]>(cacheKey);

    if (!perms) {
      const db = await pool.connect();
      try {
        const { rows } = await db.query<{ perm: string }>(
          `SELECT p.module || ':' || p.action AS perm
           FROM role_permissions rp
           JOIN permissions p  ON rp.permission_id = p.id
           JOIN roles        r ON rp.role_id        = r.id
           WHERE r.id = $1 AND r.tenant_id = $2`,
          [roleId, tenantId]
        );
        perms = rows.map(r => r.perm);
        await cacheSet(cacheKey, perms, PERM_CACHE_TTL);
      } finally {
        db.release();
      }
    }

    if (!perms.includes(`${module}:${action}`)) {
      res.status(403).json({
        error:    'Forbidden',
        required: `${module}:${action}`,
      });
      return;
    }

    next();
  };
}
