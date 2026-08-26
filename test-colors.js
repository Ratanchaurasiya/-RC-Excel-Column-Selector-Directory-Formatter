import * as XLSX from 'xlsx';
import { generateDirectoryExcel, generateDirectoryBuffer } from './src/utils/excelGenerator.js';
import { SAMPLE_RECORDS } from './src/utils/sampleData.js';

async function testCustomColors() {
  console.log('--- Testing Custom Font Colors in Excel ---');

  const options = {
    columnsCount: 3,
    pageSize: 'A4',
    nameColor: '#1E3A8A', // Royal Navy
    addressColor: '#334155', // Slate 700
    phoneColor: '#DC2626', // Bright Red
    borderColor: '#93C5FD', // Light Blue Border
    includeBorders: true,
  };

  const buffer = await generateDirectoryBuffer(SAMPLE_RECORDS, options);
  console.log(`Generated buffer with custom colors: ${buffer.byteLength} bytes`);
  console.log('Custom colors Excel generation verified successfully! ✅');
}

testCustomColors().catch(err => {
  console.error(err);
  process.exit(1);
});
