import mongoose from 'mongoose';
import dotenv from 'dotenv';
import mammoth from 'mammoth';
import Lab from '../models/Lab.js';
import Asset from '../models/Asset.js';

dotenv.config();

async function importDSE(filePath) {
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
    let currentLabCode = null;
    let currentEquipmentType = null;
    let currentEquipmentDesc = null;
    let assetCounter = 1;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Skip header rows
      if (line.match(/^(SN|Name of the lab|Name of major equipment|Count|Utilization|attainment)$/i)) {
        continue;
      }

      // Check if it's a serial number (just a digit) followed by lab name
      if (/^\d+$/.test(line) && i + 1 < lines.length) {
        const nextLine = lines[i + 1];
        // If next line is a lab name, this is a new entry
        if (nextLine && (nextLine.match(/Lab/i) || nextLine.match(/Research|Development|Virtual Reality|Centre/i))) {
          // Save previous equipment if any
          if (currentLab && currentEquipmentDesc && labMap.has(currentLab)) {
            // Look ahead for count
            let count = 1;
            for (let j = i - 1; j >= 0 && j > i - 10; j--) {
              if (/^\d+$/.test(lines[j])) {
                count = parseInt(lines[j]);
                break;
              }
            }
            
            try {
              const assetTag = `DSE-${currentLabCode}-${assetCounter++}`;
              await Asset.findOneAndUpdate(
                { assetTag },
                {
                  assetTag,
                  labId: labMap.get(currentLab),
                  status: 'WORKING',
                  model: {
                    name: currentEquipmentDesc,
                    manufacturer: null
                  },
                  serialNumber: null,
                  purchaseDate: null,
                  warrantyExpiry: null,
                  remarks: `${currentEquipmentType || ''} - Count: ${count}`
                },
                { upsert: true, new: true }
              );
              assetsCreated++;
              console.log(`  Created asset: ${assetTag} - ${currentEquipmentDesc} (Count: ${count})`);
            } catch (error) {
              errors.push(`Asset for ${currentLab}: ${error.message}`);
            }
          }
          
          // Start new lab
          currentLab = nextLine;
          // Create proper lab code
          let labCodeBase = currentLab.replace(/\s+/g, '-').toUpperCase();
          if (labCodeBase.match(/COMPUTING-LAB/i)) {
            labCodeBase = labCodeBase.replace(/COMPUTING-LAB-?/i, 'LAB-');
          } else if (labCodeBase.match(/LAB/i)) {
            labCodeBase = labCodeBase.replace(/LAB/i, 'LAB-');
          } else {
            labCodeBase = 'LAB-' + labCodeBase;
          }
          currentLabCode = labCodeBase;
          
          // Create lab if not exists
          if (!labMap.has(currentLab)) {
            try {
              const lab = await Lab.findOneAndUpdate(
                { code: currentLabCode },
                {
                  code: currentLabCode,
                  name: currentLab,
                  department: 'DSE',
                  location: null,
                  remarks: 'Imported from DSE.docx'
                },
                { upsert: true, new: true }
              );
              labMap.set(currentLab, lab._id);
              labsCreated++;
              console.log(`Created lab: ${currentLabCode} (${currentLab})`);
            } catch (error) {
              errors.push(`Lab ${currentLab}: ${error.message}`);
            }
          }
          
          // Reset equipment tracking
          currentEquipmentType = null;
          currentEquipmentDesc = null;
          assetCounter = 1; // Reset counter for new lab
          i++; // Skip the lab name line
          continue;
        }
      }

      // Check if it's equipment type (contains colon)
      if (line.includes(':') && currentLab) {
        // Save previous equipment if we have description and can find count
        if (currentEquipmentDesc && labMap.has(currentLab)) {
          // Look for count in next few lines
          let count = 1;
          for (let j = i + 1; j < lines.length && j < i + 5; j++) {
            if (/^\d+$/.test(lines[j])) {
              count = parseInt(lines[j]);
              break;
            }
          }
          
          try {
            const assetTag = `DSE-${currentLabCode}-${assetCounter++}`;
            await Asset.findOneAndUpdate(
              { assetTag },
              {
                assetTag,
                labId: labMap.get(currentLab),
                status: 'WORKING',
                model: {
                  name: currentEquipmentDesc,
                  manufacturer: null
                },
                serialNumber: null,
                purchaseDate: null,
                warrantyExpiry: null,
                remarks: `${currentEquipmentType || ''} - Count: ${count}`
              },
              { upsert: true, new: true }
            );
            assetsCreated++;
            console.log(`  Created asset: ${assetTag} - ${currentEquipmentDesc} (Count: ${count})`);
          } catch (error) {
            errors.push(`Asset for ${currentLab}: ${error.message}`);
          }
        }
        
        // Parse equipment type and description
        const colonIndex = line.indexOf(':');
        currentEquipmentType = line.substring(0, colonIndex).trim();
        const descriptionPart = line.substring(colonIndex + 1).trim();
        
        // If description is on same line, use it
        if (descriptionPart && descriptionPart.length > 5) {
          currentEquipmentDesc = descriptionPart;
        } else if (i + 1 < lines.length) {
          const nextLine = lines[i + 1].trim();
          // Only use next line if it's not a number (count) and not empty
          if (nextLine && !/^\d+$/.test(nextLine) && nextLine.length > 5) {
            currentEquipmentDesc = nextLine;
            i++; // Skip description line
          }
        }
        continue;
      }

      // If we have equipment type but no description yet, this might be the description
      if (currentEquipmentType && !currentEquipmentDesc && line.length > 10 && !line.endsWith(':') && !/^\d+$/.test(line) && !line.match(/MTech|Btech|Sem|CSS|HUM/i)) {
        currentEquipmentDesc = line;
        continue;
      }
    }

    // Process last asset if any
    if (currentLab && currentEquipmentDesc && labMap.has(currentLab)) {
      let count = 1;
      // Look for count in previous lines
      const lineIndex = lines.length - 1;
      for (let j = lineIndex; j >= 0 && j > lineIndex - 10; j--) {
        if (/^\d+$/.test(lines[j])) {
          count = parseInt(lines[j]);
          break;
        }
      }
      
      try {
        const assetTag = `DSE-${currentLabCode}-${assetCounter++}`;
        await Asset.findOneAndUpdate(
          { assetTag },
          {
            assetTag,
            labId: labMap.get(currentLab),
            status: 'WORKING',
            model: {
              name: currentEquipmentDesc,
              manufacturer: null
            },
            serialNumber: null,
            purchaseDate: null,
            warrantyExpiry: null,
            remarks: `${currentEquipmentType || ''} - Count: ${count}`
          },
          { upsert: true, new: true }
        );
        assetsCreated++;
      } catch (error) {
        errors.push(`Asset for ${currentLab}: ${error.message}`);
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
    console.error('Error importing DSE file:', error);
    process.exit(1);
  }
}

const filePath = process.argv[2] || './data/DSE.docx';
importDSE(filePath);
