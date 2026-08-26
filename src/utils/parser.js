import * as XLSX from 'xlsx';

/**
 * Regular expressions for detecting phone numbers.
 * Supports Indian mobile & landline patterns, STD codes with leading 0, +91, 10-digit mobiles, 11-digit landline/mobiles.
 */
const PHONE_EXTRACT_REGEX = /(?:\+?91[\s\-]?)?(?:0?[1-9]\d{1,4}[\s\-]?)?[6-9]\d{9}|0\d{10,11}|\b\d{10,11}\b|\b0\d{2,4}[\s\-]\d{6,8}\b|\b\d{5}[\s\-]\d{5}\b/g;
const PHONE_STRICT_REGEX = /(?:\+?91[\s\-]?)?0?[6-9]\d{4}[\s\-]?\d{5}|0[1-9]\d{1,4}[\s\-]?\d{6,8}|\b\d{10,11}\b/;

/**
 * Common business/hospital name indicators.
 */
const BUSINESS_PREFIX_REGEX = /^(?:dr\.?|dr\b|m\/s|hospital|clinic|centre|center|nursing|pharmacy|laboratory|pathology|dental|physiotherapy|surgicare|diagnostic|polyclinic|eye|skin|care|shree|shri|apex|sterling|advance|ziva|ayush|setu|health|empire|arise|vasundhara|prarambh|boneplus|midas|aarvi|arvy|jyoti|namah|prime)\b/i;
const BUSINESS_SUFFIX_REGEX = /\b(?:hospital|icu|pharmacy|clinic|centre|center|lab|laboratory|pathology|nursing home|care|healthcare|dental|physio|physiotherapy|surgicare|speciality|specialty|diagnostics|enterprises|pvt ltd|ltd|llp|store|stores|agency|pg|residency|apartments)\b/i;

/**
 * Common address indicators.
 */
const ADDRESS_KEYWORDS_REGEX = /\b(?:floor|road|rd|opp|opposite|near|nr|b\/s|beside|behind|bungalows|bunglows|square|arcade|eminence|complex|mall|cross road|cross roads|sola|science city|ahmedabad|gujarat|india|street|lane|nagar|society|soc|flat|residency|tower|towers|chamber|chambers|sector|block|shop no|plot no|pin|pincode|3800\d{2})\b/i;

/**
 * Checks if a string looks primarily like a phone number.
 */
export function isPhoneNumber(str) {
  if (!str) return false;
  const clean = String(str).trim();
  const digitOnly = clean.replace(/[\s\-\+\(\)\/,]/g, '');
  if (digitOnly.length >= 7 && digitOnly.length <= 15 && /^\d+$/.test(digitOnly)) {
    return true;
  }
  return PHONE_STRICT_REGEX.test(clean) && clean.length < 35;
}

/**
 * Checks if a value is likely a serial number (1, 2, 3...)
 */
function isSerialNumber(val) {
  if (val === null || val === undefined) return false;
  const str = String(val).trim();
  return /^\d{1,5}$/.test(str) && Number(str) < 50000;
}

/**
 * Extracts phone number(s) from a text string, returning { phone, remainingText }.
 */
export function extractPhoneFromText(str) {
  if (!str) return { phone: '', remainingText: '' };
  const text = String(str).trim();
  
  const matches = text.match(PHONE_EXTRACT_REGEX);
  if (matches && matches.length > 0) {
    const phone = matches.join(' / ');
    let remainingText = text;
    for (const m of matches) {
      remainingText = remainingText.replace(m, ' ');
    }
    remainingText = remainingText.replace(/\s{2,}/g, ' ').replace(/^[\s,\-\/]+|[\s,\-\/]+$/g, '').trim();
    return { phone, remainingText };
  }

  return { phone: '', remainingText: text };
}

/**
 * Cleans and formats phone number string, strictly preserving leading zeros.
 */
