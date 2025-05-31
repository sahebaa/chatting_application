
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env file from root
dotenv.config({ path: path.resolve(__dirname, '../.env') });

console.log(process.env.MONGO_URI);

export const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI); // No options needed
    console.log('✅ MongoDB connected');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  }
};

export default connectDB;
