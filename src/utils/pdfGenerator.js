import { jsPDF } from 'jspdf';
import { hexToRgb } from './colorUtils.js';
import { sanitizeText, isIndexColumn } from './parser.js';

/**
 * Generates a Multi-Column Directory PDF on A3, A4, etc. with custom font colors and box borders.
 */
export async function generateDirectoryPDF(records, options = {}) {
  if (!records || records.length === 0) {
    throw new Error('No records to generate PDF.');
  }

  const {
    pageSize = 'a4',
    orientation = 'portrait',
    columnsCount = 2,
    includeBorders = true,
    showSheetTitle = false,
    sheetTitle = 'Business Directory',
    fontFamily = 'helvetica',
    fontSizeName = 11,
    fontSizeAddress = 9,
    fontSizePhone = 9.5,
    marginMm = 12,
    nameColor = '#0F172A',
    addressColor = '#334155',
    phoneColor = '#0F172A',
    borderColor = '#94A3B8',
  } = options;

  const colCount = Number(columnsCount) || 2;
  const nameRgb = hexToRgb(nameColor);
  const addrRgb = hexToRgb(addressColor);
  const phoneRgb = hexToRgb(phoneColor);
  const borderRgb = hexToRgb(borderColor);

  const doc = new jsPDF({
    orientation,
    unit: 'mm',
    format: pageSize.toLowerCase(),
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const availableWidth = pageWidth - marginMm * 2;
  const colGap = 0; // Contiguous table grid (0 gap between columns)
  const colWidth = availableWidth / colCount;

  let currentY = marginMm;

  // Title Banner (if enabled)
  if (showSheetTitle && sheetTitle) {
    doc.setFillColor(30, 41, 59);
    doc.rect(marginMm, currentY, availableWidth, 10, 'F');
    doc.setFont(fontFamily, 'bold');
    doc.setFontSize(13);
    doc.setTextColor(255, 255, 255);
    doc.text(sheetTitle.toUpperCase(), pageWidth / 2, currentY + 7, { align: 'center' });
    currentY += 14;
  }

  const paddingInside = includeBorders ? (colCount >= 4 ? 2 : 2.5) : 1;
  const textWidth = colWidth - paddingInside * 2;
  const rowSpacing = 0; // Contiguous table grid (0 gap between rows)

  // Scale font sizes based on column count
  let adjNameSize = fontSizeName;
  let adjAddrSize = fontSizeAddress;
  let adjPhoneSize = fontSizePhone;

  if (colCount === 3) {
    adjNameSize = 10;
    adjAddrSize = 8.5;
    adjPhoneSize = 9;
  } else if (colCount === 4) {
    adjNameSize = 9;
    adjAddrSize = 7.5;
    adjPhoneSize = 8;
  } else if (colCount >= 5) {
    adjNameSize = 8;
    adjAddrSize = 6.8;
    adjPhoneSize = 7.2;
  }

  const selectedColumns = options.selectedColumns;

  // Iterate in chunks of colCount
  for (let i = 0; i < records.length; i += colCount) {
    const rowRecs = [];
    for (let c = 0; c < colCount; c++) {
      rowRecs.push(records[i + c] || null);
    }

    // Measure each entry in this row
    const rowItems = rowRecs.map((rec) => {
      if (!rec) return null;

      const fieldEntries = [];

      if (selectedColumns && selectedColumns.length > 0) {
        const activeCols = selectedColumns.length > 1 ? selectedColumns.filter(c => !isIndexColumn(c)) : selectedColumns;
        activeCols.forEach((colName) => {
          const rawVal = rec[colName] !== undefined && rec[colName] !== null
            ? String(rec[colName]).trim()
            : (rec[colName.toLowerCase()] !== undefined && rec[colName.toLowerCase()] !== null ? String(rec[colName.toLowerCase()]).trim() : '');
          const val = sanitizeText(rawVal);
          if (val) {
            fieldEntries.push({ colName, val });
          }
        });
      } else {
        if (rec.name) fieldEntries.push({ colName: 'Name', val: sanitizeText(rec.name) });
        if (rec.address) fieldEntries.push({ colName: 'Address', val: sanitizeText(rec.address) });
        if (rec.phone) fieldEntries.push({ colName: 'Phone', val: sanitizeText(rec.phone) });
      }

      let cardContentH = 0;
      const measuredFields = [];

      // Add "To," directly above every Name/Business Name on the LEFT
      doc.setFont(fontFamily, 'bold');
      doc.setFontSize(adjNameSize);
      const toLines = ['To,'];
      const toH = toLines.length * (adjNameSize * 0.40);
      cardContentH += toH + 0.8;
      measuredFields.push({
        lines: toLines,
        h: toH,
        size: adjNameSize,
        isBold: true,
        rgb: nameRgb,
        align: 'left',
      });

      fieldEntries.forEach((fe, idx) => {
        const isFirst = idx === 0;
        const isLast = idx === fieldEntries.length - 1;
        const isPhoneLike = /phone|contact|mobile|cell|tel|number/i.test(fe.colName);
        const isCgpaOrScore = /cgpa|score|grade|percent|rate/i.test(fe.colName);

        let size = adjAddrSize;
        let isBold = false;
        let rgb = addrRgb;

        if (options[`color_${fe.colName}`]) {
          rgb = hexToRgb(options[`color_${fe.colName}`]);
        } else if (isFirst) {
          rgb = nameRgb;
        } else if (isLast && (isPhoneLike || isCgpaOrScore || fieldEntries.length >= 2)) {
          rgb = phoneRgb;
        }

        if (isFirst) {
          size = adjNameSize;
          isBold = true;
        } else if (isLast && (isPhoneLike || isCgpaOrScore || fieldEntries.length >= 2)) {
          size = adjPhoneSize;
          isBold = true;
        }

        doc.setFont(fontFamily, isBold ? 'bold' : 'normal');
        doc.setFontSize(size);
        const lines = doc.splitTextToSize(fe.val, textWidth);
        const h = lines.length * (size * 0.40);
        cardContentH += h + 1.2;

        measuredFields.push({
          lines,
          h,
          size,
          isBold,
          rgb,
          align: options.textAlign === 'left' ? 'left' : 'center',
        });
      });

      const cardH = cardContentH + paddingInside * 2;

      return {
        rec,
        measuredFields,
        cardH,
      };
    });

    const maxCardHeight = Math.max(...rowItems.map(item => item ? item.cardH : 0), 20);

    // Page break check
    if (currentY + maxCardHeight > pageHeight - marginMm) {
      doc.addPage();
      currentY = marginMm;
    }

    // Draw all columns in this row
    for (let c = 0; c < colCount; c++) {
      const item = rowItems[c];
      const colX = marginMm + c * (colWidth + colGap);

      // Draw Box Border around every cell in the grid (matching Excel exactly)
      if (includeBorders) {
        doc.setDrawColor(borderRgb.r, borderRgb.g, borderRgb.b);
        doc.setLineWidth(0.4);
        doc.setFillColor(255, 255, 255);
        doc.rect(colX, currentY, colWidth, maxCardHeight, 'FD');
      }

      if (item) {
        let drawY = currentY + paddingInside;

        item.measuredFields.forEach((mf) => {
          doc.setFont(fontFamily, mf.isBold ? 'bold' : 'normal');
          doc.setFontSize(mf.size);
          doc.setTextColor(mf.rgb.r, mf.rgb.g, mf.rgb.b);
          const align = mf.align || (options.textAlign === 'left' ? 'left' : 'center');
          const drawX = align === 'left' ? colX + paddingInside : colX + colWidth / 2;
          doc.text(mf.lines, drawX, drawY + (mf.size * 0.35), { align });
          drawY += mf.h + 1.2;
        });
      }
    }

    currentY += maxCardHeight + rowSpacing;
  }


  const blob = doc.output('blob');
  if (options.returnBlobOnly) {
    return blob;
  }

  const baseName = options.uploadedFileName || 'Directory';
  const filename = `${baseName}.pdf`;
  
  if (typeof window !== 'undefined') {
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    setTimeout(() => {
      try { window.URL.revokeObjectURL(url); } catch (e) {}
    }, 60000);
  }
  return { success: true, filename };
}

/**
 * Generates Structured Tabular Data PDF with support for custom selected columns.
 */
export async function generateStructuredPDF(records, options = {}) {
  if (!records || records.length === 0) {
    throw new Error('No records to generate PDF.');
  }

  const {
    pageSize = 'a4',
    orientation = 'landscape',
    fontFamily = 'helvetica',
    sheetTitle = 'Extracted Tabular Data',
    selectedColumns = [],
  } = options;

  let activeCols = selectedColumns && selectedColumns.length > 0 ? selectedColumns : [];
  if (activeCols.length === 0) {
    const firstRec = records[0] || {};
    activeCols = Object.keys(firstRec).filter(k => !['id', 'rawBlock', 'name', 'address', 'phone'].includes(k));
    if (activeCols.length === 0) {
      activeCols = ['Name', 'Address', 'Phone Number'];
    }
  }

  const doc = new jsPDF({
    orientation,
    unit: 'mm',
    format: pageSize.toLowerCase(),
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginMm = 10;
  let currentY = marginMm + 6;

  doc.setFont(fontFamily, 'bold');
  doc.setFontSize(14);
  doc.setTextColor(6, 95, 70);
  doc.text(sheetTitle, marginMm, currentY);
  currentY += 8;

  const colSr = 14;
  const availableContentWidth = pageWidth - marginMm * 2 - colSr;
  const colWidth = availableContentWidth / activeCols.length;

  const drawTableHeader = (y) => {
    doc.setFillColor(6, 95, 70);
    doc.rect(marginMm, y, pageWidth - marginMm * 2, 8, 'F');
    doc.setFont(fontFamily, 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(255, 255, 255);

    let x = marginMm;
    doc.text('#', x + colSr / 2, y + 5.5, { align: 'center' });
    x += colSr;

    activeCols.forEach(col => {
      doc.text(col, x + 2, y + 5.5);
      x += colWidth;
    });
  };

  drawTableHeader(currentY);
  currentY += 8;

  for (let i = 0; i < records.length; i++) {
    const rec = records[i];

    // Measure line heights for all columns
    doc.setFont(fontFamily, 'normal');
    doc.setFontSize(8);

    const cellLinesList = activeCols.map(col => {
      const val = sanitizeText(String(rec[col] ?? ''));
      return doc.splitTextToSize(val, colWidth - 4);
    });

    const maxLines = Math.max(...cellLinesList.map(lines => lines.length), 1);
    const rowHeight = Math.max(maxLines * 4.2 + 3, 7.5);

    if (currentY + rowHeight > pageHeight - marginMm) {
      doc.addPage();
      currentY = marginMm;
      drawTableHeader(currentY);
      currentY += 8;
    }

    if (i % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(marginMm, currentY, pageWidth - marginMm * 2, rowHeight, 'F');
    }

    doc.setDrawColor(226, 232, 240);
    doc.rect(marginMm, currentY, pageWidth - marginMm * 2, rowHeight, 'S');

    let x = marginMm;
    doc.setFont(fontFamily, 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(String(i + 1), x + colSr / 2, currentY + 5, { align: 'center' });
    x += colSr;

    cellLinesList.forEach((lines, colIdx) => {
      doc.setFont(fontFamily, colIdx === 0 ? 'bold' : 'normal');
      doc.setTextColor(15, 23, 42);
      doc.text(lines, x + 2, currentY + 4.5);
      x += colWidth;
    });

    currentY += rowHeight;
  }

  const blob = doc.output('blob');
  if (options.returnBlobOnly) {
    return blob;
  }

  const baseName = options.uploadedFileName || 'Extracted_Data';
  const filename = `${baseName}_selected_columns.pdf`;
  if (typeof window !== 'undefined') {
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    setTimeout(() => {
      try { window.URL.revokeObjectURL(url); } catch (e) {}
    }, 60000);
  }
  return { success: true, filename };
}

