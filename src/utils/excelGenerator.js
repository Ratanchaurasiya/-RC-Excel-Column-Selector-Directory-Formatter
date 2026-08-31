import ExcelJS from 'exceljs';
import { hexToArgb } from './colorUtils.js';

/**
 * Maps standard page sizes to Excel paperSize IDs.
 */
function getExcelPaperSizeId(pageSize = 'A4') {
  const map = {
    'letter': 1,
    'legal': 5,
    'a3': 8,
    'a4': 9,
  };
  return map[String(pageSize).toLowerCase()] || 9;
}

/**
 * Automatically calculates optimum column width based on column count and page size.
 * No spacer columns - all columns are contiguous (Col A, B, C, D, E).
 */
export function getColumnWidthMetrics(columnsCount = 2, pageSize = 'A4') {
  const count = Number(columnsCount) || 2;
  const isA3 = String(pageSize).toLowerCase() === 'a3';

  if (isA3) {
    switch (count) {
      case 1: return { colWidth: 120, fontScale: 1.15 };
      case 2: return { colWidth: 64, fontScale: 1.05 };
      case 3: return { colWidth: 42, fontScale: 1.0 };
      case 4: return { colWidth: 32, fontScale: 0.95 };
      case 5: return { colWidth: 26, fontScale: 0.9 };
      default: return { colWidth: 42, fontScale: 1.0 };
    }
  }

  // A4 Standard
  switch (count) {
    case 1: return { colWidth: 88, fontScale: 1.1 };
    case 2: return { colWidth: 48, fontScale: 1.0 };
    case 3: return { colWidth: 32, fontScale: 0.92 };
    case 4: return { colWidth: 24, fontScale: 0.85 };
    case 5: return { colWidth: 19.5, fontScale: 0.8 };
    default: return { colWidth: 48, fontScale: 1.0 };
  }
}

/**
 * Downloads a blob file in the browser natively.
 */
function downloadBlob(blob, filename) {
  if (typeof window === 'undefined') return;
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  setTimeout(() => window.URL.revokeObjectURL(url), 1000);
}

/**
 * Builds rich text object for an Excel cell representing a business directory record with custom font colors.
 */
