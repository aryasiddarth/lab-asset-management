import mongoose from 'mongoose';
import Asset from '../models/Asset.js';
import Stock from '../models/Stock.js';
import dotenv from 'dotenv';

dotenv.config();

async function checkCollections() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Check Asset collection
    console.log('\n📊 ASSET COLLECTION:');
    const assetCount = await Asset.countDocuments();
    console.log(`Total Assets: ${assetCount}`);
    
    const sampleAsset = await Asset.findOne();
    console.log('Sample Asset:', JSON.stringify(sampleAsset, null, 2));
    
    // Check Asset schema
    console.log('\n🔧 ASSET SCHEMA FIELDS:');
    console.log(Object.keys(Asset.schema.paths));
    
    // Check if there's a Stock collection
    console.log('\n📦 STOCK COLLECTION (if exists):');
    const stockCount = await Stock.countDocuments();
    console.log(`Total Stocks: ${stockCount}`);
    
    if (stockCount > 0) {
      const sampleStock = await Stock.findOne();
      console.log('Sample Stock:', JSON.stringify(sampleStock, null, 2));
    }
    
    // List all collections
    console.log('\n🗂️ ALL COLLECTIONS:');
    const collections = await mongoose.connection.db.listCollections().toArray();
    collections.forEach(col => console.log(`- ${col.name}`));
    
    await mongoose.disconnect();
    console.log('\n✅ Check complete');
    
  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.disconnect();
  }
}

checkCollections();