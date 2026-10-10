import { Router, Request, Response, NextFunction } from 'express';
import { authenticate, requireRole } from '../../middleware/auth';
import { getProducts, getProductById, createProduct, updateProduct, deleteProduct, getFarmerProducts } from './products.service';

const router = Router();

router.get('/farmer/mine', authenticate, requireRole('farmer'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await getFarmerProducts(req.user!._id);
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const q = req.query as Record<string, string>;
    const data = await getProducts({ search: q['search'], category: q['category'], sort: q['sort'], page: Number(q['page']) || 1, limit: Number(q['limit']) || 12 });
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await getProductById(String(req.params['id'] ?? ''));
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

router.post('/', authenticate, requireRole('farmer'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await createProduct(req.user!._id, req.body as Parameters<typeof createProduct>[1]);
    res.status(201).json({ success: true, data });
  } catch (err) { next(err); }
});

router.put('/:id', authenticate, requireRole('farmer'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await updateProduct(String(req.params['id'] ?? ''), req.user!._id, req.body as Parameters<typeof updateProduct>[2]);
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

router.delete('/:id', authenticate, requireRole('farmer'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await deleteProduct(String(req.params['id'] ?? ''), req.user!._id);
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

export default router;

