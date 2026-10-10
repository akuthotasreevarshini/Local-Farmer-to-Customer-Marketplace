/**
 * seed.ts - Development seed script
 * Run: npm run seed (from backend/)
 *
 * Creates 3 sample farmers and products for demonstration.
 * Idempotent: safe to run multiple times. Never deletes existing real data.
 * All records are clearly tagged as DEMO data.
 *
 * Excluded from sample data: Toor Dal, Brinjal/Eggplant, Green Chilli,
 * Turmeric Powder, Spinach/Palak, Cauliflower, Lady's Finger/Okra, Cabbage, and Tomatoes.
 */

import 'dotenv/config';

import mongoose from 'mongoose';

import bcrypt from 'bcryptjs';

import { User } from '../models/User';

import { FarmerProfile } from '../models/FarmerProfile';

import { Product } from '../models/Product';



const SEED_PASSWORD = 'Demo@1234';



const FARMERS = [

  {

    email: 'demo.farmer@farmconnect.dev',

    name: 'Demo Farmer (Raju)',

    farmName: 'Raju Organic Farm',

    farmDescription: 'Family-run organic farm in Krishna district, Andhra Pradesh. We grow seasonal vegetables and fruits without chemical pesticides. WARNING: DEMO DATA',

    district: 'Krishna', state: 'Andhra Pradesh',

    contactPhone: '9876543210',

    latitude: 16.5062, longitude: 80.648,

  },

  {

    email: 'lakshmi.farmer@farmconnect.dev',

    name: 'Lakshmi Devi',

    farmName: 'Lakshmi Vegetable Farm',

    farmDescription: 'Specialising in fresh vegetables from West Godavari. 3 acres of naturally grown produce. WARNING: DEMO DATA',

    district: 'West Godavari', state: 'Andhra Pradesh',

    contactPhone: '9123456780',

    latitude: 16.9174, longitude: 81.3490,

  },

  {

    email: 'venkat.farmer@farmconnect.dev',

    name: 'Venkat Reddy',

    farmName: 'Reddy Agro Farm',

    farmDescription: 'Grains and produce from Nalgonda district, Telangana. Supplying since 2010. WARNING: DEMO DATA',

    district: 'Nalgonda', state: 'Telangana',

    contactPhone: '9988776655',

    latitude: 17.0575, longitude: 79.2685,

  },

];



type ProductDef = {

  name: string;

  category: string;

  description: string;

  unit: string;

  pricePerUnit: number;

  deliveryCharge: number;

  availableQuantity: number;

  images: string[];

};



// NOTE: Toor Dal, Brinjal, Green Chillies, Turmeric, Spinach, Cauliflower,*

//       Lady's Finger, Cabbage, and Tomatoes are intentionally excluded from all sample data.*

