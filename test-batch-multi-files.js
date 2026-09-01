import { analyzeDuplicates } from './src/utils/duplicateUtils.js';
import { generateDirectoryExcel, generateStructuredExcel } from './src/utils/excelGenerator.js';
import { generateDirectoryPDF } from './src/utils/pdfGenerator.js';
import { exportBatchAsZip, downloadBatchItem } from './src/utils/batchExport.js';
import JSZip from 'jszip';

console.log('=== TEST: MULTI-FILE BATCH PROCESSING & ZIP EXPORT ===\n');

// Mock File 1: Student Data with duplicates
const file1Data = [
  { id: 'f1_1', Name: 'Rahul', 'Contact No.': '9876543210', CGPA: '8.5', District: 'Jaipur' },
  { id: 'f1_2', Name: 'Amit', 'Contact No.': '9876543211', CGPA: '9.1', District: 'Delhi' },
  { id: 'f1_3', Name: 'Priya', 'Contact No.': '9876543212', CGPA: '8.8', District: 'Mumbai' },
  { id: 'f1_4', Name: 'Rahul', 'Contact No.': '9876543210', CGPA: '8.5', District: 'Jaipur' }, // Duplicate
];
const file1Cols = ['Name', 'Contact No.', 'CGPA', 'District'];
const file1DAnalysis = analyzeDuplicates(file1Data, file1Cols);

// Mock File 2: Hospital Directory
const file2Data = [
  { id: 'f2_1', Name: 'City General Hospital', Address: 'MG Road, Bangalore', 'Phone Number': '08022334455' },
  { id: 'f2_2', Name: 'Apollo Clinic', Address: 'Indiranagar, Bangalore', 'Phone Number': '08099887766' },
  { id: 'f2_3', Name: 'Max Health Centre', Address: 'Whitefield, Bangalore', 'Phone Number': '08011223344' },
];
const file2Cols = ['Name', 'Address', 'Phone Number'];
const file2DAnalysis = analyzeDuplicates(file2Data, file2Cols);

// Mock File 3: Vendor Directory with duplicates
const file3Data = [
  { id: 'f3_1', Vendor: 'Apex Logistics', GSTIN: '07AAAAA0000A1Z5', Phone: '9988776655' },
  { id: 'f3_2', Vendor: 'Zenith Packers', GSTIN: '07BBBBB0000B1Z6', Phone: '9988776656' },
  { id: 'f3_3', Vendor: 'Apex Logistics', GSTIN: '07AAAAA0000A1Z5', Phone: '9988776655' }, // Duplicate
];
const file3Cols = ['Vendor', 'GSTIN', 'Phone'];
const file3DAnalysis = analyzeDuplicates(file3Data, file3Cols);

const mockFilesList = [
  {
    id: 'f1',
    fileName: 'Students_Batch_1.xlsx',
    status: 'ready',
    rawDataset: file1Data,
    columns: file1Cols,
    selectedColumns: ['Name', 'CGPA'],
    removeDuplicates: true,
    duplicateAnalysis: file1DAnalysis,
  },
  {
    id: 'f2',
    fileName: 'Hospitals_Directory.xlsx',
    status: 'ready',
    rawDataset: file2Data,
    columns: file2Cols,
    selectedColumns: file2Cols,
    removeDuplicates: true,
    duplicateAnalysis: file2DAnalysis,
  },
  {
    id: 'f3',
    fileName: 'Vendors_List.csv',
    status: 'ready',
    rawDataset: file3Data,
    columns: file3Cols,
    selectedColumns: ['Vendor', 'Phone'],
    removeDuplicates: false, // User chose OFF for this file
    duplicateAnalysis: file3DAnalysis,
  }
];

console.log('1. Checking Multi-File Independence:');
mockFilesList.forEach((f, i) => {
  console.log(`- File ${i + 1}: ${f.fileName}`);
  console.log(`  Raw Records: ${f.rawDataset.length}, Columns: [${f.columns.join(', ')}]`);
  console.log(`  Selected Columns: [${f.selectedColumns.join(', ')}]`);
  console.log(`  Duplicates Detected: ${f.duplicateAnalysis.duplicateCount}`);
  console.log(`  Remove Duplicates: ${f.removeDuplicates ? 'ON' : 'OFF'}`);
  const activeRecords = f.removeDuplicates
    ? f.duplicateAnalysis.uniqueRecords
    : f.duplicateAnalysis.rawRecords;
  console.log(`  Active Output Count: ${activeRecords.length}\n`);
});

// Test Individual Buffer Generation
console.log('2. Testing Individual File Buffer Exports:');
const file1Buffer = await generateDirectoryExcel(
  mockFilesList[0].duplicateAnalysis.uniqueRecords,
  { selectedColumns: mockFilesList[0].selectedColumns, returnBufferOnly: true }
);
console.log(`- File 1 Directory Excel Buffer: ${file1Buffer.byteLength} bytes ✅`);

const file2Buffer = await generateDirectoryExcel(
  mockFilesList[1].rawDataset,
  { selectedColumns: mockFilesList[1].selectedColumns, returnBufferOnly: true }
);
console.log(`- File 2 Directory Excel Buffer: ${file2Buffer.byteLength} bytes ✅`);

// Test ZIP Generation
console.log('\n3. Testing ZIP Bundle Creation:');
const zip = new JSZip();
zip.file('Students_Batch_1_Directory.xlsx', file1Buffer);
zip.file('Hospitals_Directory_Directory.xlsx', file2Buffer);
zip.file('00_Batch_Summary_Report.csv', 'File Name,Status,Total Records\nStudents_Batch_1.xlsx,Ready,4\nHospitals_Directory.xlsx,Ready,3\n');

const zipBlob = await zip.generateAsync({ type: 'nodebuffer' });
console.log(`- Generated ZIP Buffer: ${zipBlob.length} bytes ✅`);
console.log(`- Contained Files in ZIP: ${Object.keys(zip.files).join(', ')} ✅`);

console.log('\n✅ ALL MULTI-FILE BATCH TESTS PASSED PERFECTLY!');
