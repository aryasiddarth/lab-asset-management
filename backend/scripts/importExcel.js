import mongoose from 'mongoose';
import dotenv from 'dotenv';
import ExcelJS from 'exceljs';
import Lab from '../models/Lab.js';
import Asset from '../models/Asset.js';

dotenv.config();

async function importExcel(filePath) {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Read Excel file
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);
    
    console.log('Found sheets:', workbook.worksheets.map(ws => ws.name));

    let labsImported = 0;
    let assetsImported = 0;
    const errors = [];

    // Import Labs (if sheet exists)
    const labsWorksheet = workbook.getWorksheet('Labs');
    if (labsWorksheet) {
      for (let rowNumber = 2; rowNumber <= labsWorksheet.rowCount; rowNumber++) {
        const row = labsWorksheet.getRow(rowNumber);
        const lab = {
          code: row.getCell(1).value,
          name: row.getCell(2).value,
          department: row.getCell(3).value,
          location: row.getCell(4).value || null,
          remarks: row.getCell(5).value || null
        };
        
        if (lab.code && lab.name && lab.department) {
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
      }
      console.log(`Imported ${labsImported} labs`);
    }

    // Import Assets (if sheet exists)
    const assetsWorksheet = workbook.getWorksheet('Assets');
    if (assetsWorksheet) {
      for (let rowNumber = 2; rowNumber <= assetsWorksheet.rowCount; rowNumber++) {
        const row = assetsWorksheet.getRow(rowNumber);
        const asset = {
          assetTag: row.getCell(1).value,
          labCode: row.getCell(2).value,
          status: row.getCell(3).value || 'WORKING',
          modelName: row.getCell(4).value || null,
          manufacturer: row.getCell(5).value || null,
          serialNumber: row.getCell(6).value || null,
          purchaseDate: row.getCell(7).value || null,
          warrantyExpiry: row.getCell(8).value || null,
          remarks: row.getCell(9).value || null
        };
        
        if (asset.assetTag && asset.labCode) {
          try {
            // Find lab by code
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
                model: {
                  name: asset.modelName || null,
                  manufacturer: asset.manufacturer || null
                },
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
      }
      console.log(`Imported ${assetsImported} assets`);
    }

    if (errors.length > 0) {
      console.log('\nErrors encountered:');
      errors.forEach(err => console.log(`  - ${err}`));
    }

    console.log('\nImport completed!');
    console.log(`Summary: ${labsImported} labs, ${assetsImported} assets imported`);
    process.exit(0);
  } catch (error) {
    console.error('Error importing Excel:', error);
    process.exit(1);
  }
}

// Get file path from command line argument
const filePath = process.argv[2];
if (!filePath) {
  console.error('Please provide Excel file path: npm run import:excel <path-to-file.xlsx>');
  process.exit(1);
}

importExcel(filePath);

