import { Schema, model, Document, Types } from 'mongoose';

export type OrderStatus =
  | 'placed'
  | 'confirmed'
  | 'packed'
  | 'dispatched'
  | 'delivered'
  | 'cancelled';

export interface IOrderItem {
  productId: Types.ObjectId;
  farmerId: Types.ObjectId;
  name: string;
  unit: string;
  priceSnapshot: number;
  quantity: number;
}

export interface IStatusHistoryEntry {
  status: OrderStatus;
  changedAt: Date;
  changedBy: Types.ObjectId;
}

export interface IOrder extends Document {
  _id: Types.ObjectId;
  customerId: Types.ObjectId;
  items: IOrderItem[];
  deliveryAddress: {
    line1: string;
    line2?: string;
    district: string;
    state: string;
    pincode: string;
  };
  status: OrderStatus;
  paymentMethod: 'cod' | 'gateway';
  grandTotal: number;
  statusHistory: IStatusHistoryEntry[];
  estimatedDeliveryDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const orderItemSchema = new Schema<IOrderItem>(
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
    name: {
      type: String,
      required: true,
    },
    unit: {
      type: String,
      required: true,
    },
    priceSnapshot: {
      type: Number,
      required: true,
      min: 0,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
  },
  { _id: false }
);

const statusHistoryEntrySchema = new Schema<IStatusHistoryEntry>(
  {
    status: {
      type: String,
      enum: ['placed', 'confirmed', 'packed', 'dispatched', 'delivered', 'cancelled'] as const,
      required: true,
    },
    changedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    changedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { _id: false }
);

const deliveryAddressSchema = new Schema(
  {
    line1: { type: String, required: true },
    line2: { type: String },
    district: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true, match: /^\d{6}$/ },
  },
  { _id: false }
);

const orderSchema = new Schema<IOrder>(
  {
    customerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    items: {
      type: [orderItemSchema],
      required: true,
      validate: {
        validator: (arr: IOrderItem[]) => arr.length > 0,
        message: 'An order must contain at least one item.',
      },
    },
    deliveryAddress: {
      type: deliveryAddressSchema,
      required: true,
    },
    status: {
      type: String,
      enum: ['placed', 'confirmed', 'packed', 'dispatched', 'delivered', 'cancelled'] as const,
      default: 'placed',
      required: true,
    },
    paymentMethod: {
      type: String,
      enum: ['cod', 'gateway'] as const,
      required: true,
    },
    grandTotal: {
      type: Number,
      required: true,
      min: 0,
    },
    statusHistory: {
      type: [statusHistoryEntrySchema],
      default: [],
    },
    estimatedDeliveryDate: {
      type: Date,
    },
  },
  { timestamps: true }
);

// Indexes
orderSchema.index({ customerId: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ 'items.farmerId': 1 });

export const Order = model<IOrder>('Order', orderSchema);
