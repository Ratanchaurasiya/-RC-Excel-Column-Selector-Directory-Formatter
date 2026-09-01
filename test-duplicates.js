import { analyzeDuplicates } from './src/utils/duplicateUtils.js';
import { STUDENT_SAMPLE_WITH_DUPLICATES, STUDENT_SAMPLE_COLUMNS } from './src/utils/sampleData.js';

console.log('=== TEST: DUPLICATE DETECTION & ON/OFF CONTROL ===\n');

// 1. Test Duplicate Analysis
const analysis = analyzeDuplicates(STUDENT_SAMPLE_WITH_DUPLICATES, STUDENT_SAMPLE_COLUMNS);

console.log('Total Raw Records:', analysis.totalRaw);
console.log('Duplicate Records Found:', analysis.duplicateCount);
console.log('Unique Records Count:', analysis.uniqueCount);

console.log('\n--- Duplicate Items Details ---');
analysis.duplicateItems.forEach(item => {
  console.log(`[Duplicate Row #${item.duplicateIndex}] ${item.duplicateRecord.Name} (${item.duplicateRecord['Contact No.']})`);
  console.log(`  -> Reason: ${item.matchReason}`);
  console.log(`  -> Matched with Row #${item.originalIndex} (${item.originalRecord.Name})`);
  console.log(`  -> Matched Fields:`, item.matchedFields);
});

// Verification assertions
if (analysis.totalRaw !== 8) {
  throw new Error(`Expected 8 total raw records, got ${analysis.totalRaw}`);
}
if (analysis.duplicateCount !== 2) {
  throw new Error(`Expected 2 duplicates, got ${analysis.duplicateCount}`);
}
if (analysis.uniqueCount !== 6) {
  throw new Error(`Expected 6 unique records, got ${analysis.uniqueCount}`);
}

// 2. Test ON State:
const onDataset = analysis.uniqueRecords;
console.log('\n[ON State] Output records count:', onDataset.length, '(Expected: 6)');
if (onDataset.length !== 6) throw new Error('ON state dataset mismatch');

// 3. Test OFF State:
const offDataset = analysis.rawRecords;
console.log('[OFF State] Output records count:', offDataset.length, '(Expected: 8)');
if (offDataset.length !== 8) throw new Error('OFF state dataset mismatch');

console.log('\n✅ ALL DUPLICATE DETECTION AND ON/OFF LOGIC TESTS PASSED PERFECTLY!');
