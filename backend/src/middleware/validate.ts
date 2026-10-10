/**
 * validate.ts
 * Zod schema validation middleware factory.
 *
 * Usage:
 *   import { validate } from '../middleware/validate';
 *   import { z } from 'zod';
 *
 *   const registerSchema = z.object({
 *     body: z.object({ email: z.string().email(), password: z.string().min(8) }),
 *   });
 *
 *   router.post('/register', validate(registerSchema), registerHandler);
 *
 * On failure returns HTTP 400:
 *   { success: false, message: 'Validation failed.', errors: { field: ['message', ...] } }
 */

import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

// ── validate factory ──────────────────────────────────────────────────────
/**
 * Creates an Express middleware that validates `req` against the given Zod
 * schema.  The schema should describe an object with optional keys:
 *   `body`, `query`, `params`
 *
 * @example
 *   const schema = z.object({ body: z.object({ name: z.string() }) });
 *   router.post('/', validate(schema), handler);
 */
export function validate<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse({
      body: req.body,
      query: req.query,
      params: req.params,
    });

    if (result.success) {
      // Merge validated + coerced values back onto req so handlers can rely
      // on the typed output (e.g. numbers parsed from query strings).
      const data = result.data as {
        body?: Record<string, unknown>;
        query?: Record<string, unknown>;
        params?: Record<string, unknown>;
      };

      if (data.body !== undefined) Object.assign(req.body, data.body);
      if (data.query !== undefined) Object.assign(req.query, data.query);
      if (data.params !== undefined) Object.assign(req.params, data.params);

      next();
      return;
    }

    // Map ZodError flatten output → { field: string[] }
    const errors = formatZodErrors(result.error);

    res.status(400).json({
      success: false,
      message: 'Validation failed.',
      errors,
    });
  };
}

// ── Helper ────────────────────────────────────────────────────────────────

function formatZodErrors(error: ZodError): Record<string, string[]> {
  const fieldErrors: Record<string, string[]> = {};

  for (const issue of error.issues) {
    // issue.path looks like ['body', 'email'] — drop the top-level key
    // (body / query / params) so callers see plain field names.
    const pathParts = issue.path.slice(1).map(String);
    const key = pathParts.length > 0 ? pathParts.join('.') : '_root';

    if (!fieldErrors[key]) fieldErrors[key] = [];
    fieldErrors[key].push(issue.message);
  }

  return fieldErrors;
}
