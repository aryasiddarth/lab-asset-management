import mongoose from 'mongoose';
import dotenv from 'dotenv';
import mammoth from 'mammoth';
import Lab from '../models/Lab.js';
import Asset from '../models/Asset.js';

dotenv.config();

// Simple parser for DOC files (you may need to adjust based on your DOC format)
async function parseDocContent(text) {
  // This is a basic parser - adjust based on your DOC format
  const lines = text.split('\n').filter(line => line.trim());
  const labs = [];
  const assets = [];
  
  // Example parsing logic - adjust based on your document structure
  // This assumes a simple format like:
  // Lab: LAB001, Name: Computer Lab 1, Department: CS
  
  let currentSection = null;
  for (const line of lines) {
    if (line.includes('Lab:') || line.toLowerCase().includes('lab code:')) {
      // Parse lab data - adjust regex based on your format
      const codeMatch = line.match(/Lab(?: Code)?:\s*(\w+)/i);
      const nameMatch = line.match(/Name:\s*([^,]+)/i);
      const deptMatch = line.match(/Department:\s*(\w+)/i);
      
      if (codeMatch) {
        labs.push({
          code: codeMatch[1],
          name: nameMatch ? nameMatch[1].trim() : `Lab ${codeMatch[1]}`,
          department: deptMatch ? deptMatch[1] : 'General'
        });
      }
    }
    
    // Add asset parsing logic based on your DOC format
    // Example: Asset Tag: AT001, Lab: LAB001, Status: WORKING
    if (line.includes('Asset') || line.includes('asset tag')) {
      const tagMatch = line.match(/Asset(?: Tag)?:\s*(\w+)/i);
      const labMatch = line.match(/Lab(?: Code)?:\s*(\w+)/i);
      const statusMatch = line.match(/Status:\s*(\w+)/i);
      
      if (tagMatch && labMatch) {
        assets.push({
          assetTag: tagMatch[1],
          labCode: labMatch[1],
          status: statusMatch ? statusMatch[1] : 'WORKING'
        });
      }
    }
  }
  
  return { labs, assets };
}

async function importDoc(filePath) {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Read and convert DOC file
    const result = await mammoth.extractRawText({ path: filePath });
    const text = result.value;
    
    console.log('Extracted text from DOC file');
    
    // Parse the content
    const { labs, assets } = await parseDocContent(text);
    
    let labsImported = 0;
    let assetsImported = 0;
    const errors = [];
    
    // Import Labs
    for (const lab of labs) {
      try {
        await Lab.findOneAndUpdate(
          { code: lab.code },
          lab,
          { upsert: true, new: true }
        );
        labsImported++;
      } catch (error) {
        errors.push(`Lab ${lab.code}: ${error.message}`);
        console.error(`Error importing lab ${lab.code}:`, error.message);
      }
    }
    console.log(`Imported ${labsImported} labs`);
    
    // Import Assets
    for (const asset of assets) {
      try {
        const lab = await Lab.findOne({ code: asset.labCode });
        if (!lab) {
          errors.push(`Asset ${asset.assetTag}: Lab ${asset.labCode} not found`);
          console.warn(`Lab ${asset.labCode} not found for asset ${asset.assetTag}`);
          continue;
        }
        
        await Asset.findOneAndUpdate(
          { assetTag: asset.assetTag },
          {
            assetTag: asset.assetTag,
            labId: lab._id,
            status: asset.status || 'WORKING',
            model: asset.model || {},
            serialNumber: asset.serialNumber || null,
            purchaseDate: asset.purchaseDate ? new Date(asset.purchaseDate) : null,
            warrantyExpiry: asset.warrantyExpiry ? new Date(asset.warrantyExpiry) : null,
            remarks: asset.remarks || null
          },
          { upsert: true, new: true }
        );
        assetsImported++;
      } catch (error) {
        errors.push(`Asset ${asset.assetTag}: ${error.message}`);
        console.error(`Error importing asset ${asset.assetTag}:`, error.message);
      }
    }
    console.log(`Imported ${assetsImported} assets`);
    
    if (errors.length > 0) {
      console.log('\nErrors encountered:');
      errors.forEach(err => console.log(`  - ${err}`));
    }
    
    console.log('\nImport completed!');
    console.log(`Summary: ${labsImported} labs, ${assetsImported} assets imported`);
    process.exit(0);
  } catch (error) {
    console.error('Error importing DOC:', error);
    process.exit(1);
  }
}

const filePath = process.argv[2];
if (!filePath) {
  console.error('Please provide DOC file path: npm run import:doc <path-to-file.doc>');
  process.exit(1);
}

importDoc(filePath);

