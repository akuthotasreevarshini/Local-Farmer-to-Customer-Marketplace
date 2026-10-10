import { Schema, model, Document, Types } from 'mongoose';

export interface IPriceSnapshot extends Document {
  _id: Types.ObjectId;
  productId: Types.ObjectId;    // ref: Product
  farmerId: Types.ObjectId;     // ref: User (farmer)
  pricePerUnit: number;
  deliveryCharge: number;
  timestamp: Date;
}

const priceSnapshotSchema = new Schema<IPriceSnapshot>(
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
    pricePerUnit: {
      type: Number,
      required: true,
      min: 0,
    },
    deliveryCharge: {
      type: Number,
      required: true,
      min: 0,
    },
    timestamp: {
      type: Date,
      required: true,
      default: Date.now,
    },
  },
  { timestamps: false }
);

// Indexes
priceSnapshotSchema.index({ productId: 1 });
priceSnapshotSchema.index({ farmerId: 1 });
priceSnapshotSchema.index({ timestamp: -1 });

export const PriceSnapshot = model<IPriceSnapshot>('PriceSnapshot', priceSnapshotSchema);