function createDirectoryRichText(record, options = {}) {
  const fontName = options.fontFamily || 'Calibri';
  const showPhoneLabel = options.showPhoneLabel ?? false;
  const fontScale = options.fontScale || 1.0;
  const selectedColumns = options.selectedColumns;
  const colWidth = options.colWidth || 38;

  const nameColorArgb = hexToArgb(options.nameColor || '#0F172A', 'FF0F172A');
  const addrColorArgb = hexToArgb(options.addressColor || '#334155', 'FF334155');
  const phoneColorArgb = hexToArgb(options.phoneColor || '#0F172A', 'FF0F172A');

  const parts = [];

  // Left-aligned "To," header
  const isCentered = options.textAlign !== 'left';
  const padSpaces = isCentered ? ' '.repeat(Math.max(45, Math.round(colWidth * 1.6))) : '';

  parts.push({
    text: `To,${padSpaces}\n`,
    font: {
      name: fontName,
      bold: true,
      size: Math.max(8.5, Math.round(11 * fontScale * 10) / 10),
      color: { argb: nameColorArgb },
    },
  });

  if (selectedColumns && selectedColumns.length > 0) {
    // Extract values ONLY for selected columns
    const selectedEntries = [];
    selectedColumns.forEach((colName) => {
      const val = record[colName] !== undefined && record[colName] !== null
        ? String(record[colName]).trim()
        : (record[colName.toLowerCase()] !== undefined && record[colName.toLowerCase()] !== null ? String(record[colName.toLowerCase()]).trim() : '');
      if (val) {
        selectedEntries.push({ colName, val });
      }
    });

    selectedEntries.forEach((entry, idx) => {
      const isFirst = idx === 0;
      const isLast = idx === selectedEntries.length - 1;
      const isPhoneLike = /phone|contact|mobile|cell|tel|number/i.test(entry.colName);
      const isCgpaOrScore = /cgpa|score|grade|percent|rate/i.test(entry.colName);

      let textVal = entry.val;
      if (isPhoneLike && showPhoneLabel) {
        textVal = `Ph: ${textVal}`;
      }

      const hasNext = idx < selectedEntries.length - 1;
      const fullText = hasNext ? `${textVal}\n` : textVal;

      let colorArgb = addrColorArgb;
      if (options[`color_${entry.colName}`]) {
        colorArgb = hexToArgb(options[`color_${entry.colName}`]);
      } else if (isFirst) {
        colorArgb = nameColorArgb;
      } else if (isLast && (isPhoneLike || isCgpaOrScore || selectedEntries.length >= 2)) {
        colorArgb = phoneColorArgb;
      }

      if (isFirst) {
        // First field (e.g. Name): Bold, Primary Name Color
        parts.push({
          text: fullText,
          font: {
            name: fontName,
            bold: true,
            size: Math.max(8.5, Math.round(11 * fontScale * 10) / 10),
            color: { argb: colorArgb },
          },
        });
      } else if (isLast && (isPhoneLike || isCgpaOrScore || selectedEntries.length >= 2)) {
        // Last field (e.g. Phone, CGPA, or Accent field): Bold, Phone Color
        parts.push({
          text: fullText,
          font: {
            name: fontName,
            bold: true,
            size: Math.max(8, Math.round(10 * fontScale * 10) / 10),
            color: { argb: colorArgb },
          },
        });
      } else {
        // Middle fields (e.g. Address, District, Email): Regular, Address Color
        parts.push({
          text: fullText,
          font: {
            name: fontName,
            bold: false,
            size: Math.max(7.5, Math.round(9.5 * fontScale * 10) / 10),
            color: { argb: colorArgb },
          },
        });
      }
    });
  } else {
    // Default fallback (Name, Address, Phone)
    if (record.name || record.Name) {
      const nameVal = record.name || record.Name;
      parts.push({
        text: `${nameVal}\n`,
        font: {
          name: fontName,
          bold: true,
          size: Math.max(8.5, Math.round(11 * fontScale * 10) / 10),
          color: { argb: nameColorArgb },
        },
      });
    }
    if (record.address || record.Address) {
      const addrVal = record.address || record.Address;
      parts.push({
        text: `${addrVal}\n`,
        font: {
          name: fontName,
          size: Math.max(7.5, Math.round(9.5 * fontScale * 10) / 10),
          color: { argb: addrColorArgb },
        },
      });
    }
    if (record.phone || record['Contact No.'] || record['Phone Number']) {
      const phoneVal = record.phone || record['Contact No.'] || record['Phone Number'];
      const phoneText = showPhoneLabel ? `Ph: ${phoneVal}` : phoneVal;
      parts.push({
        text: phoneText,
        font: {
          name: fontName,
          bold: true,
          size: Math.max(8, Math.round(10 * fontScale * 10) / 10),
          color: { argb: phoneColorArgb },
        },
      });
    }
  }

  return { richText: parts };
}

/**
 * Generates and downloads the professional N-column directory Excel workbook (1, 2, 3, 4, or 5 columns).
 * ZERO EMPTY ROWS AND ZERO EMPTY COLUMNS with customizable font colors & borders.
 */
