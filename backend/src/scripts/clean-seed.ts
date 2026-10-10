import "dotenv/config";
import mongoose from "mongoose";
import { User } from "../models/User";
import { FarmerProfile } from "../models/FarmerProfile";
import { Product } from "../models/Product";

async function clean() {
  await mongoose.connect(process.env["MONGODB_URI"] ?? "mongodb://localhost:27017/farmconnect");
  const user = await User.findOne({ email: "demo.farmer@farmconnect.dev" });
  if (user) {
    await Product.deleteMany({ farmerId: user._id });
    await FarmerProfile.deleteOne({ userId: user._id });
    await User.deleteOne({ _id: user._id });
    console.log("[Clean] Removed demo farmer data. Re-running seed...");
  }
  await mongoose.disconnect();
}
clean().catch(console.error);
