import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../../middleware/auth';
import { Notification } from '../../models/Notification';
import { Types } from 'mongoose';

const router = Router();

router.get('/unread-count', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const count = await Notification.countDocuments({ userId: req.user!._id, isRead: false });
    res.json({ success: true, data: { count } });
  } catch (e) { next(e); }
});

router.patch('/read-all', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    await Notification.updateMany({ userId: req.user!._id, isRead: false }, { $set: { isRead: true } });
    res.json({ success: true, data: { message: 'All notifications marked as read.' } });
  } catch (e) { next(e); }
});

router.get('/', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const q = req.query as Record<string, string>;
    const page = Number(q['page']) || 1;
    const limit = Math.min(Number(q['limit']) || 20, 50);
    const skip = (page - 1) * limit;
    const [notifications, total] = await Promise.all([
      Notification.find({ userId: req.user!._id }).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Notification.countDocuments({ userId: req.user!._id }),
    ]);
    res.json({ success: true, data: { notifications, total, page, totalPages: Math.ceil(total / limit) } });
  } catch (e) { next(e); }
});

router.patch('/:id/read', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!Types.ObjectId.isValid(String(req.params['id'] ?? ''))) return res.status(400).json({ success: false, message: 'Invalid ID.' });
    await Notification.findOneAndUpdate({ _id: req.params['id'], userId: req.user!._id }, { $set: { isRead: true } });
    return res.json({ success: true, data: { message: 'Marked as read.' } });
  } catch (e) { next(e); }
});

export default router;

