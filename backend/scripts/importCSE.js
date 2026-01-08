import mongoose from "mongoose";
import dotenv from "dotenv";
import ExcelJS from "exceljs";
import Lab from "../models/Lab.js";
import Asset from "../models/Asset.js";

dotenv.config();

async function importCSE(filePath) {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);
    const worksheet = workbook.getWorksheet(1);

    let labsCreated = 0;
    let assetsCreated = 0;
    const errors = [];

    const labMap = new Map(); // labCode -> labId
    const labSlCounter = new Map(); // labCode -> slNo counter

    // Start from row 5 (row 4 is header)
    for (let rowNumber = 5; rowNumber <= worksheet.rowCount; rowNumber++) {
      const row = worksheet.getRow(rowNumber);

      // Column 1: Lab Code
      const labCodeRaw = row.getCell(1).value;
      if (!labCodeRaw) continue;

      const cleanLabCode = String(labCodeRaw)
        .trim()
        .replace(/\s+/g, "-")
        .toUpperCase();

      if (cleanLabCode === "SEMINAR") continue;

      // Column 2: Item description
      const itemCell = row.getCell(2);
      let itemDescription = null;

      if (itemCell.value) {
        if (typeof itemCell.value === "object" && itemCell.value.richText) {
          itemDescription = itemCell.value.richText.map(rt => rt.text).join("");
        } else {
          itemDescription = String(itemCell.value).trim();
        }
      }

      if (!itemDescription) continue;

      // Column 3: Quantity
      const quantityCell = row.getCell(3).value;
      const quantity = Number(quantityCell) || 1;

      // Create / fetch lab
      if (!labMap.has(cleanLabCode)) {
        try {
          const lab = await Lab.findOneAndUpdate(
            { code: cleanLabCode },
            {
              code: cleanLabCode,
              name: `Lab ${cleanLabCode}`,
              department: "CSE",
              location: null,
              remarks: "Imported from CSE.xlsx"
            },
            { upsert: true, new: true }
          );

          labMap.set(cleanLabCode, lab._id);
          labSlCounter.set(cleanLabCode, 0);
          labsCreated++;
          console.log(`Created lab: ${cleanLabCode}`);
        } catch (err) {
          errors.push(`Lab ${cleanLabCode}: ${err.message}`);
          continue;
        }
      }

      // Increment SL No per lab
      const slNo = labSlCounter.get(cleanLabCode) + 1;
      labSlCounter.set(cleanLabCode, slNo);

      // Build identifiers
      const assetTag = `${cleanLabCode}-${slNo}`;
      const assetId = `${cleanLabCode}/ITEM/${slNo}`;

      try {
        await Asset.findOneAndUpdate(
          { assetTag },
          {
            assetTag,
            slNo,
            assetId,
            labId: labMap.get(cleanLabCode),
            status: "WORKING",
            model: itemDescription,     // ✅ STRING
            pageNo: 1,                  // default (adjust later)
            quantity,
            cost: 0,                    // unknown → set 0
            purchaseDate: null,
            remarks: "Imported from CSE.xlsx"
          },
          { upsert: true, new: true }
        );

        assetsCreated++;
      } catch (err) {
        errors.push(`Asset for ${cleanLabCode}: ${err.message}`);
      }
    }

    console.log("\nImport Summary:");
    console.log(`  Labs created: ${labsCreated}`);
    console.log(`  Assets created: ${assetsCreated}`);

    if (errors.length > 0) {
      console.log("\nErrors:");
      errors.forEach(e => console.log(`  - ${e}`));
    }

    console.log("\nImport completed!");
    process.exit(0);
  } catch (err) {
    console.error("Import failed:", err);
    process.exit(1);
  }
}

const filePath = process.argv[2] || "./data/CSE.xlsx";
importCSE(filePath);
