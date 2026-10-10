/**
 * rateLimiter.ts
 * express-rate-limit configurations.
 *
 * loginRateLimiter   — 10 requests per 15-minute window per IP.
 *                      Applied to POST /api/auth/login (Req 1.10).
 * globalRateLimiter  — Generous general-purpose limiter for all other routes.
 */

import rateLimit from 'express-rate-limit';
import { env } from '../config/env';

// ── Login rate limiter (Req 1.10, 19.1) ──────────────────────────────────
export const loginRateLimiter = rateLimit({
  windowMs: env.rateLimitWindowMs,          // 15 minutes (900 000 ms)
  max: env.rateLimitMaxRequests,            // 10 attempts
  standardHeaders: 'draft-7',              // Return `RateLimit-*` headers
  legacyHeaders: false,
  message: {
    success: false,
    message:
      'Too many login attempts from this IP address. ' +
      'Please try again in 15 minutes.',
  },
  skipSuccessfulRequests: false,            // count every attempt
});

// ── Global / catch-all rate limiter ──────────────────────────────────────
export const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 300,                   // 300 requests per window (reasonable for an API)
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP address. Please try again later.',
  },
});
