import { FarmerProfile } from '../../models/FarmerProfile';
import { User } from '../../models/User';
import { Product } from '../../models/Product';
import { AppError } from '../../middleware/errorHandler';
import { Types } from 'mongoose';

export async function getPublicFarmerProfile(farmerId: string) {
  if (!Types.ObjectId.isValid(farmerId)) throw new AppError('Invalid farmer ID.', 400);
  const profile = await FarmerProfile.findOne({ userId: farmerId }).populate('userId', 'name email').lean();
  if (!profile) throw new AppError('Farmer not found.', 404);
  const productCount = await Product.countDocuments({ farmerId, status: 'active' });
  const products = await Product.find({ farmerId, status: 'active' }).limit(6).lean();
  return { ...profile, productCount, recentProducts: products };
}

export async function getMyFarmerProfile(userId: string) {
  const profile = await FarmerProfile.findOne({ userId }).populate('userId', 'name email').lean();
  if (!profile) throw new AppError('Farmer profile not found. Please complete registration.', 404);
  return profile;
}

export async function updateMyFarmerProfile(userId: string, body: Partial<{
  farmName: string; farmDescription: string; district: string; state: string; contactPhone: string; easyModeEnabled: boolean;
}>) {
  const profile = await FarmerProfile.findOneAndUpdate({ userId }, { $set: body }, { new: true });
  if (!profile) throw new AppError('Farmer profile not found.', 404);
  return profile;
}

export async function verifyFarmer(farmerId: string, status: 'verified' | 'rejected', rejectionReason?: string) {
  if (!Types.ObjectId.isValid(farmerId)) throw new AppError('Invalid farmer ID.', 400);
  const update: Record<string, unknown> = { verificationStatus: status };
  if (status === 'rejected' && rejectionReason) update['rejectionReason'] = rejectionReason;
  const profile = await FarmerProfile.findOneAndUpdate({ userId: farmerId }, { $set: update }, { new: true });
  if (!profile) throw new AppError('Farmer profile not found.', 404);
  return profile;
}

