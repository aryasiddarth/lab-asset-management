import mongoose from "mongoose";
import dotenv from "dotenv";
import mammoth from "mammoth";
import Lab from "../models/Lab.js";
import Asset from "../models/Asset.js";

dotenv.config();

async function importDSE(filePath) {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    const result = await mammoth.extractRawText({ path: filePath });
    const text = result.value;

    const lines = text
      .split("\n")
      .map(l => l.trim())
      .filter(l => l);

    let labsCreated = 0;
    let assetsCreated = 0;
    const errors = [];

    const labMap = new Map();          // labName -> labId
    const labCodeMap = new Map();      // labName -> labCode
    const labSlCounter = new Map();    // labCode -> slNo

    let currentLabName = null;
    let currentLabCode = null;
    let currentEquipmentType = null;
    let currentEquipmentDesc = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Skip headers
      if (
        /^(SN|Name of the lab|Name of major equipment|Count|Utilization|attainment)$/i.test(
          line
        )
      ) {
        continue;
      }

      // Detect new lab (serial number followed by lab name)
      if (/^\d+$/.test(line) && i + 1 < lines.length) {
        const nextLine = lines[i + 1];

        if (
          nextLine &&
          /Lab|Research|Development|Virtual Reality|Centre/i.test(nextLine)
        ) {
          currentLabName = nextLine.trim();

          currentLabCode = currentLabName
            .replace(/\s+/g, "-")
            .toUpperCase()
            .replace(/COMPUTING-LAB/i, "LAB")
            .replace(/LAB/i, "LAB-");

          if (!labMap.has(currentLabName)) {
            try {
              const lab = await Lab.findOneAndUpdate(
                { code: currentLabCode },
                {
                  code: currentLabCode,
                  name: currentLabName,
                  department: "DSE",
                  location: null,
                  remarks: "Imported from DSE.docx"
                },
                { upsert: true, new: true }
              );

              labMap.set(currentLabName, lab._id);
              labCodeMap.set(currentLabName, currentLabCode);
              labSlCounter.set(currentLabCode, 0);

              labsCreated++;
              console.log(`Created lab: ${currentLabCode}`);
            } catch (err) {
              errors.push(`Lab ${currentLabName}: ${err.message}`);
            }
          }

          currentEquipmentType = null;
          currentEquipmentDesc = null;
          i++; // skip lab name line
          continue;
        }
      }

      // Equipment line (Type: Description)
      if (currentLabName && line.includes(":")) {
        const [type, desc] = line.split(":", 2);

        currentEquipmentType = type.trim();
        currentEquipmentDesc = desc && desc.trim().length > 5 ? desc.trim() : null;

        // Try next line if description is short
        if (!currentEquipmentDesc && i + 1 < lines.length) {
          const nextLine = lines[i + 1];
          if (nextLine.length > 10 && !/^\d+$/.test(nextLine)) {
            currentEquipmentDesc = nextLine.trim();
            i++;
          }
        }

        // Look for quantity
        let quantity = 1;
        for (let j = i + 1; j < lines.length && j < i + 5; j++) {
          if (/^\d+$/.test(lines[j])) {
            quantity = parseInt(lines[j]);
            break;
          }
        }

        if (currentEquipmentDesc && labMap.has(currentLabName)) {
          const labCode = labCodeMap.get(currentLabName);
          const slNo = labSlCounter.get(labCode) + 1;
          labSlCounter.set(labCode, slNo);

          const assetTag = `${labCode}-${slNo}`;
          const assetId = `${labCode}/ITEM/${slNo}`;

          try {
            await Asset.findOneAndUpdate(
              { assetTag },
              {
                assetTag,
                slNo,
                assetId,
                labId: labMap.get(currentLabName),
                status: "WORKING",
                model: currentEquipmentDesc, // ✅ STRING
                pageNo: 1,
                quantity,
                cost: 0,
                purchaseDate: null,
                remarks: currentEquipmentType
              },
              { upsert: true, new: true }
            );

            assetsCreated++;
            console.log(`  Created asset: ${assetTag}`);
          } catch (err) {
            errors.push(`Asset for ${currentLabCode}: ${err.message}`);
          }
        }

        continue;
      }
    }

    console.log("\nImport Summary:");
    console.log(`  Labs created: ${labsCreated}`);
    console.log(`  Assets created: ${assetsCreated}`);

    if (errors.length) {
      console.log("\nErrors:");
      errors.forEach(e => console.log(`  - ${e}`));
    }

    console.log("\nImport completed!");
    process.exit(0);
  } catch (err) {
    console.error("Error importing DSE file:", err);
    process.exit(1);
  }
}

const filePath = process.argv[2] || "./data/DSE.docx";
importDSE(filePath);