export async function generateDirectoryExcel(records, options = {}) {
  if (!records || records.length === 0) {
    throw new Error('No records available to generate Excel file.');
  }

  const {
    sheetTitle = 'Business Directory',
    includeBorders = true,
    fontFamily = 'Calibri',
    showPhoneLabel = false,
    pageSize = 'A4',
    orientation = 'portrait',
    columnsCount = 2,
    showTitleBanner = false,
    borderColor = '#94A3B8',
    selectedColumns = [],
  } = options;

  const colCount = Number(columnsCount) || 2;
  const { colWidth, fontScale } = getColumnWidthMetrics(colCount, pageSize);

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Excel Directory Formatter';
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet(`${colCount}-Column Directory`, {
    pageSetup: {
      paperSize: getExcelPaperSizeId(pageSize),
      orientation: orientation.toLowerCase(),
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      margins: {
        left: 0.35,
        right: 0.35,
        top: 0.45,
        bottom: 0.45,
        header: 0.2,
        footer: 0.2,
      },
    },
    views: [
      { showGridLines: true }
    ]
  });

  // Pure Contiguous Columns (Col A, Col B, Col C... NO EMPTY SPACER COLUMNS)
  const cols = [];
  for (let c = 0; c < colCount; c++) {
    cols.push({ key: `entry_${c}`, width: colWidth });
  }
  worksheet.columns = cols;

  let currentRow = 1;

  // Title Banner
  if (showTitleBanner) {
    const lastColLetter = String.fromCharCode(64 + colCount);
    worksheet.mergeCells(`A1:${lastColLetter}1`);
    const headerCell = worksheet.getCell('A1');
    headerCell.value = sheetTitle.toUpperCase();
    headerCell.font = {
      name: fontFamily,
      size: 13,
      bold: true,
      color: { argb: 'FFFFFFFF' },
    };
    headerCell.alignment = { horizontal: 'center', vertical: 'middle' };
    headerCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E293B' },
    };
    worksheet.getRow(1).height = 30;
    currentRow = 2;
  }

  // Box Border Style between every entry with custom border color
  const borderColorArgb = hexToArgb(borderColor, 'FF334155');
  const cardBorder = includeBorders ? {
    top: { style: 'medium', color: { argb: borderColorArgb } },
    left: { style: 'medium', color: { argb: borderColorArgb } },
    bottom: { style: 'medium', color: { argb: borderColorArgb } },
    right: { style: 'medium', color: { argb: borderColorArgb } },
  } : undefined;

  const cardFill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFFFFFFF' }
  };

  // Iterate over records in chunks of colCount (1, 2, 3, 4, or 5)
  for (let i = 0; i < records.length; i += colCount) {
    const rowRecs = [];
    for (let c = 0; c < colCount; c++) {
      rowRecs.push(records[i + c] || null);
    }

    const row = worksheet.getRow(currentRow);
    
    // Dynamic row height calculation based on column width and address/field lengths
    const heights = rowRecs.map(rec => {
      if (!rec) return 0;
      let totalLines = 1; // +1 line for "To," above the name
      if (selectedColumns && selectedColumns.length > 0) {
        selectedColumns.forEach(col => {
          const val = String(rec[col] ?? rec[col.toLowerCase()] ?? '');
          if (val) {
            const lines = Math.ceil(val.length / (colWidth * 0.9)) || 1;
            totalLines += lines;
          }
        });
      } else {
        const nameLines = Math.ceil((rec.name?.length || 0) / (colWidth * 0.85)) || 1;
        const addrLines = Math.ceil((rec.address?.length || 0) / (colWidth * 0.95)) || 1;
        const phoneLines = rec.phone ? 1 : 0;
        totalLines += nameLines + addrLines + phoneLines;
      }
      return (totalLines * 15) + 14;
    });

    const calculatedHeight = Math.max(45, ...heights);
    row.height = Math.min(calculatedHeight, 180);

    // Fill ALL contiguous columns with borders (even empty trailing cells get borders)
    for (let c = 0; c < colCount; c++) {
      const rec = rowRecs[c];
      const cell = row.getCell(c + 1);

      // Always apply border and fill to EVERY cell in the grid
      if (cardBorder) cell.border = cardBorder;
      cell.fill = cardFill;

      if (rec) {
        cell.value = createDirectoryRichText(rec, { ...options, fontScale, colWidth });
        const align = options.textAlign || 'center';
        cell.alignment = { wrapText: true, vertical: 'top', horizontal: align, indent: align === 'left' ? 1 : 0 };
      }
    }

    currentRow++;
  }


  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const baseName = options.uploadedFileName || 'Directory';
  const filename = `${baseName}.xlsx`;
  
  downloadBlob(blob, filename);
  return { success: true, filename, totalRecords: records.length };
}

/**
 * Calculates dynamic column width based on content.
 */
function calculateOptimumColumnWidth(header, rows, key) {
  let maxLen = (header || '').length;
  for (const r of rows.slice(0, 100)) {
    const valStr = String(r[key] ?? '');
    if (valStr.length > maxLen) {
      maxLen = valStr.length;
    }
  }
  return Math.min(Math.max(maxLen + 4, 12), 65);
}

/**
 * Generates and downloads an Excel workbook containing ONLY the selected columns.
 * (e.g., if Name and CGPA are selected, only Name and CGPA appear in the sheet).
 */