const FARMER_PRODUCTS: Record<number, ProductDef[]> = {

  0: [

    {

      name: 'Red Onions | \u0c0e\u0c30\u0c4d\u0c30 \u0c09\u0c32\u0c4d\u0c32\u0c3f\u0c2a\u0c3e\u0c2f\u0c32\u0c41',

      category: 'Vegetables',

      description: 'DEMO - Medium-sized red onions, perfect for curries and salads. From Raju Organic Farm.',

      unit: 'kg', pricePerUnit: 26, deliveryCharge: 20, availableQuantity: 300,

      images: ['https://images.unsplash.com/photo-1518977956812-cd3dbadaaf31?w=500&q=80'],

    },

    {

      name: 'Potatoes | \u0c2c\u0c02\u0c17\u0c3e\u0c33\u0c3e\u0c26\u0c41\u0c02\u0c2a\u0c32\u0c41',

      category: 'Vegetables',

      description: 'DEMO - Fresh potatoes, ideal for all cooking. Grown in Krishna, AP.',

      unit: 'kg', pricePerUnit: 22, deliveryCharge: 20, availableQuantity: 350,

      images: ['https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=500&q=80'],

    },

    {

      name: 'Bananas | \u0c05\u0c30\u0c1f\u0c3f\u0c2a\u0c02\u0c21\u0c4d\u0c32\u0c41',

      category: 'Fruits',

      description: 'DEMO - Sweet Yelakki bananas, ready to eat. Grown naturally at Raju farm, Krishna.',

      unit: 'dozen', pricePerUnit: 42, deliveryCharge: 15, availableQuantity: 60,

      images: ['https://images.unsplash.com/photo-1603833665858-e61d17a86224?w=500&q=80'],

    },

    {

      name: 'Sona Masoori Rice | \u0c38\u0c4b\u0c28\u0c3e \u0c2e\u0c38\u0c42\u0c30\u0c3f \u0c2c\u0c3f\u0c2f\u0c4d\u0c2f\u0c02',

      category: 'Grains & Pulses',

      description: 'DEMO - Premium Sona Masoori rice, freshly milled. No additives. Krishna district, AP.',

      unit: 'kg', pricePerUnit: 52, deliveryCharge: 25, availableQuantity: 500,

      images: ['https://images.unsplash.com/photo-1586201375761-83865001e31c?w=500&q=80'],

    },

    {

      name: 'Fresh Cow Milk | \u0c24\u0c3e\u0c1c\u0c3e \u0c06\u0c35\u0c41 \u0c2a\u0c3e\u0c32\u0c41',

      category: 'Dairy & Eggs',

      description: 'DEMO - Fresh cow milk delivered daily. No preservatives. From Krishna farm.',

      unit: 'litre', pricePerUnit: 55, deliveryCharge: 10, availableQuantity: 50,

      images: ['https://images.unsplash.com/photo-1550583724-b2692b85b150?w=500&q=80'],

    },

  ],

  1: [

    {

      name: 'Carrots | \u0c15\u0c4d\u0c2f\u0c3e\u0c30\u0c46\u0c1f\u0c4d\u0c32\u0c41',

      category: 'Vegetables',

      description: 'DEMO - Crunchy orange carrots, rich in vitamins. From Lakshmi Vegetable Farm.',

      unit: 'kg', pricePerUnit: 40, deliveryCharge: 15, availableQuantity: 110,

      images: ['https://images.unsplash.com/photo-1447175008436-054170c2e979?w=500&q=80'],

    },

    {

      name: 'Papaya | \u0c2c\u0c4a\u0c2a\u0c4d\u0c2a\u0c3e\u0c2f\u0c3f',

      category: 'Fruits',

      description: 'DEMO - Sweet, ripe papayas from West Godavari. Rich in Vitamin C.',

      unit: 'piece', pricePerUnit: 35, deliveryCharge: 20, availableQuantity: 40,

      images: ['https://images.unsplash.com/photo-1517282009859-f000ec3b26fe?w=500&q=80'],

    },

    {

      name: 'Bananas | \u0c05\u0c30\u0c1f\u0c3f\u0c2a\u0c02\u0c21\u0c4d\u0c32\u0c41',

      category: 'Fruits',

      description: 'DEMO - Robusta bananas from West Godavari. Sweeter and larger than Yelakki variety.',

      unit: 'dozen', pricePerUnit: 48, deliveryCharge: 20, availableQuantity: 50,

      images: ['https://images.unsplash.com/photo-1603833665858-e61d17a86224?w=500&q=80'],

    },

  ],

  2: [

    {

      name: 'Sona Masoori Rice | \u0c38\u0c4b\u0c28\u0c3e \u0c2e\u0c38\u0c42\u0c30\u0c3f \u0c2c\u0c3f\u0c2f\u0c4d\u0c2f\u0c02',

      category: 'Grains & Pulses',

      description: 'DEMO - Freshly milled Sona Masoori from Nalgonda. Old crop, lower price. Excellent daily rice.',

      unit: 'kg', pricePerUnit: 48, deliveryCharge: 30, availableQuantity: 800,

      images: ['https://images.unsplash.com/photo-1586201375761-83865001e31c?w=500&q=80'],

    },

    {

      name: 'Red Onions | \u0c0e\u0c30\u0c4d\u0c30 \u0c09\u0c32\u0c4d\u0c32\u0c3f\u0c2a\u0c3e\u0c2f\u0c32\u0c41',

      category: 'Vegetables',

      description: 'DEMO - Nalgonda-grown red onions. Pungent flavour, long shelf life. Good for bulk buying.',

      unit: 'kg', pricePerUnit: 22, deliveryCharge: 25, availableQuantity: 500,

      images: ['https://images.unsplash.com/photo-1518977956812-cd3dbadaaf31?w=500&q=80'],

    },

    {

      name: 'Raw Mango | \u0c2a\u0c1a\u0c4d\u0c1a\u0c3f \u0c2e\u0c3e\u0c2e\u0c3f\u0c21\u0c3f\u0c15\u0c3e\u0c2f',

      category: 'Fruits',

      description: 'DEMO - Sour raw mangoes from Telangana. Perfect for pickles and chutneys.',

      unit: 'kg', pricePerUnit: 45, deliveryCharge: 20, availableQuantity: 80,

      images: ['https://images.unsplash.com/photo-1601493700631-2b16ec4b4716?w=500&q=80'],

    },

    {

      name: 'Wheat (Whole Grain) | \u0c17\u0c4b\u0c27\u0c41\u0c2e\u0c32\u0c41',

      category: 'Grains & Pulses',

      description: 'DEMO - Whole wheat grains from Nalgonda. Can be milled at home or supplied as flour.',

      unit: 'kg', pricePerUnit: 28, deliveryCharge: 25, availableQuantity: 1000,

      images: ['https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=500&q=80'],

    },

  ],

};



