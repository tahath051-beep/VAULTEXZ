// JWT authentication middleware
// Validates Bearer token, attaches decoded payload to req.user

import type { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../config/auth';

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;

  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authorization header missing or malformed' });
    return;
  }

  const token = header.slice(7);

  try {
    req.user = verifyAccessToken(token);
    next();
  } catch {
    res.status(401).json({ error: 'Token expired or invalid' });
  }
}
