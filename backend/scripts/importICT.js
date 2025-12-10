import mongoose from 'mongoose';
import dotenv from 'dotenv';
import mammoth from 'mammoth';
import Lab from '../models/Lab.js';
import Asset from '../models/Asset.js';

dotenv.config();

async function importICT(filePath) {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const result = await mammoth.extractRawText({ path: filePath });
    const text = result.value;
    const lines = text.split('\n').map(l => l.trim()).filter(l => l);

    let labsCreated = 0;
    let assetsCreated = 0;
    const errors = [];
    const labMap = new Map();

    let currentLab = null;
    let currentBatchSize = null;
    let currentEquipment = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Skip header rows
      if (line.match(/^(Sr\.?\s*No|Name of the Laboratory|No\.?\s*of students|Batch Size|Name of the Important equipment|Weekly utilization|BTech|MTech)/i)) {
        continue;
      }

      // Check if it's a lab number (starts with digit and dot)
      if (/^\d+\./.test(line)) {
        // Next lines should be lab name, batch size, equipment
        if (i + 1 < lines.length) {
          currentLab = lines[i + 1].trim();
          i++;
        }
        if (i + 1 < lines.length && /^\d+$/.test(lines[i + 1])) {
          currentBatchSize = parseInt(lines[i + 1]);
          i++;
        }
        currentEquipment = [];
        continue;
      }

      // Check if it's a lab name (contains "Lab" or "Computing")
      if ((line.match(/Lab/i) || line.match(/Computing/i)) && !currentLab) {
        currentLab = line;
        continue;
      }

      // Check if it's batch size
      if (/^\d+$/.test(line) && line.length <= 3 && !currentBatchSize) {
        currentBatchSize = parseInt(line);
        continue;
      }

      // Equipment descriptions are usually longer lines
      if (line.length > 20 && !/^\d+$/.test(line) && !line.match(/^(DS|DISL|ISL|POSL|NIL)$/i)) {
        currentEquipment.push(line);
        continue;
      }

      // When we hit a number (likely next lab or count), process current lab
      if ((/^\d+\./.test(line) || /^\d+$/.test(line)) && currentLab && currentLab !== '') {
        // Create lab
        if (!labMap.has(currentLab)) {
          try {
            const labCode = currentLab.replace(/\s+/g, '-').toUpperCase().replace(/LAB/i, 'LAB-');
            const lab = await Lab.findOneAndUpdate(
              { code: labCode },
              {
                code: labCode,
                name: currentLab,
                department: 'ICT',
                location: null,
                remarks: currentBatchSize ? `Batch Size: ${currentBatchSize}` : 'Imported from ICT.docx'
              },
              { upsert: true, new: true }
            );
            labMap.set(currentLab, lab._id);
            labsCreated++;
            console.log(`Created lab: ${labCode}`);
          } catch (error) {
            errors.push(`Lab ${currentLab}: ${error.message}`);
          }
        }

        // Create assets for equipment
        if (labMap.has(currentLab) && currentEquipment.length > 0) {
          for (const equipment of currentEquipment) {
            if (equipment.length > 5) {
              try {
                const assetTag = `${labMap.get(currentLab)}-${assetsCreated + 1}`;
                await Asset.findOneAndUpdate(
                  { assetTag },
                  {
                    assetTag,
                    labId: labMap.get(currentLab),
                    status: 'WORKING',
                    model: {
                      name: equipment,
                      manufacturer: null
                    },
                    serialNumber: null,
                    purchaseDate: null,
                    warrantyExpiry: null,
                    remarks: currentBatchSize ? `Batch Size: ${currentBatchSize}` : null
                  },
                  { upsert: true, new: true }
                );
                assetsCreated++;
              } catch (error) {
                errors.push(`Asset for ${currentLab}: ${error.message}`);
              }
            }
          }
        }

        // Reset for next lab
        if (/^\d+\./.test(line)) {
          currentLab = null;
          currentBatchSize = null;
          currentEquipment = [];
        }
      }
    }

    // Process last lab
    if (currentLab && labMap.has(currentLab) && currentEquipment.length > 0) {
      for (const equipment of currentEquipment) {
        if (equipment.length > 5) {
          try {
            const assetTag = `${labMap.get(currentLab)}-${assetsCreated + 1}`;
            await Asset.findOneAndUpdate(
              { assetTag },
              {
                assetTag,
                labId: labMap.get(currentLab),
                status: 'WORKING',
                model: {
                  name: equipment,
                  manufacturer: null
                },
                serialNumber: null,
                purchaseDate: null,
                warrantyExpiry: null,
                remarks: currentBatchSize ? `Batch Size: ${currentBatchSize}` : null
              },
              { upsert: true, new: true }
            );
            assetsCreated++;
          } catch (error) {
            errors.push(`Asset for ${currentLab}: ${error.message}`);
          }
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
    console.error('Error importing ICT file:', error);
    process.exit(1);
  }
}

const filePath = process.argv[2] || './data/ICT.docx';
importICT(filePath);