export async function generateSelectedColumnsExcel(records, options = {}) {
  if (!records || records.length === 0) {
    throw new Error('No records available to generate Excel file.');
  }

  const {
    selectedColumns = [],
    sheetTitle = 'Extracted Data',
    fontFamily = 'Calibri',
    pageSize = 'A4',
    orientation = 'portrait',
    borderColor = '#E2E8F0',
    headerBgColor = 'FF065F46', // Deep Emerald
  } = options;

  // Determine active columns
  let activeCols = selectedColumns && selectedColumns.length > 0 ? selectedColumns : [];
  if (activeCols.length === 0) {
    // If no columns specified, inspect first record keys
    const firstRec = records[0] || {};
    activeCols = Object.keys(firstRec).filter(k => !['id', 'rawBlock', 'name', 'address', 'phone'].includes(k));
    if (activeCols.length === 0) {
      activeCols = ['Name', 'Address', 'Phone Number'];
    }
  }

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Excel Column Extractor';
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet('Selected Data', {
    views: [{ state: 'frozen', ySplit: 1, showGridLines: true }],
    pageSetup: {
      paperSize: getExcelPaperSizeId(pageSize),
      orientation: orientation.toLowerCase(),
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
    }
  });

  // Setup ONLY the selected columns
  worksheet.columns = activeCols.map(colName => ({
    header: colName,
    key: colName,
    width: calculateOptimumColumnWidth(colName, records, colName)
  }));

  // Style Header Row
  const headerRow = worksheet.getRow(1);
  headerRow.height = 28;
  headerRow.eachCell((cell) => {
    cell.font = {
      name: fontFamily,
      size: 11,
      bold: true,
      color: { argb: 'FFFFFFFF' }
    };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: headerBgColor }
    };
    cell.alignment = {
      vertical: 'middle',
      horizontal: 'left',
      indent: 1
    };
  });

  // Add auto-filter across selected columns
  if (activeCols.length > 0) {
    const lastColLetter = String.fromCharCode(64 + Math.min(activeCols.length, 26));
    worksheet.autoFilter = `A1:${lastColLetter}1`;
  }

  const borderColorArgb = hexToArgb(borderColor, 'FFE2E8F0');

  // Insert data rows with ONLY selected columns
  records.forEach((record, index) => {
    const rowData = {};
    activeCols.forEach(col => {
      rowData[col] = record[col] !== undefined && record[col] !== null ? record[col] : '';
    });

    const row = worksheet.addRow(rowData);
    const isEven = index % 2 === 1;
    const rowBgColor = isEven ? 'FFF8FAFC' : 'FFFFFFFF';
    row.height = 24;

    row.eachCell((cell, colNumber) => {
      const colName = activeCols[colNumber - 1];
      const isNumeric = typeof cell.value === 'number' || (!isNaN(Number(cell.value)) && cell.value !== '' && !/phone|contact|mobile|pin|code|id/i.test(colName));

      cell.font = {
        name: fontFamily,
        size: 10,
        color: { argb: 'FF0F172A' }
      };

      // Preserve phone numbers and text codes as string format
      if (/phone|contact|mobile|tel|cell|code|id/i.test(colName)) {
        cell.numFmt = '@';
      }

      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: rowBgColor }
      };

      cell.alignment = {
        vertical: 'middle',
        horizontal: isNumeric ? 'right' : 'left',
        indent: 1
      };

      cell.border = {
        top: { style: 'thin', color: { argb: borderColorArgb } },
        bottom: { style: 'thin', color: { argb: borderColorArgb } },
        left: { style: 'thin', color: { argb: borderColorArgb } },
        right: { style: 'thin', color: { argb: borderColorArgb } },
      };
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const baseName = options.uploadedFileName || 'Extracted_Columns';
  const filename = `${baseName}_selected_columns.xlsx`;
  
  downloadBlob(blob, filename);
  return { success: true, filename, totalRecords: records.length, selectedColumns: activeCols };
}

/**
 * Generates and downloads a structured Excel workbook with support for custom selected columns.
 */
export async function generateStructuredExcel(records, options = {}) {
  if (options.selectedColumns && options.selectedColumns.length > 0) {
    return await generateSelectedColumnsExcel(records, options);
  }

  if (!records || records.length === 0) {
    throw new Error('No records available to generate Excel file.');
  }

  const {
    sheetTitle = 'Structured Directory Data',
    fontFamily = 'Calibri',
    pageSize = 'A4',
    orientation = 'landscape',
    nameColor = '#0F172A',
    addressColor = '#334155',
    phoneColor = '#0369A1',
    borderColor = '#E2E8F0',
  } = options;

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Excel Directory Formatter';
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet('Structured Data', {
    views: [
      { state: 'frozen', ySplit: 1, showGridLines: true }
    ],
    pageSetup: {
      paperSize: getExcelPaperSizeId(pageSize),
      orientation: orientation.toLowerCase(),
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
    }
  });

  worksheet.columns = [
    { header: 'Sr No', key: 'srNo', width: 10 },
    { header: 'Business / Hospital Name', key: 'name', width: 40 },
    { header: 'Address', key: 'address', width: 70 },
    { header: 'Phone Number', key: 'phone', width: 24 },
  ];

  const headerRow = worksheet.getRow(1);
  headerRow.height = 28;
  headerRow.eachCell((cell, colNumber) => {
    cell.font = {
      name: fontFamily,
      size: 11,
      bold: true,
      color: { argb: 'FFFFFFFF' }
    };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF065F46' }
    };
    cell.alignment = {
      vertical: 'middle',
      horizontal: colNumber === 1 ? 'center' : 'left',
      indent: colNumber === 1 ? 0 : 1
    };
  });

  worksheet.autoFilter = 'A1:D1';

  const nameColorArgb = hexToArgb(nameColor, 'FF0F172A');
  const addrColorArgb = hexToArgb(addressColor, 'FF334155');
  const phoneColorArgb = hexToArgb(phoneColor, 'FF0369A1');
  const borderColorArgb = hexToArgb(borderColor, 'FFE2E8F0');

  records.forEach((record, index) => {
    const row = worksheet.addRow({
      srNo: index + 1,
      name: record.Name || record.name || '',
      address: record.Address || record.address || '',
      phone: record['Contact No.'] || record['Phone Number'] || record.phone || ''
    });

    const isEven = index % 2 === 1;
    const rowBgColor = isEven ? 'FFF8FAFC' : 'FFFFFFFF';
    const addrLen = (record.Address || record.address || '').length;
    row.height = addrLen > 100 ? 44 : addrLen > 50 ? 30 : 24;

    row.eachCell((cell, colNumber) => {
      let cellColor = { argb: 'FF0F172A' };
      if (colNumber === 2) cellColor = { argb: nameColorArgb };
      else if (colNumber === 3) cellColor = { argb: addrColorArgb };
      else if (colNumber === 4) cellColor = { argb: phoneColorArgb };

      cell.font = {
        name: fontFamily,
        size: 10,
        bold: colNumber === 2 || colNumber === 4,
        color: cellColor
      };

      if (colNumber === 4) {
        cell.numFmt = '@';
      }

      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: rowBgColor }
      };

      cell.alignment = {
        vertical: 'top',
        horizontal: colNumber === 1 ? 'center' : 'left',
        wrapText: colNumber === 3 || colNumber === 2,
        indent: colNumber === 1 ? 0 : 1
      };

      cell.border = {
        top: { style: 'thin', color: { argb: borderColorArgb } },
        bottom: { style: 'thin', color: { argb: borderColorArgb } },
        left: { style: 'thin', color: { argb: borderColorArgb } },
        right: { style: 'thin', color: { argb: borderColorArgb } },
      };
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const baseName = options.uploadedFileName || 'Structured_Table';
  const filename = `${baseName}.xlsx`;
  
  downloadBlob(blob, filename);
  return { success: true, filename, totalRecords: records.length };
}

/**
 * Generates a COMBINED Multi-Sheet Excel workbook with contiguous columns and consecutive rows.
 */
export async function generateCombinedExcel(records, options = {}) {
  if (!records || records.length === 0) {
    throw new Error('No records available to generate Excel file.');
  }

  const {
    sheetTitle = 'Business Directory',
    fontFamily = 'Calibri',
    pageSize = 'A4',
    columnsCount = 2,
    borderColor = '#94A3B8',
  } = options;

  const colCount = Number(columnsCount) || 2;
  const { colWidth, fontScale } = getColumnWidthMetrics(colCount, pageSize);

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Excel Directory Formatter';
  workbook.created = new Date();

  // 1. Structured Data Sheet
  const wsStructured = workbook.addWorksheet('Structured Data');
  wsStructured.columns = [
    { header: 'Sr No', key: 'srNo', width: 10 },
    { header: 'Business / Hospital Name', key: 'name', width: 40 },
    { header: 'Address', key: 'address', width: 70 },
    { header: 'Phone Number', key: 'phone', width: 24 },
  ];

  const headerRow = wsStructured.getRow(1);
  headerRow.height = 28;
  headerRow.eachCell((cell, colNumber) => {
    cell.font = { name: fontFamily, size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF065F46' } };
    cell.alignment = { vertical: 'middle', horizontal: colNumber === 1 ? 'center' : 'left', indent: colNumber === 1 ? 0 : 1 };
  });
  wsStructured.autoFilter = 'A1:D1';

  records.forEach((record, index) => {
    const row = wsStructured.addRow({
      srNo: index + 1,
      name: record.name || '',
      address: record.address || '',
      phone: record.phone || ''
    });

    const isEven = index % 2 === 1;
    row.eachCell((cell, colNumber) => {
      cell.font = { name: fontFamily, size: 10, bold: colNumber === 2 || colNumber === 4 };
      if (colNumber === 4) cell.numFmt = '@';
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: isEven ? 'FFF8FAFC' : 'FFFFFFFF' } };
      cell.alignment = { vertical: 'top', horizontal: colNumber === 1 ? 'center' : 'left', wrapText: true, indent: colNumber === 1 ? 0 : 1 };
    });
  });

  // 2. Directory Sheet (Pure Contiguous Columns: Col A, B, C, D, E)
  const wsDirectory = workbook.addWorksheet(`${colCount}-Column Directory`);
  const cols = [];
  for (let c = 0; c < colCount; c++) {
    cols.push({ key: `entry_${c}`, width: colWidth });
  }
  wsDirectory.columns = cols;

  const borderColorArgb = hexToArgb(borderColor, 'FF334155');
  const cardBorder = {
    top: { style: 'medium', color: { argb: borderColorArgb } },
    left: { style: 'medium', color: { argb: borderColorArgb } },
    bottom: { style: 'medium', color: { argb: borderColorArgb } },
    right: { style: 'medium', color: { argb: borderColorArgb } },
  };

  const cardFill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFFFFFFF' }
  };

  let currentRow = 1;
  for (let i = 0; i < records.length; i += colCount) {
    const row = wsDirectory.getRow(currentRow);
    row.height = 68;

    for (let c = 0; c < colCount; c++) {
      const rec = records[i + c];
      const cell = row.getCell(c + 1);

      // Always apply border and fill to EVERY cell
      cell.border = cardBorder;
      cell.fill = cardFill;

      if (rec) {
        cell.value = createDirectoryRichText(rec, { ...options, fontScale, colWidth });
        const align = options.textAlign || 'center';
        cell.alignment = { wrapText: true, vertical: 'top', horizontal: align, indent: align === 'left' ? 1 : 0 };
      }
    }

    currentRow++;
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const baseName = options.uploadedFileName || 'Complete_Directory';
  const filename = `${baseName}.xlsx`;
  
  downloadBlob(blob, filename);
  return { success: true, filename, totalRecords: records.length };
}

/**
 * Returns raw xlsx binary buffer for in-memory processing or tests.
 */
export async function generateDirectoryBuffer(records, options = {}) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Business Directory');
  
  worksheet.columns = [
    { key: 'col1', width: 38 },
    { key: 'col2', width: 38 },
    { key: 'col3', width: 38 },
  ];

  const cardBorder = {
    top: { style: 'medium', color: { argb: 'FF334155' } },
    left: { style: 'medium', color: { argb: 'FF334155' } },
    bottom: { style: 'medium', color: { argb: 'FF334155' } },
    right: { style: 'medium', color: { argb: 'FF334155' } },
  };

  let currentRow = 1;
  for (let i = 0; i < records.length; i += 3) {
    const row = worksheet.getRow(currentRow);
    row.height = 65;

    for (let c = 0; c < 3; c++) {
      const rec = records[i + c];
      const cell = row.getCell(c + 1);

      // Always apply borders to every cell
      cell.border = cardBorder;

      if (rec) {
        cell.value = createDirectoryRichText(rec, { ...options, colWidth: 38 });
        const align = options.textAlign || 'center';
        cell.alignment = { wrapText: true, vertical: 'top', horizontal: align };
      }
    }

    currentRow++;
  }

  return await workbook.xlsx.writeBuffer();
}

/**
 * Generates and downloads a clean CSV file with support for selected columns.
 */
export function exportCSV(records, options = {}) {
  if (!records || records.length === 0) return;

  const { selectedColumns = [] } = options;
  let activeCols = selectedColumns && selectedColumns.length > 0 ? selectedColumns : [];

  if (activeCols.length === 0) {
    const firstRec = records[0] || {};
    activeCols = Object.keys(firstRec).filter(k => !['id', 'rawBlock', 'name', 'address', 'phone'].includes(k));
    if (activeCols.length === 0) {
      activeCols = ['Name', 'Address', 'Phone Number'];
    }
  }

  const headers = activeCols.map(h => `"${String(h).replace(/"/g, '""')}"`);
  const rows = records.map((r) => {
    return activeCols.map(col => {
      const val = r[col] !== undefined && r[col] !== null ? String(r[col]) : '';
      return `"${val.replace(/"/g, '""')}"`;
    }).join(',');
  });

  const csvContent = [headers.join(','), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const baseName = options.uploadedFileName || 'Extracted_Columns';
  downloadBlob(blob, `${baseName}.csv`);
}

