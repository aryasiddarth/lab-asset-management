import ExcelJS from 'exceljs';
import mammoth from 'mammoth';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function analyzeExcel(filePath) {
  try {
    console.log(`\n=== Analyzing ${path.basename(filePath)} ===`);
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);
    
    console.log(`\nTotal sheets: ${workbook.worksheets.length}`);
    
    workbook.worksheets.forEach((worksheet, index) => {
      console.log(`\nSheet ${index + 1}: "${worksheet.name}"`);
      console.log(`  Rows: ${worksheet.rowCount}`);
      console.log(`  Columns: ${worksheet.columnCount}`);
      
      // Get header row
      if (worksheet.rowCount > 0) {
        const headerRow = worksheet.getRow(1);
        const headers = [];
        headerRow.eachCell((cell, colNumber) => {
          headers.push(cell.value || `Column ${colNumber}`);
        });
        console.log(`  Headers: ${headers.join(', ')}`);
        
        // Show first few data rows
        console.log(`  First 3 data rows:`);
        for (let i = 2; i <= Math.min(4, worksheet.rowCount); i++) {
          const row = worksheet.getRow(i);
          const values = [];
          row.eachCell((cell, colNumber) => {
            values.push(cell.value || '');
          });
          console.log(`    Row ${i}: ${values.join(' | ')}`);
        }
      }
    });
  } catch (error) {
    console.error(`Error analyzing Excel file: ${error.message}`);
  }
}

async function analyzeDocx(filePath) {
  try {
    console.log(`\n=== Analyzing ${path.basename(filePath)} ===`);
    const result = await mammoth.extractRawText({ path: filePath });
    const text = result.value;
    
    console.log(`\nFile size: ${text.length} characters`);
    console.log(`\nFirst 1000 characters:`);
    console.log(text.substring(0, 1000));
    console.log(`\n...`);
    
    // Try to identify structure
    const lines = text.split('\n').filter(line => line.trim());
    console.log(`\nTotal lines: ${lines.length}`);
    console.log(`\nFirst 20 lines:`);
    lines.slice(0, 20).forEach((line, i) => {
      console.log(`  ${i + 1}: ${line.substring(0, 100)}`);
    });
  } catch (error) {
    console.error(`Error analyzing DOCX file: ${error.message}`);
  }
}

async function main() {
  const dataDir = path.join(__dirname, '../data');
  
  // Analyze Excel file
  const excelFile = path.join(dataDir, 'CSE.xlsx');
  if (fs.existsSync(excelFile)) {
    await analyzeExcel(excelFile);
  }
  
  // Analyze DOCX files
  const docxFiles = ['DSE.docx', 'ICT.docx'];
  for (const fileName of docxFiles) {
    const filePath = path.join(dataDir, fileName);
    if (fs.existsSync(filePath)) {
      await analyzeDocx(filePath);
    }
  }
  
  console.log('\n=== Analysis Complete ===\n');
}

main().catch(console.error);

