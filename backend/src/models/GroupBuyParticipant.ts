import { Schema, model, Document, Types } from 'mongoose';

export interface IGroupBuyParticipant extends Document {
  _id: Types.ObjectId;
  groupBuyId: Types.ObjectId;   // ref: GroupBuy
  customerId: Types.ObjectId;   // ref: User
  quantity: number;
  createdAt: Date;
}

const groupBuyParticipantSchema = new Schema<IGroupBuyParticipant>(
  {
    groupBuyId: {
      type: Schema.Types.ObjectId,
      ref: 'GroupBuy',
      required: true,
    },
    customerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Unique compound index: a customer can only join a group buy once
groupBuyParticipantSchema.index(
  { groupBuyId: 1, customerId: 1 },
  { unique: true }
);

export const GroupBuyParticipant = model<IGroupBuyParticipant>(
  'GroupBuyParticipant',
  groupBuyParticipantSchema
);
