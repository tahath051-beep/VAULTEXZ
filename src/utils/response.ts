// Consistent response envelope: { success, data, error? }
import type { Response } from 'express';

export function ok<T>(res: Response, data: T, status = 200): Response {
  return res.status(status).json({ success: true, data });
}

export function fail(res: Response, error: string, status = 400): Response {
  return res.status(status).json({ success: false, data: null, error });
}

export function created<T>(res: Response, data: T): Response {
  return res.status(201).json({ success: true, data });
}

export function notFound(res: Response, message = 'Not found'): Response {
  return res.status(404).json({ success: false, data: null, error: message });
}
