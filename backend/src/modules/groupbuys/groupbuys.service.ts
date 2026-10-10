import { GroupBuy } from '../../models/GroupBuy';
import { GroupBuyParticipant } from '../../models/GroupBuyParticipant';
import { Product } from '../../models/Product';
import { Notification } from '../../models/Notification';
import { AppError } from '../../middleware/errorHandler';
import { Types } from 'mongoose';

export async function listOpenGroupBuys({ page = 1, limit = 10 }: { page?: number; limit?: number }) {
  const filter = { status: 'open', expiresAt: { $gt: new Date() } };
  const skip = (page - 1) * limit;
  const [groupBuys, total] = await Promise.all([
    GroupBuy.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit)
      .populate('productId', 'name unit images category').populate('farmerId', 'name').lean(),
    GroupBuy.countDocuments(filter),
  ]);
  return { groupBuys, total, page, totalPages: Math.ceil(total / limit) };
}

export async function getGroupBuyById(id: string) {
  if (!Types.ObjectId.isValid(id)) throw new AppError('Invalid group buy ID.', 400);
  const gb = await GroupBuy.findById(id).populate('productId', 'name unit images category pricePerUnit').populate('farmerId', 'name').lean();
  if (!gb) throw new AppError('Group buy not found.', 404);
  const participantCount = await GroupBuyParticipant.countDocuments({ groupBuyId: id });
  return { ...gb, participantCount };
}

export async function createGroupBuy(farmerId: string, body: { productId: string; discountedPricePerUnit: number; minimumQuantity: number; expiresAt: string }) {
  if (!Types.ObjectId.isValid(body.productId)) throw new AppError('Invalid product ID.', 400);
  const product = await Product.findOne({ _id: body.productId, farmerId });
  if (!product) throw new AppError('Product not found or access denied.', 404);
  return GroupBuy.create({ ...body, farmerId, committedQuantity: 0, status: 'open' });
}

export async function joinGroupBuy(groupBuyId: string, customerId: string, quantity: number) {
  if (!Types.ObjectId.isValid(groupBuyId)) throw new AppError('Invalid group buy ID.', 400);
  const gb = await GroupBuy.findById(groupBuyId);
  if (!gb) throw new AppError('Group buy not found.', 404);
  if (gb.status !== 'open') throw new AppError('This group buy is no longer open.', 400);
  if (gb.expiresAt < new Date()) throw new AppError('This group buy has expired.', 400);

  const existing = await GroupBuyParticipant.findOne({ groupBuyId, customerId });
  const oldQty = existing?.quantity ?? 0;
  const diff = quantity - oldQty;

  if (existing) {
    existing.quantity = quantity;
    await existing.save();
  } else {
    await GroupBuyParticipant.create({ groupBuyId, customerId, quantity });
  }

  gb.committedQuantity = Math.max(0, gb.committedQuantity + diff);
  if (gb.committedQuantity >= gb.minimumQuantity && gb.status === 'open') {
    gb.status = 'confirmed';
    const participants = await GroupBuyParticipant.find({ groupBuyId });
    for (const p of participants) {
      await Notification.create({ userId: p.customerId, title: 'Group Buy Confirmed!', message: `The group buy for this product has reached its goal.`, type: 'groupbuy_confirmed', isRead: false });
    }
  }
  await gb.save();
  return gb;
}

export async function leaveGroupBuy(groupBuyId: string, customerId: string) {
  if (!Types.ObjectId.isValid(groupBuyId)) throw new AppError('Invalid group buy ID.', 400);
  const participant = await GroupBuyParticipant.findOneAndDelete({ groupBuyId, customerId });
  if (!participant) throw new AppError('You are not participating in this group buy.', 404);
  await GroupBuy.findByIdAndUpdate(groupBuyId, { $inc: { committedQuantity: -participant.quantity } });
  return { message: 'Left group buy.' };
}
