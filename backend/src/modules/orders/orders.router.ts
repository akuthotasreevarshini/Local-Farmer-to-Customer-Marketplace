import { Router, Request, Response, NextFunction } from 'express';
import { authenticate, requireRole } from '../../middleware/auth';
import { placeOrder, getCustomerOrders, getOrderById, getFarmerOrders, updateOrderStatus, cancelOrder } from './orders.service';
import { OrderStatus } from '../../models/Order';

const router = Router();

router.get('/farmer/mine', authenticate, requireRole('farmer'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const q = req.query as Record<string, string>;
    res.json({ success: true, data: await getFarmerOrders(req.user!._id, { page: Number(q['page']) || 1, limit: Number(q['limit']) || 10, status: q['status'] }) });
  } catch (e) { next(e); }
});
router.post('/', authenticate, requireRole('customer'), async (req: Request, res: Response, next: NextFunction) => {
  try { res.status(201).json({ success: true, data: await placeOrder(req.user!._id, req.body as { addressId?: string; paymentMethod: 'cod' | 'gateway' }) }); } catch (e) { next(e); }
});
router.get('/', authenticate, requireRole('customer'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const q = req.query as Record<string, string>;
    res.json({ success: true, data: await getCustomerOrders(req.user!._id, { page: Number(q['page']) || 1, limit: Number(q['limit']) || 10 }) });
  } catch (e) { next(e); }
});
router.get('/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try { res.json({ success: true, data: await getOrderById(String(req.params['id'] ?? ''), req.user!._id) }); } catch (e) { next(e); }
});
router.put('/:id/status', authenticate, requireRole('farmer'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status } = req.body as { status: OrderStatus };
    res.json({ success: true, data: await updateOrderStatus(String(req.params['id'] ?? ''), req.user!._id, status) });
  } catch (e) { next(e); }
});
router.post('/:id/cancel', authenticate, requireRole('customer'), async (req: Request, res: Response, next: NextFunction) => {
  try { res.json({ success: true, data: await cancelOrder(String(req.params['id'] ?? ''), req.user!._id) }); } catch (e) { next(e); }
});

export default router;

