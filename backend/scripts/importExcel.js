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
        // Support two possible Assets sheet formats:
        // Old: [AssetTag, LabCode, Status, ModelName, Manufacturer, Serial, PurchaseDate, Warranty, Remarks]
        // New: [BillNo, Description, OrderID, EntryDate, PurchaseDate, PageNo, Quantity, Cost, Remarks]

        const c1 = row.getCell(1).value;
        const c2 = row.getCell(2).value;

        // Heuristic: treat as old format if column 2 looks like a lab code (no spaces) and column1 contains a dash or '/ITEM/'
        const looksLikeOldFormat =
          c2 && typeof c2 === 'string' && /^[A-Z0-9\-\/]+$/.test(String(c2).trim()) &&
          c1 && typeof c1 === 'string' && (String(c1).includes('-') || String(c1).includes('/ITEM/'));

        try {
          if (looksLikeOldFormat) {
            const assetTag = String(c1).trim();
            const labCode = String(c2).trim();

            const lab = await Lab.findOne({ code: labCode });
            if (!lab) {
              errors.push(`Asset ${assetTag}: Lab ${labCode} not found`);
              console.warn(`Lab ${labCode} not found for asset ${assetTag}`);
              continue;
            }

            await Asset.findOneAndUpdate(
              { billNo: assetTag },
              {
                billNo: assetTag,
                labId: lab._id,
                status: row.getCell(3).value || 'WORKING',
                orderId: row.getCell(4).value || null,
                serialNumber: row.getCell(6).value || null,
                purchaseDate: row.getCell(7).value ? new Date(row.getCell(7).value) : null,
                warrantyExpiry: row.getCell(8).value ? new Date(row.getCell(8).value) : null,
                remarks: row.getCell(9).value || null
              },
              { upsert: true, new: true }
            );
            assetsImported++;
          } else {
            // New format
            const billNo = c1 ? String(c1).trim() : null;
            const description = c2 ? String(c2).trim() : null;
            const orderId = row.getCell(3).value ? String(row.getCell(3).value).trim() : null;
            const entryDate = row.getCell(4).value ? new Date(row.getCell(4).value) : null;
            const purchaseDate = row.getCell(5).value ? new Date(row.getCell(5).value) : null;
            const pageNo = Number(row.getCell(6).value) || 0;
            const quantity = Number(row.getCell(7).value) || 1;
            const cost = Number(row.getCell(8).value) || 0;
            const remarks = row.getCell(9).value || null;

            if (!billNo) {
              errors.push(`Row ${rowNumber}: missing Bill No`);
              continue;
            }

            await Asset.findOneAndUpdate(
              { billNo },
              {
                billNo,
                description,
                orderId,
                entryDate,
                purchaseDate,
                pageNo,
                quantity,
                cost,
                remarks
              },
              { upsert: true, new: true }
            );

            assetsImported++;
          }
        } catch (error) {
          errors.push(`Row ${rowNumber}: ${error.message}`);
          console.error(`Error importing row ${rowNumber}:`, error.message);
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

