import { Schema, model, Document, Types } from 'mongoose';

export interface IReview extends Document {
  _id: Types.ObjectId;
  productId: Types.ObjectId;    // ref: Product
  customerId: Types.ObjectId;   // ref: User
  orderId: Types.ObjectId;      // ref: Order
  rating: number;               // integer 1–5
  comment?: string;             // max 1000 chars
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
}

const reviewSchema = new Schema<IReview>(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    customerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    orderId: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
      validate: {
        validator: (v: number) => Number.isInteger(v),
        message: 'Rating must be an integer between 1 and 5.',
      },
    },
    comment: {
      type: String,
      maxlength: 1000,
      trim: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'] as const,
      default: 'pending',
      required: true,
    },
  },
  { timestamps: true }
);

// Indexes
reviewSchema.index({ productId: 1 });
reviewSchema.index({ customerId: 1 });
reviewSchema.index({ status: 1 });
// Unique compound index: one review per product per order per customer
reviewSchema.index(
  { productId: 1, customerId: 1, orderId: 1 },
  { unique: true }
);

export const Review = model<IReview>('Review', reviewSchema);
