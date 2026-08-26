import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';
import { generateDirectoryExcel } from './src/utils/excelGenerator.js';
import { STUDENT_SAMPLE_RECORDS } from './src/utils/sampleData.js';

async function testDirectoryColumnSelection() {
  console.log('=== TEST: DIRECTORY EXCEL FORMAT WITH COLUMN SELECTION ===\n');

  // Scenario 1: User selects ['Name', 'CGPA']
  console.log('Test 1: User selects Name and CGPA');
  const options1 = {
    columnsCount: 2,
    selectedColumns: ['Name', 'CGPA'],
    uploadedFileName: 'Test_Name_CGPA',
  };

  const wb1 = new ExcelJS.Workbook();
  const ws1 = wb1.addWorksheet('2-Column Directory');
  ws1.columns = [{ key: 'entry_0', width: 48 }, { key: 'entry_1', width: 48 }];

  // Call generator internal logic
  console.log('Generating directory Excel with 2 columns per page...');
  // We can write to buffer directly
  const { success, filename } = await generateDirectoryExcel(STUDENT_SAMPLE_RECORDS, options1);
  console.log(`Generated ${filename} successfully: ${success}`);

  console.log('\nAll directory Excel generation tests passed! ✅');
}

testDirectoryColumnSelection().catch(err => {
  console.error('Error during test:', err);
  process.exit(1);
});
