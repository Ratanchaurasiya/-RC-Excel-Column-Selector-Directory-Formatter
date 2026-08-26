import * as XLSX from 'xlsx';
import { parseExcelData } from './src/utils/parser.js';

async function testC1C2C3Formats() {
  console.log('--- Testing C1 (Name), C2 (Address), C3 (Number) Detection ---');

  // Test Case 1: Pure data without any headers
  const test1Data = [
    ['Jyoti Hospital ICU & Pharmacy', 'Ziva Living - Boys PG in Science City, Sola, Ahmedabad', '09909166557'],
    ['Dr. Mital Patel', 'Boned Hospital City Square, opp. Science City Main Gate, Ahmedabad', '09897077004'],
    ['Dr. Parth Patel', 'ANUSTHAN BUNGALOWS, 4, Science City Rd, Ahmedabad', '08153837767'],
    ['HealthPlus Multi-speciality', 'Shop 9, Shyam Residency, Ahmedabad 380060', '09924403054']
  ];

  const wb1 = XLSX.utils.book_new();
  const ws1 = XLSX.utils.aoa_to_sheet(test1Data);
  XLSX.utils.book_append_sheet(wb1, ws1, 'Sheet1');
  const buf1 = XLSX.write(wb1, { type: 'array', bookType: 'xlsx' });

  const res1 = await parseExcelData(buf1);
  console.log('Test 1 (No Headers, Raw Columns):');
  console.log(`Extracted: ${res1.records.length} records`);
  console.log('Sample Record 1:', res1.records[0]);

  if (res1.records.length !== 4 || res1.records[0].phone !== '09909166557' || res1.records[0].name !== 'Jyoti Hospital ICU & Pharmacy') {
    throw new Error('Test 1 failed!');
  }

  // Test Case 2: Headers C1, C2, C3
  const test2Data = [
    ['C1', 'C2', 'C3'],
    ['Empire Doctor House', 'Science City, Sarkhej - Gandhinagar Hwy, Ahmedabad', '09904460242'],
    ['Arise Hospital', 'SANGAM SAPPHIRE, 304-305-306, Science City Rd, Ahmedabad', '09824376762']
  ];

  const wb2 = XLSX.utils.book_new();
  const ws2 = XLSX.utils.aoa_to_sheet(test2Data);
  XLSX.utils.book_append_sheet(wb2, ws2, 'Sheet1');
  const buf2 = XLSX.write(wb2, { type: 'array', bookType: 'xlsx' });

  const res2 = await parseExcelData(buf2);
  console.log('\nTest 2 (C1, C2, C3 Headers):');
  console.log(`Extracted: ${res2.records.length} records`);
  console.log('Sample Record 1:', res2.records[0]);

  if (res2.records.length !== 2 || res2.records[0].name !== 'Empire Doctor House') {
    throw new Error('Test 2 failed!');
  }

  // Test Case 3: SrNo, Name, Addr1, Addr2, Number
  const test3Data = [
    ['Sr No', 'Person Name', 'Address Line 1', 'City / Area', 'Mobile No'],
    [1, 'Shrey Pathology Laboratory', '120, First floor, SATYAMEV EMINENCE', 'Science City, Ahmedabad', '09429541373'],
    [2, 'Aryav Super Speciality', 'opp. Lincoln House, Sola', 'Ahmedabad 380060', '08511451161']
  ];

  const wb3 = XLSX.utils.book_new();
  const ws3 = XLSX.utils.aoa_to_sheet(test3Data);
  XLSX.utils.book_append_sheet(wb3, ws3, 'Sheet1');
  const buf3 = XLSX.write(wb3, { type: 'array', bookType: 'xlsx' });

  const res3 = await parseExcelData(buf3);
  console.log('\nTest 3 (Multi-Column Address Table):');
  console.log(`Extracted: ${res3.records.length} records`);
  console.log('Sample Record 1:', res3.records[0]);

  if (res3.records.length !== 2 || !res3.records[0].address.includes('SATYAMEV EMINENCE') || res3.records[0].phone !== '09429541373') {
    throw new Error('Test 3 failed!');
  }

  console.log('\nAll C1, C2, C3 column layout tests PASSED! ✅');
}

testC1C2C3Formats().catch(err => {
  console.error(err);
  process.exit(1);
});
