/**
 * errorHandler.ts
 * Global Express error-handling middleware.
 *
 * Must be mounted LAST in app.ts:
 *   app.use(errorHandler);
 *
 * Produces a uniform JSON envelope:
 *   { success: false, message: string, errors?: Record<string, string[]> }
 */

import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env';

// ── AppError ──────────────────────────────────────────────────────────────
/**
 * Throw (or pass to next()) an AppError anywhere in route handlers to trigger
 * a structured HTTP error response.
 *
 * @example
 *   throw new AppError('Product not found', 404);
 *   next(new AppError('Validation failed', 400, { email: ['Invalid format'] }));
 */
export class AppError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number = 500,
    public readonly errors?: Record<string, string[]>
  ) {
    super(message);
    this.name = 'AppError';
    // Maintains proper prototype chain in transpiled ES5
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

// ── Error response shape ──────────────────────────────────────────────────
interface ErrorResponse {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
}

// ── Global error handler ──────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Operational / expected errors thrown by our own code
  if (err instanceof AppError) {
    const body: ErrorResponse = { success: false, message: err.message };
    if (err.errors) body.errors = err.errors;
    res.status(err.statusCode).json(body);
    return;
  }

  // Mongoose / MongoDB duplicate-key error (code 11000)
  if (isDuplicateKeyError(err)) {
    res.status(409).json({
      success: false,
      message: 'A record with the provided value already exists.',
    });
    return;
  }

  // Mongoose validation error
  if (isMongooseValidationError(err)) {
    const errors: Record<string, string[]> = {};
    for (const [field, detail] of Object.entries(err.errors ?? {})) {
      errors[field] = [(detail as { message: string }).message];
    }
    res.status(400).json({ success: false, message: 'Validation failed.', errors });
    return;
  }

  // JWT errors (should rarely reach here — auth middleware handles them first)
  if (isJwtError(err)) {
    res.status(401).json({ success: false, message: 'Invalid or expired token.' });
    return;
  }

  // Unknown / unexpected errors — hide internals in production
  console.error('[ErrorHandler] Unexpected error:', err);

  const message =
    env.nodeEnv === 'production'
      ? 'An unexpected error occurred. Please try again later.'
      : err instanceof Error
        ? err.message
        : 'An unexpected error occurred.';

  res.status(500).json({ success: false, message });
}

// ── Helpers ───────────────────────────────────────────────────────────────

function isDuplicateKeyError(err: unknown): err is { code: number } {
  return (
    typeof err === 'object' &&
    err !== null &&
    (err as { code?: number }).code === 11000
  );
}

function isMongooseValidationError(
  err: unknown
): err is { name: string; errors: Record<string, unknown> } {
  return (
    typeof err === 'object' &&
    err !== null &&
    (err as { name?: string }).name === 'ValidationError' &&
    typeof (err as { errors?: unknown }).errors === 'object'
  );
}

function isJwtError(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    ['JsonWebTokenError', 'TokenExpiredError', 'NotBeforeError'].includes(
      (err as { name?: string }).name ?? ''
    )
  );
}
