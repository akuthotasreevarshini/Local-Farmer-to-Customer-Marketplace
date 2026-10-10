import { Schema, model, Document, Types } from 'mongoose';

export interface IFavorite extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;       // ref: User
  type: 'product' | 'farmer';
  targetId: Types.ObjectId;     // ref: Product or User depending on type
  createdAt: Date;
}

const favoriteSchema = new Schema<IFavorite>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: ['product', 'farmer'] as const,
      required: true,
    },
    targetId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Unique compound index: a user can only favorite a given target once
favoriteSchema.index(
  { userId: 1, type: 1, targetId: 1 },
  { unique: true }
);

export const Favorite = model<IFavorite>('Favorite', favoriteSchema);
