import mongoose from 'mongoose';
import { env } from './env';

const CONNECTION_TIMEOUT_MS = 10_000;

export async function connectDB(): Promise<void> {
  await mongoose.connect(env.mongoUri, {
    serverSelectionTimeoutMS: CONNECTION_TIMEOUT_MS,
    connectTimeoutMS: CONNECTION_TIMEOUT_MS,
  });

  console.log('MongoDB connected');

  mongoose.connection.on('error', (err: Error) => {
    console.error('MongoDB connection error:', err);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('MongoDB disconnected');
  });
}
