// Write an immutable row to audit_log.
// Must be called within the same transaction as the state change.
import type { PoolClient } from 'pg';

export interface AuditParams {
  tenantId:   string;
  userId:     string;
  action:     string;   // CREATE | UPDATE | APPROVE | REJECT | DELETE
  module:     string;   // matches permissions.module values
  recordId?:  string;
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
  ipAddress?: string;
}

export async function writeAuditLog(db: PoolClient, p: AuditParams): Promise<void> {
  await db.query(
    `INSERT INTO audit_log
       (tenant_id, user_id, action, module, record_id,
        old_values, new_values, ip_address)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
    [
      p.tenantId,  p.userId,   p.action,   p.module,
      p.recordId  ?? null,
      p.oldValues ? JSON.stringify(p.oldValues) : null,
      p.newValues ? JSON.stringify(p.newValues) : null,
      p.ipAddress ?? null,
    ]
  );
}
