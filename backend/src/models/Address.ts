import { Schema, model, Document, Types } from 'mongoose';

export interface IAddress extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;   // ref: User
  label: string;
  line1: string;
  line2?: string;
  district: string;
  state: string;
  pincode: string;          // 6-digit Indian pincode
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const addressSchema = new Schema<IAddress>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    label: {
      type: String,
      required: true,
      trim: true,
    },
    line1: {
      type: String,
      required: true,
      trim: true,
    },
    line2: {
      type: String,
      trim: true,
    },
    district: {
      type: String,
      required: true,
      trim: true,
    },
    state: {
      type: String,
      required: true,
      trim: true,
    },
    pincode: {
      type: String,
      required: true,
      match: /^\d{6}$/,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Indexes
addressSchema.index({ userId: 1 });

export const Address = model<IAddress>('Address', addressSchema);
