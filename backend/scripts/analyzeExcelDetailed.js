import ExcelJS from 'exceljs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function analyzeExcel(filePath) {
  try {
    console.log(`\n=== Detailed Analysis of ${path.basename(filePath)} ===`);
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);
    
    const worksheet = workbook.getWorksheet(1); // First sheet
    
    console.log(`\nTotal rows: ${worksheet.rowCount}`);
    console.log(`Total columns: ${worksheet.columnCount}`);
    
    // Show all rows
    console.log(`\nAll rows:`);
    for (let i = 1; i <= worksheet.rowCount; i++) {
      const row = worksheet.getRow(i);
      const values = [];
      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        values.push(cell.value !== null && cell.value !== undefined ? String(cell.value) : '[empty]');
      });
      console.log(`Row ${i}: ${values.join(' | ')}`);
    }
  } catch (error) {
    console.error(`Error: ${error.message}`);
  }
}

const filePath = path.join(__dirname, '../data/CSE.xlsx');
analyzeExcel(filePath);

