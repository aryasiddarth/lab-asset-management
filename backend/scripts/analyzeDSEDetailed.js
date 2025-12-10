import mammoth from 'mammoth';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function analyzeDSE(filePath) {
  try {
    console.log(`\n=== Detailed Analysis of DSE.docx ===`);
    const result = await mammoth.extractRawText({ path: filePath });
    const text = result.value;
    
    console.log(`\nFull text content:\n`);
    console.log(text);
    
    console.log(`\n\n=== Line by line analysis ===`);
    const lines = text.split('\n').map(l => l.trim());
    lines.forEach((line, i) => {
      if (line) {
        console.log(`Line ${i + 1}: "${line}"`);
      }
    });
    
    // Try to extract structured data
    console.log(`\n\n=== Attempting to extract structure ===`);
    let inTable = false;
    let currentRow = [];
    const rows = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Look for patterns
      if (/^\d+$/.test(line) && lines[i + 1] && lines[i + 1].match(/Lab/i)) {
        console.log(`\nFound lab entry at line ${i + 1}:`);
        console.log(`  SN: ${line}`);
        console.log(`  Lab Name: ${lines[i + 1]}`);
        if (lines[i + 2]) console.log(`  Next: ${lines[i + 2]}`);
        if (lines[i + 3]) console.log(`  Next: ${lines[i + 3]}`);
        if (lines[i + 4]) console.log(`  Next: ${lines[i + 4]}`);
        if (lines[i + 5]) console.log(`  Next: ${lines[i + 5]}`);
      }
    }
  } catch (error) {
    console.error(`Error: ${error.message}`);
  }
}

const filePath = path.join(__dirname, '../data/DSE.docx');
analyzeDSE(filePath);

