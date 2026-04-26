import express           from 'express';
import helmet            from 'helmet';
import rateLimit         from 'express-rate-limit';
import type { Request, Response, NextFunction } from 'express';
import { authRouter }    from './routes/auth';
import { apiRouter }     from './routes/index';

export const app = express();

// Security headers
app.use(helmet());

// Body parsing (16kb limit — reports/exports use S3 presigned URLs, not request body)
app.use(express.json({ limit: '16kb' }));

// Global rate limit: 100 req / 15 min per IP
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      100,
  standardHeaders: true,
  legacyHeaders:   false,
}));

// Stricter rate limit on auth endpoints: 10 attempts / 15 min per IP
app.use('/auth', rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      10,
  message:  { error: 'Too many auth attempts, please try again later' },
}));

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/auth',    authRouter);
app.use('/api/v1',  apiRouter);

// Health check (no auth required)
app.get('/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date() }));

// ── Global error handler ──────────────────────────────────────────────────────
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[Unhandled]', err.message);
  res.status(500).json({
    success: false,
    data:    null,
    error:   process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
  });
});
