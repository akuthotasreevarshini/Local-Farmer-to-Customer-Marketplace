import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { register, login, refresh, logout } from './auth.service';
import { authenticate } from '../../middleware/auth';
import { loginRateLimiter } from '../../middleware/rateLimiter';
import { AppError } from '../../middleware/errorHandler';

const router = Router();

const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: 'strict' as const,
  path: '/',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

function setCookie(res: Response, token: string) {
  const secure = process.env['COOKIE_SECURE'] === 'true';
  res.cookie('refreshToken', token, { ...COOKIE_OPTS, secure });
}

function clearCookie(res: Response) {
  res.clearCookie('refreshToken', { httpOnly: true, sameSite: 'strict', path: '/' });
}

const registerSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email().max(254),
  password: z.string().min(8).max(128),
  role: z.enum(['customer', 'farmer']),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

router.post('/register', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      const errors: Record<string, string[]> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path.join('.') || '_root';
        errors[key] = [...(errors[key] ?? []), issue.message];
      }
      return res.status(400).json({ success: false, message: 'Validation failed.', errors });
    }
    const { name, email, password, role } = parsed.data;
    const result = await register(name, email, password, role);
    setCookie(res, result.refreshRaw);
    return res.status(201).json({ success: true, data: { user: result.user, accessToken: result.accessToken } });
  } catch (err) { return next(err); }
});

router.post('/login', loginRateLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ success: false, message: 'Invalid credentials format.' });
    const result = await login(parsed.data.email, parsed.data.password);
    setCookie(res, result.refreshRaw);
    return res.json({ success: true, data: { user: result.user, accessToken: result.accessToken } });
  } catch (err) { return next(err); }
});

router.post('/refresh', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const raw = (req.cookies as Record<string, string>)['refreshToken'];
    if (!raw) throw new AppError('No refresh token.', 401);
    const result = await refresh(raw);
    return res.json({ success: true, data: result });
  } catch (err) { return next(err); }
});

router.post('/logout', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const raw = (req.cookies as Record<string, string>)['refreshToken'];
    await logout(raw);
    clearCookie(res);
    return res.json({ success: true, data: { message: 'Logged out.' } });
  } catch (err) { return next(err); }
});

router.get('/me', authenticate, (req: Request, res: Response) => {
  res.json({ success: true, data: req.user });
});

export default router;
