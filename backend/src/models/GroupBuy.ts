import { Schema, model, Document, Types } from 'mongoose';

export interface IGroupBuy extends Document {
  _id: Types.ObjectId;
  productId: Types.ObjectId;          // ref: Product
  farmerId: Types.ObjectId;           // ref: User (farmer)
  discountedPricePerUnit: number;
  minimumQuantity: number;
  committedQuantity: number;
  expiresAt: Date;
  status: 'open' | 'confirmed' | 'expired';
  createdAt: Date;
  updatedAt: Date;
}

const groupBuySchema = new Schema<IGroupBuy>(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    farmerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    discountedPricePerUnit: {
      type: Number,
      required: true,
      min: 0,
    },
    minimumQuantity: {
      type: Number,
      required: true,
      min: 1,
    },
    committedQuantity: {
      type: Number,
      default: 0,
      min: 0,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['open', 'confirmed', 'expired'] as const,
      default: 'open',
      required: true,
    },
  },
  { timestamps: true }
);

// Indexes
groupBuySchema.index({ productId: 1 });
groupBuySchema.index({ farmerId: 1 });
groupBuySchema.index({ status: 1 });
groupBuySchema.index({ expiresAt: 1 });

export const GroupBuy = model<IGroupBuy>('GroupBuy', groupBuySchema);
