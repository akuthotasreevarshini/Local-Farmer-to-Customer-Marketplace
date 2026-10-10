import { Router, Request, Response, NextFunction } from 'express';
import { authenticate, requireRole } from '../../middleware/auth';
import { User } from '../../models/User';
import { FarmerProfile } from '../../models/FarmerProfile';
import { Product } from '../../models/Product';
import { Order } from '../../models/Order';
import { Types } from 'mongoose';

const router = Router();
const auth = [authenticate, requireRole('admin')];

router.get('/stats', ...auth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const [totalUsers, totalFarmers, totalProducts, totalOrders] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'farmer' }),
      Product.countDocuments({ status: 'active' }),
      Order.countDocuments(),
    ]);
    res.json({ success: true, data: { totalUsers, totalFarmers, totalProducts, totalOrders } });
  } catch (e) { next(e); }
});

router.get('/users', ...auth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const q = req.query as Record<string, string>;
    const page = Number(q['page']) || 1; const limit = 20; const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([User.find().select('-passwordHash').sort({ createdAt: -1 }).skip(skip).limit(limit).lean(), User.countDocuments()]);
    res.json({ success: true, data: { users, total, page, totalPages: Math.ceil(total / limit) } });
  } catch (e) { next(e); }
});

router.get('/farmers', ...auth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const q = req.query as Record<string, string>;
    const page = Number(q['page']) || 1; const limit = 20; const skip = (page - 1) * limit;
    const [profiles, total] = await Promise.all([FarmerProfile.find().populate('userId', 'name email').sort({ createdAt: -1 }).skip(skip).limit(limit).lean(), FarmerProfile.countDocuments()]);
    res.json({ success: true, data: { profiles, total, page, totalPages: Math.ceil(total / limit) } });
  } catch (e) { next(e); }
});

router.patch('/farmers/:id/verify', ...auth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, rejectionReason } = req.body as { status: 'verified' | 'rejected'; rejectionReason?: string };
    if (!Types.ObjectId.isValid(String(req.params['id'] ?? ''))) return res.status(400).json({ success: false, message: 'Invalid ID.' });
    const update: Record<string, unknown> = { verificationStatus: status };
    if (status === 'rejected' && rejectionReason) update['rejectionReason'] = rejectionReason;
    const profile = await FarmerProfile.findOneAndUpdate({ userId: req.params['id'] }, { $set: update }, { new: true });
    return res.json({ success: true, data: profile });
  } catch (e) { next(e); }
});

router.get('/orders', ...auth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const q = req.query as Record<string, string>;
    const page = Number(q['page']) || 1; const limit = 20; const skip = (page - 1) * limit;
    const [orders, total] = await Promise.all([Order.find().sort({ createdAt: -1 }).skip(skip).limit(limit).lean(), Order.countDocuments()]);
    res.json({ success: true, data: { orders, total, page, totalPages: Math.ceil(total / limit) } });
  } catch (e) { next(e); }
});

router.get('/products', ...auth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const q = req.query as Record<string, string>;
    const page = Number(q['page']) || 1; const limit = 20; const skip = (page - 1) * limit;
    const [products, total] = await Promise.all([Product.find().sort({ createdAt: -1 }).skip(skip).limit(limit).populate('farmerId', 'name').lean(), Product.countDocuments()]);
    res.json({ success: true, data: { products, total, page, totalPages: Math.ceil(total / limit) } });
  } catch (e) { next(e); }
});

router.patch('/products/:id/status', ...auth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status } = req.body as { status: string };
    if (!Types.ObjectId.isValid(String(req.params['id'] ?? ''))) return res.status(400).json({ success: false, message: 'Invalid ID.' });
    const product = await Product.findByIdAndUpdate(req.params['id'], { $set: { status } }, { new: true });
    return res.json({ success: true, data: product });
  } catch (e) { next(e); }
});

export default router;

