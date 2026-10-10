import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../../middleware/auth';
import { getCart, addToCart, updateCartItem, removeFromCart, clearCart } from './cart.service';

const router = Router();

router.get('/', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try { res.json({ success: true, data: await getCart(req.user!._id) }); } catch (e) { next(e); }
});
router.post('/items', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { productId, quantity } = req.body as { productId: string; quantity: number };
    res.json({ success: true, data: await addToCart(req.user!._id, productId, Number(quantity)) });
  } catch (e) { next(e); }
});
router.put('/items/:productId', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { quantity } = req.body as { quantity: number };
    res.json({ success: true, data: await updateCartItem(req.user!._id, String(req.params['productId'] ?? ''), Number(quantity)) });
  } catch (e) { next(e); }
});
router.delete('/items/:productId', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try { res.json({ success: true, data: await removeFromCart(req.user!._id, String(req.params['productId'] ?? '')) }); } catch (e) { next(e); }
});
router.delete('/', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try { res.json({ success: true, data: await clearCart(req.user!._id) }); } catch (e) { next(e); }
});

export default router;

