import { Router, Request, Response, NextFunction } from 'express';
import { Product } from '../../models/Product';
import { FarmerProfile } from '../../models/FarmerProfile';
import { Types } from 'mongoose';

const router = Router();

function normalizeToKgPrice(price: number, unit: string): number | null {
  if (unit === 'kg') return price;
  if (unit === 'g') return price * 1000;
  return null; // cannot normalize litre, piece, etc to kg
}

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const name = String(req.query['name'] ?? '').trim();
    if (!name) return res.json({ success: true, data: { products: [], lowestPrice: null, query: '' } });

    const products = await Product.find({ name: { $regex: name, $options: 'i' }, status: 'active' })
      .populate('farmerId', 'name').limit(30).lean();

    const farmerIds = [...new Set(products.map((p) => String((p.farmerId as { _id: unknown })?._id ?? p.farmerId)))];
    const profiles = await FarmerProfile.find({ userId: { $in: farmerIds } }).lean();
    const profileMap = new Map(profiles.map((fp) => [String(fp.userId), fp]));

    const enriched = products.map((p) => {
      const fid = String((p.farmerId as { _id: unknown })?._id ?? p.farmerId);
      const fp = profileMap.get(fid);
      const normalizedPricePerKg = normalizeToKgPrice(p.pricePerUnit, p.unit);
      return {
        _id: p._id,
        name: p.name,
        unit: p.unit,
        pricePerUnit: p.pricePerUnit,
        normalizedPricePerKg,
        deliveryCharge: p.deliveryCharge,
        availableQuantity: p.availableQuantity,
        harvestDate: p.harvestDate,
        averageRating: p.averageRating,
        images: p.images,
        farmer: { _id: fid, name: (p.farmerId as { name?: string })?.name ?? '', district: fp?.district ?? '', state: fp?.state ?? '', farmName: fp?.farmName ?? '' },
      };
    });

    // Sort: those with normalized price first (ascending), then unnormalized
    enriched.sort((a, b) => {
      if (a.normalizedPricePerKg !== null && b.normalizedPricePerKg !== null) return a.normalizedPricePerKg - b.normalizedPricePerKg;
      if (a.normalizedPricePerKg !== null) return -1;
      if (b.normalizedPricePerKg !== null) return 1;
      return a.pricePerUnit - b.pricePerUnit;
    });

    const normalized = enriched.filter((p) => p.normalizedPricePerKg !== null);
    const lowestPrice = normalized.length > 0 ? normalized[0]!.normalizedPricePerKg : null;

    return res.json({ success: true, data: { products: enriched, lowestPrice, query: name } });
  } catch (e) { next(e); }
});

export default router;
