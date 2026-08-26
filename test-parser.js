import * as XLSX from 'xlsx';
import { parseRawTextData, parseExcelData } from './src/utils/parser.js';
import { generateDirectoryBuffer } from './src/utils/excelGenerator.js';
import { generateTestUnformattedWorkbook, RAW_BLOCK_SAMPLE_TEXT } from './src/utils/sampleData.js';

async function runTests() {
  console.log('--- TEST 1: Parsing Photo Sample Data ---');
  const textResult = parseRawTextData(RAW_BLOCK_SAMPLE_TEXT);
  console.log(`Parsed ${textResult.records.length} records.`);
  
  if (textResult.records.length < 15) {
    throw new Error(`Expected >=15 records, got ${textResult.records.length}`);
  }

  console.log('Record 1:', textResult.records[0].name, '|', textResult.records[0].phone);
  console.log('Record 2:', textResult.records[1].name, '|', textResult.records[1].phone);
  console.log('Record 8:', textResult.records[7].name, '|', textResult.records[7].phone);

  console.log('\n--- TEST 2: Testing A4 & A3 Excel Generation ---');
  const a4Buffer = await generateDirectoryBuffer(textResult.records, { pageSize: 'A4' });
  const a3Buffer = await generateDirectoryBuffer(textResult.records, { pageSize: 'A3' });
  console.log(`A4 Buffer size: ${a4Buffer.byteLength} bytes`);
  console.log(`A3 Buffer size: ${a3Buffer.byteLength} bytes`);

  console.log('\nAll tests passed successfully! ✅');
}

runTests().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
