import { Router, Request, Response, NextFunction } from 'express';
import { authenticate, requireRole } from '../../middleware/auth';
import { listOpenGroupBuys, getGroupBuyById, createGroupBuy, joinGroupBuy, leaveGroupBuy } from './groupbuys.service';

const router = Router();
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const q = req.query as Record<string, string>;
    res.json({ success: true, data: await listOpenGroupBuys({ page: Number(q['page']) || 1, limit: Number(q['limit']) || 10 }) });
  } catch (e) { next(e); }
});
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try { res.json({ success: true, data: await getGroupBuyById(String(req.params['id'] ?? '')) }); } catch (e) { next(e); }
});
router.post('/', authenticate, requireRole('farmer'), async (req: Request, res: Response, next: NextFunction) => {
  try { res.status(201).json({ success: true, data: await createGroupBuy(req.user!._id, req.body as Parameters<typeof createGroupBuy>[1]) }); } catch (e) { next(e); }
});
router.post('/:id/join', authenticate, requireRole('customer'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { quantity } = req.body as { quantity: number };
    res.json({ success: true, data: await joinGroupBuy(String(req.params['id'] ?? ''), req.user!._id, Number(quantity)) });
  } catch (e) { next(e); }
});
router.post('/:id/leave', authenticate, requireRole('customer'), async (req: Request, res: Response, next: NextFunction) => {
  try { res.json({ success: true, data: await leaveGroupBuy(String(req.params['id'] ?? ''), req.user!._id) }); } catch (e) { next(e); }
});
export default router;

