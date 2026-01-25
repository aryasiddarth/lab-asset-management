import express from "express";
import multer from "multer";
import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";
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

/**
 * GET /export/pdf
 * Exports inventory as PDF with assigned & remaining
 */
router.get("/pdf", authenticate, async (req, res) => {
  try {
    const assets = await Asset.find().sort({ assetTag: 1, createdAt: 1 });

    const doc = new PDFDocument({
      margin: 40,
      bufferPages: true
    });

    // Set headers
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=inventory.pdf"
    );

    // Pipe to response
    doc.pipe(res);

    // Title
    doc.fontSize(20).font("Helvetica-Bold").text("Lab Asset Inventory", {
      align: "center"
    });
    doc.moveDown(0.5);
    doc.fontSize(10).font("Helvetica").text(
      `Generated on: ${new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric"
      })}`,
      { align: "center" }
    );
    doc.moveDown(1);

    // Table headers
    const headers = [
      "Asset Tag",
      "Model",
      "Total Qty",
      "Assigned",
      "Remaining",
      "Page No",
      "Cost",
      "Remarks"
    ];
    const columnWidths = [70, 90, 50, 60, 70, 50, 50, 80];
    const startY = doc.y;
    const startX = doc.page.margins.left;

    // Draw header background
    doc.rect(startX, startY, 520, 20).fill("#e0e0e0");

    // Draw header text
    let xPos = startX + 5;
    doc.fontSize(9).font("Helvetica-Bold").fillColor("black");
    for (let i = 0; i < headers.length; i++) {
      doc.text(headers[i], xPos, startY + 4, {
        width: columnWidths[i] - 10,
        height: 20,
        align: i > 2 ? "center" : "left"
      });
      xPos += columnWidths[i];
    }

    doc.moveDown(1.5);

    // Add rows
    let yPosition = doc.y;
    let rowHeight = 30;

    for (const asset of assets) {
      const assignedAgg = await LabAsset.aggregate([
        { $match: { assetId: asset._id } },
        { $group: { _id: null, total: { $sum: "$quantityAssigned" } } }
      ]);

      const assigned = assignedAgg[0]?.total || 0;
      const remaining = asset.quantity - assigned;

      const rowData = [
        asset.assetTag,
        asset.model,
        asset.quantity.toString(),
        assigned.toString(),
        remaining.toString(),
        asset.pageNo.toString(),
        asset.cost.toString(),
        asset.remarks || ""
      ];

      // Check if we need a new page
      if (yPosition + rowHeight > doc.page.height - 40) {
        doc.addPage();
        yPosition = 40;
      }

      // Draw row background (alternate colors)
      const bgColor =
        assets.indexOf(asset) % 2 === 0 ? "#f9f9f9" : "#ffffff";
      doc.rect(startX, yPosition, 520, rowHeight).fill(bgColor);

      // Draw row text
      xPos = startX + 5;
      doc.fontSize(8).font("Helvetica").fillColor("black");
      for (let i = 0; i < rowData.length; i++) {
        const cellText = rowData[i] || "";
        doc.text(cellText, xPos, yPosition + 5, {
          width: columnWidths[i] - 10,
          height: rowHeight - 10,
          align: i > 2 ? "center" : "left",
          ellipsis: true
        });
        xPos += columnWidths[i];
      }

      yPosition += rowHeight;
    }

    // Add footer
    doc.fontSize(8).text(
      "End of Inventory Report",
      { align: "center" },
      doc.page.height - 30
    );

    // Finalize PDF
    doc.end();
  } catch (err) {
    console.error("PDF Export error:", err);
    res.status(500).json({ message: "PDF export failed" });
  }
});

export default router;
