import express from 'express';
import multer from 'multer';
import ExcelJS from 'exceljs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Lab from '../models/Lab.js';
import Asset from '../models/Asset.js';
import { authenticate } from '../middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const upload = multer({ dest: uploadsDir });

// Import Excel file
router.post('/excel', authenticate, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(req.file.path);
    
    let labsImported = 0;
    let assetsImported = 0;
    const errors = [];

    // Import Labs
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
          }
        }
      }
    }

    // Import Assets
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
            const lab = await Lab.findOne({ code: asset.labCode });
            if (!lab) {
              errors.push(`Asset ${asset.assetTag}: Lab ${asset.labCode} not found`);
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
          }
        }
      }
    }

    // Clean up uploaded file
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.json({
      message: 'Import completed',
      labsImported,
      assetsImported,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    // Clean up uploaded file on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    console.error('Import error:', error);
    res.status(500).json({ message: 'Import failed', error: error.message });
  }
});

// Export Excel file
router.get('/excel', authenticate, async (req, res) => {
  try {
    const labs = await Lab.find().sort({ code: 1 });
    const assets = await Asset.find()
      .populate('labId', 'code')
      .sort({ assetTag: 1 });

    // Create workbook
    const workbook = new ExcelJS.Workbook();

    // Labs sheet
    const labsSheet = workbook.addWorksheet('Labs');
    labsSheet.columns = [
      { header: 'Code', key: 'code', width: 15 },
      { header: 'Name', key: 'name', width: 30 },
      { header: 'Department', key: 'department', width: 20 },
      { header: 'Location', key: 'location', width: 25 },
      { header: 'Remarks', key: 'remarks', width: 30 }
    ];
    labs.forEach(lab => {
      labsSheet.addRow({
        code: lab.code,
        name: lab.name,
        department: lab.department,
        location: lab.location || '',
        remarks: lab.remarks || ''
      });
    });

    // Assets sheet
    const assetsSheet = workbook.addWorksheet('Assets');
    assetsSheet.columns = [
      { header: 'Asset Tag', key: 'assetTag', width: 15 },
      { header: 'Lab Code', key: 'labCode', width: 15 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Model Name', key: 'modelName', width: 25 },
      { header: 'Manufacturer', key: 'manufacturer', width: 20 },
      { header: 'Serial Number', key: 'serialNumber', width: 20 },
      { header: 'Purchase Date', key: 'purchaseDate', width: 15 },
      { header: 'Warranty Expiry', key: 'warrantyExpiry', width: 15 },
      { header: 'Remarks', key: 'remarks', width: 30 }
    ];
    assets.forEach(asset => {
      assetsSheet.addRow({
        assetTag: asset.assetTag,
        labCode: asset.labId?.code || '',
        status: asset.status,
        modelName: asset.model?.name || '',
        manufacturer: asset.model?.manufacturer || '',
        serialNumber: asset.serialNumber || '',
        purchaseDate: asset.purchaseDate || '',
        warrantyExpiry: asset.warrantyExpiry || '',
        remarks: asset.remarks || ''
      });
    });

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=assets.xlsx');
    res.send(buffer);
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ message: 'Export failed', error: error.message });
  }
});

export default router;

