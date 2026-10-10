/**
 * Environment variable validation.
 * Called once at startup — throws immediately if any HARD-required var is absent.
 *
 * Hard-required (server cannot function without these):
 *   MONGODB_URI, JWT_ACCESS_SECRET, JWT_REFRESH_SECRET, CORS_ORIGIN
 *
 * Soft-required (server boots but affected features degrade gracefully):
 *   CLOUDINARY_* — only needed for image uploads; routes return 503 when unset.
 */

const HARD_REQUIRED_VARS = [
  'MONGODB_URI',
  'JWT_ACCESS_SECRET',
  'JWT_REFRESH_SECRET',
  'CORS_ORIGIN',
] as const;

const SOFT_REQUIRED_VARS = [
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
] as const;

/** Placeholder values that count as "not set" */
const PLACEHOLDER_PREFIXES = [
  'replace_with',
  'your_cloudinary',
  '<user>',
  '<password>',
];

function isPlaceholder(value: string): boolean {
  const lower = value.toLowerCase();
  return PLACEHOLDER_PREFIXES.some((p) => lower.startsWith(p) || lower.includes(p));
}

export function validateEnv(): void {
  const missing: string[] = [];

  for (const key of HARD_REQUIRED_VARS) {
    const val = process.env[key];
    if (!val || isPlaceholder(val)) {
      missing.push(key);
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
        'Copy .env.example to .env and fill in the values.'
    );
  }

  // Warn (but do not crash) for soft-required vars
  const softMissing: string[] = [];
  for (const key of SOFT_REQUIRED_VARS) {
    const val = process.env[key];
    if (!val || isPlaceholder(val)) {
      softMissing.push(key);
    }
  }

  if (softMissing.length > 0) {
    console.warn(
      `[env] Warning: ${softMissing.join(', ')} are not configured. ` +
        'Image upload endpoints will be unavailable until these are set.'
    );
  }
}

/** Whether Cloudinary is fully configured */
export function isCloudinaryConfigured(): boolean {
  return SOFT_REQUIRED_VARS.every((k) => {
    const val = process.env[k];
    return val && !isPlaceholder(val);
  });
}

export const env = {
  port: parseInt(process.env['PORT'] ?? '5000', 10),
  nodeEnv: (process.env['NODE_ENV'] ?? 'development') as
    | 'development'
    | 'production'
    | 'test',
  mongoUri: process.env['MONGODB_URI'] as string,
  jwtAccessSecret: process.env['JWT_ACCESS_SECRET'] as string,
  jwtAccessExpiry: process.env['JWT_ACCESS_EXPIRY'] ?? '15m',
  jwtRefreshSecret: process.env['JWT_REFRESH_SECRET'] as string,
  jwtRefreshExpiry: process.env['JWT_REFRESH_EXPIRY'] ?? '7d',
  corsOrigin: process.env['CORS_ORIGIN'] as string,
  cloudinaryCloudName: process.env['CLOUDINARY_CLOUD_NAME'] ?? '',
  cloudinaryApiKey: process.env['CLOUDINARY_API_KEY'] ?? '',
  cloudinaryApiSecret: process.env['CLOUDINARY_API_SECRET'] ?? '',
  rateLimitMaxRequests: parseInt(
    process.env['RATE_LIMIT_MAX_REQUESTS'] ?? '10',
    10
  ),
  rateLimitWindowMs: parseInt(
    process.env['RATE_LIMIT_WINDOW_MS'] ?? '900000',
    10
  ),
  cookieSecure: process.env['COOKIE_SECURE'] === 'true',
} as const;
