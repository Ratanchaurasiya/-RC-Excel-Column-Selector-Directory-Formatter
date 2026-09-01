/**
 * Universal Duplicate Detection and Analysis Utility.
 * Detects duplicate records, identifies matching criteria, and preserves audit trail.
 */

export function analyzeDuplicates(records = [], columns = []) {
  if (!records || !Array.isArray(records) || records.length === 0) {
    return {
      rawRecords: [],
      uniqueRecords: [],
      duplicateItems: [],
      totalRaw: 0,
      duplicateCount: 0,
      uniqueCount: 0,
    };
  }

  const seenMap = new Map();
  const uniqueRecords = [];
  const duplicateItems = [];

  records.forEach((rec, idx) => {
    const rawIndex = idx + 1;

    // Standard field extraction
    const nameVal = String(rec.name || rec.Name || rec['Person Name'] || rec['Business Name'] || rec['Student Name'] || '').trim();
    const phoneVal = String(rec.phone || rec['Phone Number'] || rec['Contact No.'] || rec['Mobile No'] || '').trim();
    const addrVal = String(rec.address || rec.Address || '').trim();

    const normName = nameVal.toLowerCase().replace(/[^a-z0-9]/g, '');
    const normPhone = phoneVal.replace(/[^0-9]/g, '');
    const normAddr = addrVal.toLowerCase().substring(0, 30).replace(/[^a-z0-9]/g, '');

    // Full row value signature across all known columns
    const colKeys = columns.length > 0 
      ? columns 
      : Object.keys(rec).filter(k => !['id', 'rawBlock', 'name', 'phone', 'address'].includes(k));
    
    const rowSignature = colKeys.map(k => String(rec[k] ?? '').toLowerCase().trim()).filter(Boolean).join('|');

    let matchKey = '';
    let matchReason = '';
    let matchedFields = [];

    if (normName && normPhone) {
      matchKey = `np:${normName}|${normPhone}`;
      matchReason = 'Matching Name & Contact Number';
      matchedFields = ['Name', 'Phone'];
    } else if (normName && normAddr) {
      matchKey = `na:${normName}|${normAddr}`;
      matchReason = 'Matching Name & Address';
      matchedFields = ['Name', 'Address'];
    } else if (normPhone && normPhone.length >= 7) {
      matchKey = `p:${normPhone}`;
      matchReason = 'Identical Contact Number';
      matchedFields = ['Phone'];
    } else if (rowSignature && rowSignature.length > 3) {
      matchKey = `row:${rowSignature}`;
      matchReason = 'Exact duplicate across all columns';
      matchedFields = colKeys.slice(0, 3);
    } else if (normName) {
      matchKey = `n:${normName}`;
      matchReason = 'Matching Name / Business Title';
      matchedFields = ['Name'];
    } else {
      matchKey = `id:${rec.id || rawIndex}`;
      matchReason = 'Unique record';
      matchedFields = [];
    }

    if (seenMap.has(matchKey)) {
      const originalEntry = seenMap.get(matchKey);
      duplicateItems.push({
        id: rec.id || `dup_${rawIndex}`,
        duplicateIndex: rawIndex,
        duplicateRecord: rec,
        originalIndex: originalEntry.index,
        originalRecord: originalEntry.record,
        matchReason,
        matchedFields,
      });
    } else {
      seenMap.set(matchKey, { index: rawIndex, record: rec });
      uniqueRecords.push(rec);
    }
  });

  return {
    rawRecords: records,
    uniqueRecords,
    duplicateItems,
    totalRaw: records.length,
    duplicateCount: duplicateItems.length,
    uniqueCount: uniqueRecords.length,
  };
}

/**
 * Downloads a CSV report of all duplicate records found.
 */
export function exportDuplicatesCSV(duplicateItems = [], filename = 'Duplicate_Records_Report.csv') {
  if (!duplicateItems || duplicateItems.length === 0) return;

  const headers = ['Duplicate Row #', 'Matched Original Row #', 'Detection Reason', 'Matched Fields', 'Name / Business', 'Contact No', 'Address'];
  
  const rows = duplicateItems.map(item => {
    const dRec = item.duplicateRecord || {};
    const name = String(dRec.name || dRec.Name || Object.values(dRec)[0] || '').replace(/"/g, '""');
    const phone = String(dRec.phone || dRec['Phone Number'] || dRec['Contact No.'] || '').replace(/"/g, '""');
    const addr = String(dRec.address || dRec.Address || '').replace(/"/g, '""');
    const reason = String(item.matchReason || '').replace(/"/g, '""');
    const fields = (item.matchedFields || []).join(', ').replace(/"/g, '""');

    return [
      item.duplicateIndex,
      item.originalIndex,
      `"${reason}"`,
      `"${fields}"`,
      `"${name}"`,
      `"${phone}"`,
      `"${addr}"`,
    ].join(',');
  });

  const csvContent = [headers.join(','), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
