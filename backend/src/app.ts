import express, { Application, Request, Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from './config/env';
import { globalRateLimiter } from './middleware/rateLimiter';
import { errorHandler } from './middleware/errorHandler';

import authRouter from './modules/auth/auth.router';
import productsRouter from './modules/products/products.router';
import cartRouter from './modules/cart/cart.router';
import ordersRouter from './modules/orders/orders.router';
import farmersRouter from './modules/farmers/farmers.router';
import groupBuyRouter from './modules/groupbuys/groupbuys.router';
import compareRouter from './modules/compare/compare.router';
import notificationsRouter from './modules/notifications/notifications.router';
import adminRouter from './modules/admin/admin.router';
import uploadRouter from './modules/upload/upload.router';
import aiRouter from './modules/ai/ai.router';

const app: Application = express();

app.use(helmet());
app.use(cors({ origin: env.corsOrigin, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(globalRateLimiter);

app.get('/health', (_req: Request, res: Response) => {
  res.json({ success: true, data: { status: 'ok', timestamp: new Date().toISOString() } });
});
app.get('/api/health', (_req: Request, res: Response) => {
  res.status(200).json({ success: true, data: { status: 'ok', timestamp: new Date().toISOString() } });
});

app.use('/api/auth', authRouter);
app.use('/api/products', productsRouter);
app.use('/api/cart', cartRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/farmers', farmersRouter);
app.use('/api/group-buys', groupBuyRouter);
app.use('/api/compare', compareRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/admin', adminRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/ai', aiRouter);

app.use(errorHandler);

export default app;

