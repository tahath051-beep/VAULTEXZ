import { Pool, PoolConfig } from 'pg';

const config: PoolConfig = {
  host:     process.env.DB_HOST     || 'localhost',
  port:     Number(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME     || 'forex_accounting',
  user:     process.env.DB_USER     || 'postgres',
  password: process.env.DB_PASSWORD || '',
  max:      Number(process.env.DB_POOL_MAX) || 20,
  idleTimeoutMillis:    30_000,
  connectionTimeoutMillis: 5_000,
};

export const pool = new Pool(config);

pool.on('error', (err) => {
  console.error('Unexpected DB pool error:', err);
  process.exit(1);
});
