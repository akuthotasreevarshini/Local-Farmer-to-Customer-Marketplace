import { Product, ProductCategory } from '../../models/Product';
import { FarmerProfile } from '../../models/FarmerProfile';
import { AppError } from '../../middleware/errorHandler';
import mongoose, { Types } from 'mongoose';

export async function getProducts(query: {
  search?: string; category?: string; sort?: string; page?: number; limit?: number;
}) {
  const { search, category, sort, page = 1, limit = 12 } = query;
  const safeLimit = Math.min(Number(limit) || 12, 50);
  const safePage = Math.max(Number(page) || 1, 1);
  const skip = (safePage - 1) * safeLimit;

  const filter: Record<string, unknown> = { status: 'active' };
  if (search) filter['$text'] = { $search: search };
  if (category) filter['category'] = category;

  let sortObj: Record<string, 1 | -1> = { createdAt: -1 };
  if (sort === 'price_asc') sortObj = { pricePerUnit: 1 };
  else if (sort === 'price_desc') sortObj = { pricePerUnit: -1 };
  else if (sort === 'rating') sortObj = { averageRating: -1 };

  const [products, total] = await Promise.all([
    Product.find(filter).sort(sortObj).skip(skip).limit(safeLimit).populate('farmerId', 'name').lean(),
    Product.countDocuments(filter),
  ]);

  // Enrich with FarmerProfile
  const farmerIds = [...new Set(products.map((p) => String((p.farmerId as { _id: unknown })?._id ?? p.farmerId)))];
  const profiles = await FarmerProfile.find({ userId: { $in: farmerIds } }).lean();
  const profileMap = new Map(profiles.map((fp) => [String(fp.userId), fp]));

  const enriched = products.map((p) => {
    const fid = String((p.farmerId as { _id: unknown })?._id ?? p.farmerId);
    const profile = profileMap.get(fid);
    return { ...p, farmerProfile: profile ? { district: profile.district, state: profile.state, farmName: profile.farmName } : null };
  });

  return { products: enriched, total, page: safePage, totalPages: Math.ceil(total / safeLimit) };
}

export async function getProductById(id: string) {
  if (!Types.ObjectId.isValid(id)) throw new AppError('Invalid product ID.', 400);
  const product = await Product.findById(id).populate('farmerId', 'name email').lean();
  if (!product) throw new AppError('Product not found.', 404);
  const profile = await FarmerProfile.findOne({ userId: (product.farmerId as { _id: unknown })?._id ?? product.farmerId }).lean();
  return { ...product, farmerProfile: profile };
}

export async function createProduct(farmerId: string, body: {
  name: string; category: ProductCategory; description: string;
  unit: string; pricePerUnit: number; deliveryCharge: number;
  availableQuantity: number; harvestDate: string; images?: string[];
}) {
  const product = await Product.create({ ...body, farmerId, status: 'active', averageRating: 0, reviewCount: 0 });
  return product;
}

export async function updateProduct(id: string, farmerId: string, body: Partial<{
  name: string; category: string; description: string; unit: string;
  pricePerUnit: number; deliveryCharge: number; availableQuantity: number;
  harvestDate: string; images: string[]; status: string;
}>) {
  if (!Types.ObjectId.isValid(id)) throw new AppError('Invalid product ID.', 400);
  const product = await Product.findOne({ _id: id, farmerId });
  if (!product) throw new AppError('Product not found or access denied.', 404);
  Object.assign(product, body);
  await product.save();
  return product;
}

export async function deleteProduct(id: string, farmerId: string) {
  if (!Types.ObjectId.isValid(id)) throw new AppError('Invalid product ID.', 400);
  const product = await Product.findOne({ _id: id, farmerId });
  if (!product) throw new AppError('Product not found or access denied.', 404);
  product.status = 'inactive';
  await product.save();
  return { message: 'Product deactivated.' };
}

export async function getFarmerProducts(farmerId: string) {
  return Product.find({ farmerId }).sort({ createdAt: -1 }).lean();
}
