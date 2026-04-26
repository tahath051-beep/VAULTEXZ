// Redis cache — separate from BullMQ connection
// Used for: CoA lookups, FX rates, session data, report caching

import Redis from 'ioredis';

export const cache = new Redis({
  host:     process.env.REDIS_HOST     || 'localhost',
  port:     Number(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  db:       1,  // database 1 for cache, database 0 for BullMQ
  enableReadyCheck: false,
});

cache.on('error', (err) => {
  console.error('Cache Redis error:', err);
});

const DEFAULT_TTL = 3600;  // 1 hour

export async function cacheGet<T>(key: string): Promise<T | null> {
  const val = await cache.get(key);
  return val ? (JSON.parse(val) as T) : null;
}

export async function cacheSet<T>(
  key: string,
  value: T,
  ttlSeconds = DEFAULT_TTL
): Promise<void> {
  await cache.setex(key, ttlSeconds, JSON.stringify(value));
}

export async function cacheDel(key: string): Promise<void> {
  await cache.del(key);
}

// Cache key helpers
export const CacheKeys = {
  chartOfAccounts: (tenantId: string) => `coa:${tenantId}`,
  symbolConfig:    (tenantId: string) => `symbols:${tenantId}`,
  fxRates:         (tenantId: string, date: string) => `fx:${tenantId}:${date}`,
  eodReport:       (tenantId: string, date: string) => `report:${tenantId}:${date}`,
};
