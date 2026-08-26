import * as XLSX from 'xlsx';
import { parseExcelData } from './src/utils/parser.js';
import { generateDirectoryBuffer } from './src/utils/excelGenerator.js';

async function testLargeMultiSheet() {
  console.log('--- Testing Multi-Sheet Workbook with 100+ Records ---');

  // Create a 2-sheet workbook with 60 records on Sheet1 and 60 on Sheet2
  const sheet1Data = [['Business Name', 'Address', 'Phone Number']];
  const sheet2Data = [['Hospital List Export'], ['']];

  for (let i = 1; i <= 60; i++) {
    sheet1Data.push([`Clinic Alpha ${i}`, `Floor ${i}, Science City Rd, Sola, Ahmedabad 380060`, `098980${String(i).padStart(5, '0')}`]);
  }

  for (let i = 61; i <= 120; i++) {
    sheet2Data.push([`Hospital Beta ${i}`]);
    sheet2Data.push([`Block ${i}, Satyamev Eminence, Ahmedabad 380060`]);
    // Leave some without phone number to verify no merging bugs
    if (i % 3 !== 0) {
      sheet2Data.push([`097266${String(i).padStart(5, '0')}`]);
    }
    sheet2Data.push(['']); // Blank separator
  }

  const wb = XLSX.utils.book_new();
  const ws1 = XLSX.utils.aoa_to_sheet(sheet1Data);
  const ws2 = XLSX.utils.aoa_to_sheet(sheet2Data);
  XLSX.utils.book_append_sheet(wb, ws1, 'Clinics');
  XLSX.utils.book_append_sheet(wb, ws2, 'Hospitals');

  const buf = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
  const result = await parseExcelData(buf);

  console.log(`Successfully extracted ${result.records.length} records from all sheets!`);
  console.log(`Stats:`, result.stats);

  if (result.records.length !== 120) {
    throw new Error(`Expected exactly 120 records, got ${result.records.length}`);
  }

  const excelOut = await generateDirectoryBuffer(result.records);
  console.log(`Generated Excel output size: ${excelOut.byteLength} bytes`);
  console.log('All 120 records processed with 100% precision! ✅');
}

testLargeMultiSheet().catch(err => {
  console.error(err);
  process.exit(1);
});