const FARMER_CONFIGS = [

  { verificationStatus: 'verified' as const, easyModeEnabled: false },

  { verificationStatus: 'verified' as const, easyModeEnabled: false },

  { verificationStatus: 'verified' as const, easyModeEnabled: true },

];



// Products that must never be seeded (removed per product policy)

const EXCLUDED_PRODUCT_KEYWORDS = [

  'toor dal', 'brinjal', 'eggplant', 'green chill', 'turmeric',

  'spinach', 'palak', 'cauliflower', "lady's finger", 'okra', 'cabbage',
  'tomato', // Matches Tomato and Tomatoes listings

];



function isExcluded(productName: string): boolean {

  const lower = productName.toLowerCase();

  return EXCLUDED_PRODUCT_KEYWORDS.some((kw) => lower.includes(kw));

}



async function seed() {

  if (process.env['NODE_ENV'] === 'production') {

    console.error('[Seed] Refusing to seed in production environment.');

    process.exit(1);

  }



  const uri = process.env['MONGODB_URI'] ?? 'mongodb://localhost:27017/farmconnect';

  console.log('[Seed] Connecting to MongoDB...');

  await mongoose.connect(uri);

  console.log('[Seed] Connected.');



  const today = new Date();

  const totalCreated = { farmers: 0, products: 0 };



  for (let fi = 0; fi < FARMERS.length; fi++) {

    const fd = FARMERS[fi]!;

    const cfg = FARMER_CONFIGS[fi]!;

    const products = FARMER_PRODUCTS[fi] ?? [];



    let user = await User.findOne({ email: fd.email });

    if (!user) {

      const passwordHash = await bcrypt.hash(SEED_PASSWORD, 10);

      user = await User.create({ name: fd.name, email: fd.email, passwordHash, role: 'farmer', isActive: true });

      totalCreated.farmers++;

      console.log(`[Seed] Created farmer: ${fd.name}`);

    } else {

      console.log(`[Seed] Farmer exists: ${fd.name}`);

    }



    const existingProfile = await FarmerProfile.findOne({ userId: user._id });

    if (!existingProfile) {

      await FarmerProfile.create({

        userId: user._id, farmName: fd.farmName, farmDescription: fd.farmDescription,

        district: fd.district, state: fd.state, profilePhotoUrl: '',

        contactPhone: fd.contactPhone, verificationStatus: cfg.verificationStatus,

        easyModeEnabled: cfg.easyModeEnabled, latitude: fd.latitude, longitude: fd.longitude,

      });

      console.log(`[Seed] Created profile: ${fd.farmName}`);

    }



    // Deactivate excluded products for this demo farmer, including already-inactive matches.

    const excluded = await Product.find({ farmerId: user._id });
    for (const p of excluded) {
      if (isExcluded(p.name) && p.status !== 'inactive') {
        p.status = 'inactive';
        await p.save();
        console.log(`[Seed] Deactivated excluded product: ${p.name}`);
      }
    }


    let created = 0;

    for (let pi = 0; pi < products.length; pi++) {

      const pd = products[pi]!;

      if (isExcluded(pd.name)) {

        console.log(`[Seed] Skipping excluded product: ${pd.name}`);

        continue;

      }

      const exists = await Product.findOne({ farmerId: user._id, name: pd.name });

      if (!exists) {

        await Product.create({

          ...pd, farmerId: user._id, status: 'active',

          averageRating: parseFloat((3.6 + ((pi + fi) % 5) * 0.28).toFixed(1)),

          reviewCount: ((pi + fi) % 8) * 4,

          harvestDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() - pi),

        });

        created++;

        totalCreated.products++;

      }

    }

    if (created > 0) console.log(`[Seed] Created ${created} products for ${fd.farmName}`);

    else console.log(`[Seed] No new products needed for ${fd.farmName}`);

  }



  const totalFarmers = await FarmerProfile.countDocuments();

  const totalProducts = await Product.countDocuments({ status: 'active' });

  console.log(`\n[Seed] Done. Farmers: ${totalFarmers}, Active products: ${totalProducts}`);

  console.log('[Seed] All demo data. Demo login password: Demo@1234');

  FARMERS.forEach((f) => console.log(`  ${f.email}`));

  await mongoose.disconnect();

}



seed().catch((err) => { console.error('[Seed] Error:', err); process.exit(1); });
