import mongoose from 'mongoose';
import dotenv from 'dotenv';
import ExcelJS from 'exceljs';
import Lab from '../models/Lab.js';
import Asset from '../models/Asset.js';

dotenv.config();

async function importCSE(filePath) {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);
    const worksheet = workbook.getWorksheet(1);

    let labsCreated = 0;
    let assetsCreated = 0;
    const errors = [];
    const labMap = new Map(); // Track lab codes to ObjectIds

    // Start from row 5 (row 4 is header)
    for (let rowNumber = 5; rowNumber <= worksheet.rowCount; rowNumber++) {
      const row = worksheet.getRow(rowNumber);
      
      // Get lab code (first column)
      const labCodeCell = row.getCell(1);
      const labCode = labCodeCell.value ? String(labCodeCell.value).trim() : null;
      
      // Get item description (second column)
      const itemCell = row.getCell(2);
      let itemDescription = null;
      if (itemCell.value) {
        if (typeof itemCell.value === 'object' && itemCell.value.richText) {
          // Handle rich text
          itemDescription = itemCell.value.richText.map(rt => rt.text).join('');
        } else {
          itemDescription = String(itemCell.value).trim();
        }
      }
      
      // Get quantity (third column)
      const qtyCell = row.getCell(3);
      const quantity = qtyCell.value ? Number(qtyCell.value) : null;

      // Skip empty rows
      if (!labCode || labCode === '' || labCode.toLowerCase() === 'seminar') {
        continue;
      }

      // Clean lab code (remove spaces, normalize)
      const cleanLabCode = labCode.replace(/\s+/g, '-').toUpperCase();
      
      // Create or get lab
      if (!labMap.has(cleanLabCode)) {
        try {
          const lab = await Lab.findOneAndUpdate(
            { code: cleanLabCode },
            {
              code: cleanLabCode,
              name: `Lab ${cleanLabCode}`,
              department: 'CSE',
              location: null,
              remarks: 'Imported from CSE.xlsx'
            },
            { upsert: true, new: true }
          );
          labMap.set(cleanLabCode, lab._id);
          labsCreated++;
          console.log(`Created lab: ${cleanLabCode}`);
        } catch (error) {
          errors.push(`Lab ${cleanLabCode}: ${error.message}`);
          continue;
        }
      }

      // Create asset if item description exists
      if (itemDescription && itemDescription !== '' && itemDescription !== '[empty]') {
        try {
          const assetTag = `${cleanLabCode}-${assetsCreated + 1}`;
          
          await Asset.findOneAndUpdate(
            { assetTag },
            {
              assetTag,
              labId: labMap.get(cleanLabCode),
              status: 'WORKING',
              model: {
                name: itemDescription,
                manufacturer: null
              },
              serialNumber: null,
              purchaseDate: null,
              warrantyExpiry: null,
              remarks: quantity ? `Quantity: ${quantity}` : null
            },
            { upsert: true, new: true }
          );
          assetsCreated++;
        } catch (error) {
          errors.push(`Asset for ${cleanLabCode}: ${error.message}`);
        }
      }
    }

    console.log(`\nImport Summary:`);
    console.log(`  Labs created: ${labsCreated}`);
    console.log(`  Assets created: ${assetsCreated}`);
    
    if (errors.length > 0) {
      console.log(`\nErrors:`);
      errors.forEach(err => console.log(`  - ${err}`));
    }

    console.log('\nImport completed!');
    process.exit(0);
  } catch (error) {
    console.error('Error importing CSE file:', error);
    process.exit(1);
  }
}

const filePath = process.argv[2] || './data/CSE.xlsx';
importCSE(filePath);

