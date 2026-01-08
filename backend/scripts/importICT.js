import mongoose from "mongoose";
import dotenv from "dotenv";
import mammoth from "mammoth";
import Lab from "../models/Lab.js";
import Asset from "../models/Asset.js";

dotenv.config();

async function importICT(filePath) {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    const result = await mammoth.extractRawText({ path: filePath });
    const lines = result.value
      .split("\n")
      .map(l => l.trim())
      .filter(l => l);

    let labsCreated = 0;
    let assetsCreated = 0;
    const errors = [];

    const labMap = new Map();        // labName -> labId
    const labCodeMap = new Map();    // labName -> labCode
    const labSlCounter = new Map();  // labCode -> slNo

    let currentLabName = null;
    let currentLabCode = null;
    let currentBatchSize = null;
    let equipmentList = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Skip headers
      if (
        /^(Sr\.?\s*No|Name of the Laboratory|No\.?\s*of students|Batch Size|Name of the Important equipment|Weekly utilization|BTech|MTech)$/i.test(
          line
        )
      ) {
        continue;
      }

      // Detect new lab (e.g. "1.")
      if (/^\d+\./.test(line)) {
        currentLabName = null;
        currentBatchSize = null;
        equipmentList = [];
        continue;
      }

      // Lab name
      if (!currentLabName && /Lab|Computing/i.test(line)) {
        currentLabName = line.trim();
        currentLabCode = currentLabName
          .replace(/\s+/g, "-")
          .toUpperCase()
          .replace(/LAB/i, "LAB-");

        if (!labMap.has(currentLabName)) {
          try {
            const lab = await Lab.findOneAndUpdate(
              { code: currentLabCode },
              {
                code: currentLabCode,
                name: currentLabName,
                department: "ICT",
                location: null,
                remarks: "Imported from ICT.docx"
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
        continue;
      }

      // Batch size
      if (!currentBatchSize && /^\d+$/.test(line) && line.length <= 3) {
        currentBatchSize = parseInt(line);
        continue;
      }

      // Equipment line
      if (line.length > 20 && !/^\d+$/.test(line)) {
        equipmentList.push(line);
        continue;
      }

      // When next lab starts or file ends → insert assets
      if (
        currentLabName &&
        equipmentList.length > 0 &&
        (i === lines.length - 1 || /^\d+\./.test(line))
      ) {
        const labCode = labCodeMap.get(currentLabName);

        for (const equipment of equipmentList) {
          if (equipment.length < 5) continue;

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
                model: equipment,     // ✅ STRING
                pageNo: 1,
                quantity: 1,
                cost: 0,
                purchaseDate: null,
                remarks: currentBatchSize
                  ? `Batch Size: ${currentBatchSize}`
                  : "Imported from ICT.docx"
              },
              { upsert: true, new: true }
            );

            assetsCreated++;
          } catch (err) {
            errors.push(`Asset for ${currentLabCode}: ${err.message}`);
          }
        }

        equipmentList = [];
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
    console.error("Error importing ICT file:", err);
    process.exit(1);
  }
}

const filePath = process.argv[2] || "./data/ICT.docx";
importICT(filePath);
