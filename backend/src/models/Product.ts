import { Schema, model, Document, Types } from 'mongoose';

export type ProductCategory =
  | 'Vegetables'
  | 'Fruits'
  | 'Grains & Pulses'
  | 'Dairy & Eggs'
  | 'Herbs & Spices'
  | 'Flowers'
  | 'Other';

export const PRODUCT_CATEGORIES: ProductCategory[] = [
  'Vegetables',
  'Fruits',
  'Grains & Pulses',
  'Dairy & Eggs',
  'Herbs & Spices',
  'Flowers',
  'Other',
];

export interface IProduct extends Document {
  _id: Types.ObjectId;
  farmerId: Types.ObjectId;           // ref: User (farmer)
  name: string;                       // 1–100 chars
  category: ProductCategory;
  description: string;                // 1–1000 chars
  unit: 'kg' | 'g' | 'litre' | 'piece' | 'bunch' | 'dozen';
  pricePerUnit: number;               // 0.01–999999.99
  deliveryCharge: number;             // ≥ 0
  availableQuantity: number;          // 0–99999
  harvestDate: Date;                  // not in future
  images: string[];                   // Cloudinary URLs, max 5
  status: 'active' | 'inactive' | 'out-of-stock';
  averageRating: number;              // 0–5, one decimal place
  reviewCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const productSchema = new Schema<IProduct>(
  {
    farmerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: true,
      minlength: 1,
      maxlength: 100,
      trim: true,
    },
    category: {
      type: String,
      enum: PRODUCT_CATEGORIES,
      required: true,
    },
    description: {
      type: String,
      required: true,
      minlength: 1,
      maxlength: 1000,
      trim: true,
    },
    unit: {
      type: String,
      enum: ['kg', 'g', 'litre', 'piece', 'bunch', 'dozen'] as const,
      required: true,
    },
    pricePerUnit: {
      type: Number,
      required: true,
      min: 0.01,
      max: 999999.99,
    },
    deliveryCharge: {
      type: Number,
      required: true,
      min: 0,
    },
    availableQuantity: {
      type: Number,
      required: true,
      min: 0,
      max: 99999,
    },
    harvestDate: {
      type: Date,
      required: true,
    },
    images: {
      type: [String],
      default: [],
      validate: {
        validator: (arr: string[]) => arr.length <= 5,
        message: 'A product may have at most 5 images.',
      },
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'out-of-stock'] as const,
      default: 'active',
      required: true,
    },
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    reviewCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true }
);

// Indexes
productSchema.index({ farmerId: 1 });
productSchema.index({ category: 1 });
productSchema.index({ status: 1 });
productSchema.index({ availableQuantity: 1 });
productSchema.index({ pricePerUnit: 1 });
productSchema.index({ status: 1, harvestDate: -1 });
// Full-text search on name and description
productSchema.index({ name: 'text', description: 'text' });

export const Product = model<IProduct>('Product', productSchema);
