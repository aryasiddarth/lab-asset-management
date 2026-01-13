import express from "express";
import multer from "multer";
import ExcelJS from "exceljs";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import Asset from "../models/Asset.js";
import LabAsset from "../models/LabAsset.js";
import { authenticate } from "../middleware/auth.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// uploads/
const uploadsDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const upload = multer({ dest: uploadsDir });

/**
 * POST /import/excel
 * One row = ONE inventory asset
 * Expected columns (1-based index):
 * Asset Tag | Entry Date | Purchase Date | Page No |
 * Model | Quantity | Cost | Remarks
 */
router.post(
  "/excel",
  authenticate,
  upload.single("file"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(req.file.path);

      const sheet = workbook.getWorksheet(1);
      if (!sheet) {
        return res.status(400).json({ message: "Invalid Excel file" });
      }

      let imported = 0;
      const errors = [];

      for (let i = 2; i <= sheet.rowCount; i++) {
        const row = sheet.getRow(i);

        try {
          const asset = {
            assetTag: row.getCell(1).value?.toString(),
            entryDate: row.getCell(2).value
              ? new Date(row.getCell(2).value)
              : null,
            purchaseDate: row.getCell(3).value
              ? new Date(row.getCell(3).value)
              : null,
            pageNo: Number(row.getCell(4).value),
            model: row.getCell(5).value?.toString(),
            quantity: Number(row.getCell(6).value),
            cost: Number(row.getCell(7).value),
            remarks: row.getCell(8).value?.toString() || null
          };

          if (!asset.assetTag || !asset.quantity) {
            errors.push(`Row ${i}: Missing assetTag or quantity`);
            continue;
          }

          await Asset.findOneAndUpdate(
            { assetTag: asset.assetTag },
            asset,
            { upsert: true, new: true }
          );

          imported++;
        } catch (err) {
          errors.push(`Row ${i}: ${err.message}`);
        }
      }

      fs.unlinkSync(req.file.path);

      res.json({
        message: "Import completed",
        assetsImported: imported,
        errors: errors.length ? errors : undefined
      });
    } catch (err) {
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }

      console.error("Import error:", err);
      res.status(500).json({ message: "Import failed" });
    }
  }
);

/**
 * GET /export/excel
 * Exports inventory with assigned & remaining
 */
router.get("/excel", authenticate, async (req, res) => {
  try {
    const assets = await Asset.find().sort({ assetTag: 1, createdAt: 1 });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Inventory");

    sheet.columns = [
      { header: "Asset Tag", key: "assetTag", width: 20 },
      { header: "Model", key: "model", width: 25 },
      { header: "Total Quantity", key: "quantity", width: 15 },
      { header: "Assigned", key: "assigned", width: 15 },
      { header: "Remaining", key: "remaining", width: 15 },
      { header: "Page No", key: "pageNo", width: 10 },
      { header: "Cost", key: "cost", width: 15 },
      { header: "Remarks", key: "remarks", width: 30 }
    ];

    for (const asset of assets) {
      const assignedAgg = await LabAsset.aggregate([
        { $match: { assetId: asset._id } },
        { $group: { _id: null, total: { $sum: "$quantityAssigned" } } }
      ]);

      const assigned = assignedAgg[0]?.total || 0;
      const remaining = asset.quantity - assigned;

      sheet.addRow({
        assetTag: asset.assetTag,
        model: asset.model,
        quantity: asset.quantity,
        assigned,
        remaining,
        pageNo: asset.pageNo,
        cost: asset.cost,
        remarks: asset.remarks || ""
      });
    }

    const buffer = await workbook.xlsx.writeBuffer();

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=inventory.xlsx"
    );

    res.send(buffer);
  } catch (err) {
    console.error("Export error:", err);
    res.status(500).json({ message: "Export failed" });
  }
});

export default router;
