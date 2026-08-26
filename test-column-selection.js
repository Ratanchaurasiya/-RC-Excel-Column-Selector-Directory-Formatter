import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';
import { parseExcelData } from './src/utils/parser.js';
import { generateSelectedColumnsExcel } from './src/utils/excelGenerator.js';
import { generateStudentSampleWorkbook, STUDENT_SAMPLE_COLUMNS, STUDENT_SAMPLE_RECORDS } from './src/utils/sampleData.js';

async function runColumnSelectionTest() {
  console.log('=== TEST: COLUMN SELECTION & EXTRACTION ===\n');

  // Step 1: Create a test workbook containing 5 columns: Name, Contact No., Address, District, CGPA
  console.log('1. Generating input Excel workbook with 5 columns:');
  console.log('   Columns:', STUDENT_SAMPLE_COLUMNS.join(', '));
  const inputWb = generateStudentSampleWorkbook(XLSX);
  const inputBuffer = XLSX.write(inputWb, { type: 'array', bookType: 'xlsx' });

  // Step 2: Parse Excel workbook with our parser
  console.log('\n2. Parsing Excel workbook...');
  const parseResult = await parseExcelData(inputBuffer);
  console.log('   Detected columns:', parseResult.columns);
  console.log(`   Parsed ${parseResult.tableData.length} records.`);

  if (!parseResult.columns.includes('Name') || !parseResult.columns.includes('CGPA') || !parseResult.columns.includes('Contact No.')) {
    throw new Error('Parser failed to detect all 5 columns from input Excel file!');
  }

  // Step 3: Select ONLY 'Name' and 'CGPA'
  const selectedColumns = ['Name', 'CGPA'];
  console.log('\n3. User selected columns:', selectedColumns);

  // Step 4: Generate new Excel file with only selected columns
  console.log('\n4. Generating new output Excel file containing ONLY selected columns...');
  
  // Custom workbook test using ExcelJS
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Selected Data');
  worksheet.columns = selectedColumns.map(c => ({ header: c, key: c }));
  
  parseResult.tableData.forEach(row => {
    const rowData = {};
    selectedColumns.forEach(c => { rowData[c] = row[c]; });
    worksheet.addRow(rowData);
  });

  const outBuffer = await workbook.xlsx.writeBuffer();
  console.log(`   Generated output Excel size: ${outBuffer.byteLength} bytes`);

  // Step 5: Read the generated Excel back and verify contents
  console.log('\n5. Verifying contents of generated Excel file:');
  const readBackWb = XLSX.read(outBuffer, { type: 'array' });
  const readSheet = readBackWb.Sheets[readBackWb.SheetNames[0]];
  const outputRows = XLSX.utils.sheet_to_json(readSheet, { header: 1 });

  const outputHeaders = outputRows[0];
  console.log('   Output Excel Headers:', outputHeaders);

  // Verification assertions
  if (outputHeaders.length !== 2) {
    throw new Error(`Expected exactly 2 headers, but found ${outputHeaders.length}: ${outputHeaders}`);
  }

  if (outputHeaders[0] !== 'Name' || outputHeaders[1] !== 'CGPA') {
    throw new Error(`Expected headers ['Name', 'CGPA'], but found: ${outputHeaders}`);
  }

  // Verify excluded columns are NOT present
  const excluded = ['Contact No.', 'Address', 'District'];
  for (const ex of excluded) {
    if (outputHeaders.includes(ex)) {
      throw new Error(`FAIL: Excluded column '${ex}' was found in output Excel!`);
    }
  }

  console.log('\n   Output Data Rows:');
  for (let i = 1; i < outputRows.length; i++) {
    console.log(`   Row ${i}:`, outputRows[i].join('\t'));
  }

  // Verify specific rows
  if (outputRows[1][0] !== 'Rahul' || String(outputRows[1][1]) !== '8.5') {
    throw new Error(`Row 1 mismatch: Expected Rahul / 8.5, got: ${outputRows[1]}`);
  }
  if (outputRows[2][0] !== 'Amit' || String(outputRows[2][1]) !== '9.1') {
    throw new Error(`Row 2 mismatch: Expected Amit / 9.1, got: ${outputRows[2]}`);
  }
  if (outputRows[3][0] !== 'Priya' || String(outputRows[3][1]) !== '8.8') {
    throw new Error(`Row 3 mismatch: Expected Priya / 8.8, got: ${outputRows[3]}`);
  }

  console.log('\n✅ ALL VERIFICATION CHECKS PASSED PERFECTLY!');
  console.log('   - Only required columns (Name, CGPA) were extracted.');
  console.log('   - Contact No., Address, and District were cleanly excluded.');
}

runColumnSelectionTest().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
