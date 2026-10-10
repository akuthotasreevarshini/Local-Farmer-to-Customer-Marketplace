/**
 * auth.ts
 * JWT verification middleware and role-guard factory.
 *
 * Usage:
 *   router.get('/protected', authenticate, handler);
 *   router.delete('/admin-only', authenticate, requireRole('admin'), handler);
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';

// ── Augment Express Request so downstream handlers can read req.user ──────
export interface AuthUser {
  _id: string;
  email: string;
  role: 'customer' | 'farmer' | 'admin';
  isActive: boolean;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

// ── JWT payload shape ─────────────────────────────────────────────────────
interface JwtPayload {
  sub: string;      // user _id
  email: string;
  role: AuthUser['role'];
  isActive: boolean;
}

// ── authenticate ──────────────────────────────────────────────────────────
/**
 * Verifies the JWT access token supplied in `Authorization: Bearer <token>`.
 * On success attaches `req.user`; on failure returns HTTP 401.
 */
export function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      message: 'Authentication required. Please provide a valid Bearer token.',
    });
    return;
  }

  const token = authHeader.slice(7); // strip "Bearer "

  try {
    const payload = jwt.verify(token, env.jwtAccessSecret) as JwtPayload;

    req.user = {
      _id: payload.sub,
      email: payload.email,
      role: payload.role,
      isActive: payload.isActive,
    };

    next();
  } catch (err) {
    const message =
      err instanceof jwt.TokenExpiredError
        ? 'Access token has expired. Please refresh your session.'
        : 'Invalid access token.';

    res.status(401).json({ success: false, message });
  }
}

// ── requireRole ───────────────────────────────────────────────────────────
/**
 * Role-guard factory. Must be used after `authenticate`.
 *
 * @example
 *   router.post('/products', authenticate, requireRole('farmer'), createProduct);
 */
export function requireRole(
  ...allowedRoles: Array<AuthUser['role']>
): (req: Request, res: Response, next: NextFunction) => void {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      // Should not happen if authenticate ran first, but guard defensively
      res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: `Access denied. This resource requires the ${allowedRoles.join(' or ')} role.`,
      });
      return;
    }

    next();
  };
}
