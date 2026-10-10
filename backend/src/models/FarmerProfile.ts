import { Schema, model, Document, Types } from 'mongoose';

export interface IFarmerProfile extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;             // ref: User, unique index
  farmName: string;                   // 1â€“100 chars
  farmDescription: string;            // 1â€“1000 chars
  district: string;                   // 1â€“100 chars
  state: string;                      // 1â€“100 chars
  profilePhotoUrl: string;
  contactPhone: string;               // 7â€“15 digits
  verificationStatus: 'pending' | 'verified' | 'rejected';
  rejectionReason?: string;           // 1â€“500 chars
  easyModeEnabled: boolean;
  latitude?: number;
  longitude?: number;
  createdAt: Date;
  updatedAt: Date;
}

const farmerProfileSchema = new Schema<IFarmerProfile>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    farmName: {
      type: String,
      required: true,
      minlength: 1,
      maxlength: 100,
      trim: true,
    },
    farmDescription: {
      type: String,
      required: true,
      minlength: 1,
      maxlength: 1000,
      trim: true,
    },
    district: {
      type: String,
      required: true,
      minlength: 1,
      maxlength: 100,
      trim: true,
    },
    state: {
      type: String,
      required: true,
      minlength: 1,
      maxlength: 100,
      trim: true,
    },
    profilePhotoUrl: { type: String, default: '' },
    contactPhone: {
      type: String,
      required: true,
      minlength: 7,
      maxlength: 15,
    },
    verificationStatus: {
      type: String,
      enum: ['pending', 'verified', 'rejected'] as const,
      default: 'pending',
      required: true,
    },
    rejectionReason: {
      type: String,
      minlength: 1,
      maxlength: 500,
    },
    easyModeEnabled: {
      type: Boolean,
      default: false,
    },
    latitude: { type: Number },
    longitude: { type: Number },
  },
  { timestamps: true }
);

// Indexes
farmerProfileSchema.index({ verificationStatus: 1 });
farmerProfileSchema.index({ district: 1 });
farmerProfileSchema.index({ state: 1 });

export const FarmerProfile = model<IFarmerProfile>('FarmerProfile', farmerProfileSchema);



