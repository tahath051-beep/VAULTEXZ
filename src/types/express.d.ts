import type { JWTPayload } from '../config/auth';

// Augment Express Request to carry the authenticated user after JWT verification
declare global {
  namespace Express {
    interface Request {
      user: JWTPayload;
    }
  }
}
