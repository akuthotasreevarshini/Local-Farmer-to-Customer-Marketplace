import { Schema, model, Document, Types } from 'mongoose';

export interface IUser extends Document {
  _id: Types.ObjectId;
  name: string;             // 1â€“100 chars
  email: string;            // RFC 5321, max 254 chars, unique index
  passwordHash: string;     // bcrypt, cost â‰¥ 12
  role: 'customer' | 'farmer' | 'admin';
  isActive: boolean;        // false = suspended
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
      minlength: 1,
      maxlength: 100,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 254,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['customer', 'farmer', 'admin'] as const,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Indexes
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });

export const User = model<IUser>('User', userSchema);

