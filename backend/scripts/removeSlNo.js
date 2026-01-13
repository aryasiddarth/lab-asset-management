import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Asset from '../models/Asset.js';

dotenv.config();

async function removeSlNo() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const res = await Asset.updateMany({}, { $unset: { slNo: "" } });

    console.log('Update result:', res);
    console.log('All asset documents updated to remove slNo field.');

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Error removing slNo:', err);
    await mongoose.disconnect();
    process.exit(1);
  }
}

removeSlNo();
