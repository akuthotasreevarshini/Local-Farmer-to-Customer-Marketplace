import { Schema, model, Document, Types } from 'mongoose';

export type NotificationType =
  | 'order_created'
  | 'order_status_changed'
  | 'groupbuy_confirmed'
  | 'groupbuy_expired'
  | 'review_approved'
  | 'review_rejected'
  | 'farmer_verified'
  | 'farmer_rejected'
  | 'product_deactivated'
  | 'new_review';

export const NOTIFICATION_TYPES: NotificationType[] = [
  'order_created',
  'order_status_changed',
  'groupbuy_confirmed',
  'groupbuy_expired',
  'review_approved',
  'review_rejected',
  'farmer_verified',
  'farmer_rejected',
  'product_deactivated',
  'new_review',
];

export interface INotification extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;   // ref: User
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  createdAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: NOTIFICATION_TYPES,
      required: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Compound indexes
notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, isRead: 1 });

export const Notification = model<INotification>('Notification', notificationSchema);
