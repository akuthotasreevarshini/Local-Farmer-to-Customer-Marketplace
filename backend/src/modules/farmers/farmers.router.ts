import { Router, Request, Response, NextFunction } from 'express';
import { authenticate, requireRole } from '../../middleware/auth';
import { getPublicFarmerProfile, getMyFarmerProfile, updateMyFarmerProfile, verifyFarmer } from './farmers.service';
import { FarmerProfile } from '../../models/FarmerProfile';
import { Product } from '../../models/Product';

const router = Router();

// Map endpoint — all verified farmers with coordinates
router.get('/map/all', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const profiles = await FarmerProfile.find().populate('userId', 'name').lean();
    const enriched = await Promise.all(profiles.map(async (p) => {
      const productCount = await Product.countDocuments({ farmerId: p.userId, status: 'active' });
      return { ...p, productCount };
    }));
    res.json({ success: true, data: enriched });
  } catch (e) { next(e); }
});

router.get('/profile/me', authenticate, requireRole('farmer'), async (req: Request, res: Response, next: NextFunction) => {
  try { res.json({ success: true, data: await getMyFarmerProfile(req.user!._id) }); } catch (e) { next(e); }
});
router.patch('/profile/me', authenticate, requireRole('farmer'), async (req: Request, res: Response, next: NextFunction) => {
  try { res.json({ success: true, data: await updateMyFarmerProfile(req.user!._id, req.body as Parameters<typeof updateMyFarmerProfile>[1]) }); } catch (e) { next(e); }
});
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try { res.json({ success: true, data: await getPublicFarmerProfile(String(req.params['id'] ?? '')) }); } catch (e) { next(e); }
});
router.put('/:id/verify', authenticate, requireRole('admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, rejectionReason } = req.body as { status: 'verified' | 'rejected'; rejectionReason?: string };
    res.json({ success: true, data: await verifyFarmer(String(req.params['id'] ?? ''), status, rejectionReason) });
  } catch (e) { next(e); }
});

export default router;