export function cleanPhoneNumber(raw) {
  if (raw === null || raw === undefined) return '';
  let str = String(raw).trim();
  
  // Handle scientific notation e.g. 9.90917E+10
  if (/^\d+\.?\d*e\+\d+$/i.test(str)) {
    try {
      str = BigInt(Math.round(Number(str))).toString();
    } catch {
      // fallback
    }
  }

  str = str.replace(/^['"]+|['"]+$/g, '').trim();
  return str;
}

/**
 * Checks if a line is just a metadata title or page banner to ignore.
 */
function isDocumentTitleRow(str) {
  if (!str) return false;
  const lower = str.toLowerCase().trim();
  const titleKeywords = [
    'raw hospital', 'records dump', 'business directory dump', 'contact list export',
    'hospital list', 'clinic list', 'doctor directory', 'sheet 1', 'sheet1', 'page 1', 'page1',
    'left column', 'right column', 'sr no', 'table 1'
  ];
  return titleKeywords.some(kw => lower === kw || (lower.includes(kw) && lower.length < 40));
}

/**
 * Cleans address text, formatting multiple lines into a clean contiguous address.
 */
export function cleanAddress(lines) {
  if (!lines) return '';
  const arr = Array.isArray(lines) ? lines : [lines];
  
  const cleanedParts = arr
    .map(part => (part === null || part === undefined ? '' : String(part).trim()))
    .filter(part => part.length > 0 && !isPhoneNumber(part) && !isDocumentTitleRow(part));

  let joined = cleanedParts.join(', ');
  
  joined = joined
    .replace(/\s*,\s*,+/g, ', ')
    .replace(/,\s*,/g, ', ')
    .replace(/\s{2,}/g, ' ')
    .replace(/^[,\s\-]+|[,\s\-]+$/g, '');

  return joined;
}

/**
 * Cleans business/person name, removing leading numbering (e.g. "1. ", "01 - ", etc.)
 */
export function cleanName(name) {
  if (!name) return '';
  let str = String(name).trim();
  str = str.replace(/^(?:#|\b\d{1,4}[\.\)\-\:]\s*)/, '').trim();
  return str;
}

/**
 * Deduplicate records by normalized Name + Phone or Name + Address.
 */
export function deduplicateRecords(records) {
  const seen = new Set();
  const unique = [];
  let duplicatesCount = 0;

  for (const rec of records) {
    if (!rec.name && !rec.phone && !rec.address) continue;
    
    const normName = (rec.name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const normPhone = (rec.phone || '').replace(/[^0-9]/g, '');
    const normAddr = (rec.address || '').toLowerCase().substring(0, 25).replace(/[^a-z0-9]/g, '');
    
    const key = normName ? `${normName}|${normPhone || normAddr}` : `${normAddr}|${normPhone}`;
    
    if (seen.has(key)) {
      duplicatesCount++;
    } else {
      seen.add(key);
      unique.push(rec);
    }
  }

  return { unique, duplicatesCount };
}

/**
 * Intelligently recognizes Row-Record Column Format (e.g. C1 = Name, C2 = Address, C3 = Number).
 * Works whether header row exists or data starts directly at Row 0.
 */
function parseRowRecordLayout(sheetData) {
  if (!sheetData || sheetData.length === 0) return [];

  // Filter out completely empty rows
  const validRows = sheetData.filter(r => (r || []).some(c => c !== null && c !== undefined && String(c).trim() !== ''));
  if (validRows.length === 0) return [];

  // Check max column width
  const maxCols = Math.max(...validRows.slice(0, 25).map(r => r.length));
  if (maxCols < 2) {
    // If only 1 column, fallback to block layout parser
    return [];
  }

  // 1. Check if first row is a header row
  const firstRow = validRows[0] || [];
  let hasExplicitHeader = false;
  let nameCol = -1;
  let phoneCol = -1;
  let addrCols = [];
  let srNoCol = -1;

  for (let c = 0; c < firstRow.length; c++) {
    const val = String(firstRow[c] || '').toLowerCase().trim();
    if (!val) continue;

    if (['sr', 'sr no', 'sr.', 'id', 's.no', 'no.', 'sn', 'index'].some(k => val === k || val.startsWith(k))) {
      srNoCol = c;
    }
    if (['name', 'person name', 'business name', 'hospital name', 'clinic name', 'doctor name', 'title', 'company', 'shop name', 'c1', 'full name'].some(k => val === k || val.includes(k))) {
      nameCol = c;
    }
    if (['phone', 'mobile', 'contact', 'telephone', 'cell', 'tel', 'ph no', 'phone number', 'mob', 'number', 'c3', 'mobile no', 'contact no'].some(k => val === k || val.includes(k))) {
      phoneCol = c;
    }
    if (['address', 'location', 'full address', 'street', 'area', 'city', 'state', 'pincode', 'pin code', 'road', 'c2', 'addr'].some(k => val === k || val.includes(k))) {
      addrCols.push(c);
    }
  }

  if (nameCol !== -1 && (phoneCol !== -1 || addrCols.length > 0)) {
    hasExplicitHeader = true;
  }

  // 2. If no explicit header, auto-detect column roles statistically
  let dataStartRow = hasExplicitHeader ? 1 : 0;

  if (!hasExplicitHeader) {
    // Analyze column data types across sample rows
    const sampleRows = validRows.slice(0, Math.min(20, validRows.length));
    const colScores = [];

    for (let c = 0; c < maxCols; c++) {
      let phoneCount = 0;
      let serialCount = 0;
      let addressCount = 0;
      let nameCount = 0;
      let nonEmptyCount = 0;

      for (const row of sampleRows) {
        const val = String(row[c] || '').trim();
        if (!val) continue;
        nonEmptyCount++;

        if (isPhoneNumber(val)) {
          phoneCount++;
        } else if (isSerialNumber(val)) {
          serialCount++;
        } else if (ADDRESS_KEYWORDS_REGEX.test(val) || val.length > 35 || val.includes(',')) {
          addressCount++;
        } else {
          nameCount++;
        }
      }

      colScores.push({
        col: c,
        phoneRate: nonEmptyCount > 0 ? phoneCount / nonEmptyCount : 0,
        serialRate: nonEmptyCount > 0 ? serialCount / nonEmptyCount : 0,
        addressRate: nonEmptyCount > 0 ? addressCount / nonEmptyCount : 0,
        nameRate: nonEmptyCount > 0 ? nameCount / nonEmptyCount : 0,
        nonEmptyCount
      });
    }

    // Identify Phone Column (highest phoneRate)
    const phoneCandidates = colScores.filter(cs => cs.phoneRate > 0.4);
    if (phoneCandidates.length > 0) {
      phoneCandidates.sort((a, b) => b.phoneRate - a.phoneRate);
      phoneCol = phoneCandidates[0].col;
    }

    // Identify Serial Number Column
    const srCandidates = colScores.filter(cs => cs.col !== phoneCol && cs.serialRate > 0.7);
    if (srCandidates.length > 0) {
      srNoCol = srCandidates[0].col;
    }

    // Identify Name Column (first non-phone, non-serial column, or highest name rate)
    const remainingForName = colScores.filter(cs => cs.col !== phoneCol && cs.col !== srNoCol && cs.nonEmptyCount > 0);
    if (remainingForName.length > 0) {
      nameCol = remainingForName[0].col;
    }

    // Identify Address Columns (all other non-serial, non-phone, non-name columns)
    addrCols = colScores
      .filter(cs => cs.col !== phoneCol && cs.col !== srNoCol && cs.col !== nameCol && cs.nonEmptyCount > 0)
      .map(cs => cs.col);

    // Fallback: If 3 columns [C1, C2, C3] -> C1: Name, C2: Address, C3: Phone
    if (nameCol === -1 && maxCols >= 3) {
      nameCol = 0;
      addrCols = [1];
      phoneCol = 2;
    } else if (nameCol === -1 && maxCols === 2) {
      nameCol = 0;
      addrCols = [1];
    }
  }

  // 3. Extract records from data rows
  const records = [];

  for (let r = dataStartRow; r < validRows.length; r++) {
    const row = validRows[r] || [];
    
    // Name
    let rawName = nameCol !== -1 && row[nameCol] !== undefined ? String(row[nameCol]).trim() : '';
    
    // Phone
    let rawPhone = phoneCol !== -1 && row[phoneCol] !== undefined ? cleanPhoneNumber(row[phoneCol]) : '';

    // Address
    const addrParts = [];
    if (addrCols.length > 0) {
      for (const colIdx of addrCols) {
        if (row[colIdx] !== undefined && row[colIdx] !== null && String(row[colIdx]).trim() !== '') {
          addrParts.push(String(row[colIdx]).trim());
        }
      }
    } else {
      // If no explicit address col, gather remaining columns
      for (let c = 0; c < row.length; c++) {
        if (c !== nameCol && c !== phoneCol && c !== srNoCol) {
          const val = String(row[c] || '').trim();
          if (val) addrParts.push(val);
        }
      }
    }

    let address = cleanAddress(addrParts);
    let name = cleanName(rawName);

    // If phone is missing from designated phone column, check if embedded in address or name
    if (!rawPhone) {
      const extractedFromAddr = extractPhoneFromText(address);
      if (extractedFromAddr.phone) {
        rawPhone = extractedFromAddr.phone;
        address = extractedFromAddr.remainingText;
      }
    }

    // Check if phone was placed in Name column
    if (!rawPhone && name) {
      const extractedFromName = extractPhoneFromText(name);
      if (extractedFromName.phone) {
        rawPhone = extractedFromName.phone;
        name = extractedFromName.remainingText;
      }
    }

    if (name || rawPhone || address) {
      records.push({
        id: `rec_${records.length + 1}`,
        name: name || 'Unnamed Person',
        address: address || '',
        phone: rawPhone || '',
        rawBlock: `${name}\n${address}\n${rawPhone}`
      });
    }
  }

  return records;
}

/**
 * Parses multi-row or block layout from an array of 2D row data.
 * Used when records are stacked vertically in rows rather than side-by-side in columns.
 */
function parseBlockLayout(sheetData) {
  const records = [];
  let currentRecordLines = [];

  const commitBlock = (lines) => {
    if (!lines || lines.length === 0) return;

    const validLines = lines.filter(l => !isDocumentTitleRow(l));
    if (validLines.length === 0) return;

    let phone = '';
    let phoneIndex = -1;

    // Check lines from bottom up for phone number
    for (let i = validLines.length - 1; i >= 0; i--) {
      const lineStr = validLines[i].trim();
      if (isPhoneNumber(lineStr)) {
        phone = cleanPhoneNumber(lineStr);
        phoneIndex = i;
        break;
      } else {
        const extracted = extractPhoneFromText(lineStr);
        if (extracted.phone && isPhoneNumber(extracted.phone)) {
          phone = cleanPhoneNumber(extracted.phone);
          if (extracted.remainingText) {
            validLines[i] = extracted.remainingText;
          } else {
            phoneIndex = i;
          }
          break;
        }
      }
    }

    const name = cleanName(validLines[0]);
    const addressLines = [];

    for (let i = 1; i < validLines.length; i++) {
      if (i !== phoneIndex) {
        addressLines.push(validLines[i]);
      }
    }
    
    const address = cleanAddress(addressLines);

    if (name || address || phone) {
      records.push({
        id: `rec_${records.length + 1}`,
        name: name || 'Unnamed Entry',
        address: address || '',
        phone: phone || '',
        rawBlock: validLines.join('\n')
      });
    }
  };

  let justSawPhone = false;

  for (let r = 0; r < sheetData.length; r++) {
    const row = sheetData[r];
    const nonEmpties = (row || []).map(c => (c !== null && c !== undefined ? String(c).trim() : '')).filter(Boolean);
    
    if (nonEmpties.length === 0) {
      if (currentRecordLines.length > 0) {
        commitBlock(currentRecordLines);
        currentRecordLines = [];
        justSawPhone = false;
      }
    } else {
      if (currentRecordLines.length === 0 && nonEmpties.length === 1 && isDocumentTitleRow(nonEmpties[0])) {
        continue;
      }

      if (nonEmpties.length === 1 && nonEmpties[0].includes('\n')) {
        if (currentRecordLines.length > 0) {
          commitBlock(currentRecordLines);
          currentRecordLines = [];
        }
        const innerLines = nonEmpties[0].split(/\r?\n/).map(l => l.trim()).filter(Boolean);
        commitBlock(innerLines);
        justSawPhone = false;
        continue;
      }

      const rowText = nonEmpties.join(', ');
      const isPhone = isPhoneNumber(rowText);

      if (justSawPhone) {
        commitBlock(currentRecordLines);
        currentRecordLines = [rowText];
        justSawPhone = isPhone;
        continue;
      }

      const isNameLike = BUSINESS_PREFIX_REGEX.test(rowText) || BUSINESS_SUFFIX_REGEX.test(rowText);
      const hasAddressLines = currentRecordLines.some(l => ADDRESS_KEYWORDS_REGEX.test(l));

      if (isNameLike && hasAddressLines && currentRecordLines.length >= 2) {
        commitBlock(currentRecordLines);
        currentRecordLines = [rowText];
        justSawPhone = isPhone;
        continue;
      }

      currentRecordLines.push(rowText);

      if (isPhone) {
        justSawPhone = true;
      }
    }
  }

  if (currentRecordLines.length > 0) {
    commitBlock(currentRecordLines);
  }

  return records;
}

/**
 * Extracts generic tabular column names and row records from 2D sheet data.
 * Supports any Excel layout (arbitrary headers like Name, Contact No., CGPA, District, etc.)
 */
export function extractTabularColumnsAndRows(sheetData) {
  if (!sheetData || sheetData.length === 0) {
    return { columns: [], tableData: [], records: [] };
  }

  // Filter out completely blank rows
  const validRows = sheetData.filter(r => (r || []).some(c => c !== null && c !== undefined && String(c).trim() !== ''));
  if (validRows.length === 0) {
    return { columns: [], tableData: [], records: [] };
  }

  // Check max column width
  const maxCols = Math.max(...validRows.slice(0, 30).map(r => (r ? r.length : 0)));
  if (maxCols < 2) {
    return { columns: [], tableData: [], records: [] };
  }

  const firstRow = validRows[0] || [];
  
  // Detect if first row is a header row
  let isHeaderRow = false;
  const nonBlankFirstRow = firstRow.filter(c => c !== null && c !== undefined && String(c).trim() !== '');
  
  if (nonBlankFirstRow.length > 0) {
    if (validRows.length > 1) {
      // Let's do a smart check to see if the first row is actually data
      let looksLikeData = false;
      for (const cell of firstRow) {
        if (cell === null || cell === undefined) continue;
        const str = String(cell).trim();
        if (!str) continue;
        
        // If it's a phone number, it's data
        if (isPhoneNumber(str)) {
          looksLikeData = true;
          break;
        }
        
        // If it's very long, it's probably data (e.g. address or long text)
        if (str.length > 40) {
          looksLikeData = true;
          break;
        }
        
        // If it contains a comma and is longer than 15 chars, it's likely an address or data
        if (str.includes(',') && str.length > 15) {
          looksLikeData = true;
          break;
        }
      }
      
      // Let's also check if any header keyword is present
      let hasHeaderKeywords = false;
      const headerKeywords = [
        'name', 'phone', 'mobile', 'contact', 'address', 'location', 'c1', 'c2', 'c3',
        'sr no', 'sr.no', 'sr.', 'id', 's.no', 'index', 'district', 'cgpa', 'email', 'website',
        'roll', 'gender', 'age', 'standard', 'class'
      ];
      for (const cell of firstRow) {
        if (cell === null || cell === undefined) continue;
        const str = String(cell).toLowerCase().trim();
        if (headerKeywords.some(kw => str === kw || str.includes(kw))) {
          hasHeaderKeywords = true;
          break;
        }
      }
      
      // If it looks like data, it is not a header.
      // Otherwise, if it has header keywords, or if it doesn't look like data and has short column names, we can assume it's a header.
      if (looksLikeData) {
        isHeaderRow = false;
      } else {
        // If first row has header keywords, definitely header
        if (hasHeaderKeywords) {
          isHeaderRow = true;
        } else {
          // Otherwise, check if average length of non-empty cells is small (e.g. < 20) and no cells look like data
          const lengths = nonBlankFirstRow.map(c => String(c).trim().length);
          const avgLength = lengths.reduce((a, b) => a + b, 0) / lengths.length;
          if (avgLength < 20) {
            isHeaderRow = true;
          } else {
            isHeaderRow = false;
          }
        }
      }
    } else {
      isHeaderRow = nonBlankFirstRow.some(c => isNaN(Number(c)) && !isPhoneNumber(c));
    }
  }

  let dataStartIdx = isHeaderRow ? 1 : 0;
  
  // Build unique column names list
  const columns = [];
  const colNameCount = {};

  for (let c = 0; c < maxCols; c++) {
    let rawHeader = isHeaderRow && firstRow[c] !== undefined && firstRow[c] !== null ? String(firstRow[c]).trim() : '';
    if (!rawHeader) {
      rawHeader = `Column ${c + 1}`;
    }
    
    // Ensure uniqueness
    if (colNameCount[rawHeader]) {
      colNameCount[rawHeader]++;
      columns.push(`${rawHeader} (${colNameCount[rawHeader]})`);
    } else {
      colNameCount[rawHeader] = 1;
      columns.push(rawHeader);
    }
  }

  // Build tableData array of objects
  const tableData = [];
  const records = [];

  for (let r = dataStartIdx; r < validRows.length; r++) {
    const row = validRows[r] || [];
    const rowObj = { id: `row_${r + 1}` };
    
    let rowHasData = false;
    for (let c = 0; c < maxCols; c++) {
      const colName = columns[c];
      const val = row[c] !== undefined && row[c] !== null ? String(row[c]).trim() : '';
      rowObj[colName] = val;
      if (val) rowHasData = true;
    }

    if (rowHasData) {
      const colKeys = Object.keys(rowObj).filter(k => k !== 'id');
      
      // Auto-detect standard fields if available
      const nameKey = colKeys.find(k => /^(?:name|person|business|hospital|doctor|student|full name)$/i.test(k)) ||
                      colKeys.find(k => /name/i.test(k)) ||
                      colKeys[0];
      const phoneKey = colKeys.find(k => /phone|mobile|contact|cell|tel|mob/i.test(k));
      const addrKey = colKeys.find(k => /address|location|street|city|district/i.test(k));

      const nameVal = nameKey ? rowObj[nameKey] : '';
      const phoneVal = phoneKey ? cleanPhoneNumber(rowObj[phoneKey]) : '';

      let recName = nameVal || 'Unnamed';
      let recPhone = phoneVal;

      // If phone is empty, check if any column value is a phone number
      if (!recPhone) {
        for (const k of colKeys) {
          if (k !== nameKey && rowObj[k] && isPhoneNumber(rowObj[k])) {
            recPhone = cleanPhoneNumber(rowObj[k]);
            break;
          }
        }
      }

      const addrParts = [];
      for (const k of colKeys) {
        if (k !== nameKey && rowObj[k]) {
          const val = String(rowObj[k]).trim();
          if (recPhone && cleanPhoneNumber(val) === recPhone) {
            continue;
          }
          addrParts.push(rowObj[k]);
        }
      }

      let recAddress = cleanAddress(addrParts);

      // If phone is STILL missing, check if embedded in address or name
      if (!recPhone) {
        const extractedFromAddr = extractPhoneFromText(recAddress);
        if (extractedFromAddr.phone) {
          recPhone = extractedFromAddr.phone;
          recAddress = extractedFromAddr.remainingText;
        }
      }

      // Check if phone was placed in Name column
      if (!recPhone && recName) {
        const extractedFromName = extractPhoneFromText(recName);
        if (extractedFromName.phone) {
          recPhone = extractedFromName.phone;
          recName = extractedFromName.remainingText;
        }
      }

      const recRawBlock = colKeys.map(k => `${k}: ${rowObj[k]}`).filter(Boolean).join('\n');

      rowObj.name = recName;
      rowObj.phone = recPhone;
      rowObj.address = recAddress;
      rowObj.rawBlock = recRawBlock;

      tableData.push(rowObj);

      records.push({
        id: `rec_${tableData.length}`,
        name: recName,
        phone: recPhone,
        address: recAddress,
        rawBlock: recRawBlock,
        ...rowObj
      });
    }
  }

  return { columns, tableData, records };
}

/**
 * Universal Master Parser for Excel/CSV data.
 * Automatically recognizes:
 * 1. Multi-column Tabular Spreadsheets (with any columns: Name, CGPA, Contact No., District, etc.)
 * 2. Row-Record Column Format (C1 = Name, C2 = Address, C3 = Number)
 * 3. Multi-row Block Format
 * 4. Multi-sheet workbooks
 */
export async function parseExcelData(fileOrBuffer) {
  let workbook;
  
  if (fileOrBuffer instanceof ArrayBuffer || fileOrBuffer instanceof Uint8Array) {
    workbook = XLSX.read(fileOrBuffer, { type: 'array', cellDates: true, cellText: false });
  } else if (fileOrBuffer instanceof File) {
    const buffer = await fileOrBuffer.arrayBuffer();
    workbook = XLSX.read(buffer, { type: 'array', cellDates: true, cellText: false });
  } else {
    throw new Error('Unsupported file input type');
  }

  let allRawRecords = [];
  let allTableData = [];
  let allColumns = [];
  const sheetNames = workbook.SheetNames || [];

  // Parse sheets
  for (const sheetName of sheetNames) {
    const worksheet = workbook.Sheets[sheetName];
    if (!worksheet) continue;

    const sheetData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '', blankrows: true, raw: false });
    if (!sheetData || sheetData.length === 0) continue;

    // 1. Tabular column extraction
    const { columns, tableData, records } = extractTabularColumnsAndRows(sheetData);

    if (columns.length > 0 && tableData.length > 0) {
      if (allColumns.length === 0) {
        allColumns = columns;
      }
      allTableData = allTableData.concat(tableData);
      allRawRecords = allRawRecords.concat(records);
    } else {
      // 2. Secondary Strategy: If 1 column with stacked blocks, parse block layout
      let blockRecords = parseBlockLayout(sheetData);
      if (blockRecords.length > 0) {
        allRawRecords = allRawRecords.concat(blockRecords);
        if (allColumns.length === 0) {
          allColumns = ['Name', 'Address', 'Phone Number'];
        }
        blockRecords.forEach(r => {
          allTableData.push({
            id: r.id,
            Name: r.name,
            Address: r.address,
            'Phone Number': r.phone,
            ...r
          });
        });
      }
    }
  }

  const { unique, duplicatesCount } = deduplicateRecords(allRawRecords);

  return {
    sheetNames,
    activeSheet: sheetNames.join(', '),
    columns: allColumns.length > 0 ? allColumns : ['Name', 'Address', 'Phone Number'],
    tableData: allTableData,
    records: unique.length > 0 ? unique : allRawRecords,
    stats: {
      totalRaw: allTableData.length > 0 ? allTableData.length : allRawRecords.length,
      duplicatesRemoved: duplicatesCount,
      formattedCount: allTableData.length > 0 ? allTableData.length : unique.length,
      totalColumns: allColumns.length
    }
  };
}

/**
 * Parses raw pasted text string.
 */
export function parseRawTextData(text) {
  if (!text || !text.trim()) {
    return {
      columns: [],
      tableData: [],
      records: [],
      stats: { totalRaw: 0, duplicatesRemoved: 0, formattedCount: 0, totalColumns: 0 }
    };
  }

  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

  // Check if pasted text is tab-delimited / CSV (e.g. pasted from Excel table)
  const isTabDelimited = lines.some(l => l.includes('\t') || l.includes(','));
  let allColumns = [];
  let allTableData = [];
  let rawRecords = [];

  if (isTabDelimited) {
    const tableMatrix = lines.map(l => (l.includes('\t') ? l.split('\t') : l.split(',')));
    const { columns, tableData, records } = extractTabularColumnsAndRows(tableMatrix);
    if (columns.length > 0 && tableData.length > 0) {
      allColumns = columns;
      allTableData = tableData;
      rawRecords = records;
    }
  }

  if (rawRecords.length === 0) {
    const sheetData = lines.map(l => [l]);
    rawRecords = parseBlockLayout(sheetData);
    allColumns = ['Name', 'Address', 'Phone Number'];
    allTableData = rawRecords.map(r => ({
      id: r.id,
      Name: r.name,
      Address: r.address,
      'Phone Number': r.phone,
      ...r
    }));
  }

  const { unique, duplicatesCount } = deduplicateRecords(rawRecords);

  return {
    sheetNames: ['Pasted Data'],
    activeSheet: 'Pasted Data',
    columns: allColumns,
    tableData: allTableData,
    records: unique.length > 0 ? unique : rawRecords,
    stats: {
      totalRaw: allTableData.length > 0 ? allTableData.length : rawRecords.length,
      duplicatesRemoved: duplicatesCount,
      formattedCount: allTableData.length > 0 ? allTableData.length : unique.length,
      totalColumns: allColumns.length
    }
  };
}
