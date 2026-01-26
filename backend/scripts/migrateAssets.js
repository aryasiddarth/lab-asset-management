// backend/scripts/migrateAssets.js
import mongoose from 'mongoose';
import Asset from '../models/Asset.js';
import dotenv from 'dotenv';

dotenv.config();

async function migrateAssets() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Get all assets
    const assets = await Asset.find();
    console.log(`Found ${assets.length} assets to migrate`);
    
    let updatedCount = 0;
    
    for (const asset of assets) {
      // Add missing required fields with default values
      const updates = {};
      
      if (!asset.pageNo) updates.pageNo = 1;
      if (!asset.model) updates.model = 'Unknown Model';
      if (!asset.quantity) updates.quantity = 1;
      if (!asset.cost) updates.cost = 0;
      
      // If serialNumber exists, move it to model if model is default
      if (asset.serialNumber && updates.model === 'Unknown Model') {
        updates.model = `Serial: ${asset.serialNumber}`;
      }
      
      if (Object.keys(updates).length > 0) {
        await Asset.updateOne({ _id: asset._id }, { $set: updates });
        updatedCount++;
        console.log(`Updated asset ${asset.assetTag || asset._id}`);
      }
    }
    
    console.log(`\n✅ Migration complete. Updated ${updatedCount} assets`);
    
    // Verify migration
    const sample = await Asset.findOne();
    console.log('\n📋 Sample migrated asset:');
    console.log(JSON.stringify(sample, null, 2));
    
    await mongoose.disconnect();
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

migrateAssets();