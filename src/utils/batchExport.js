import JSZip from 'jszip';
import { generateDirectoryExcel, generateStructuredExcel, exportCSV } from './excelGenerator.js';
import { generateDirectoryPDF, generateStructuredPDF } from './pdfGenerator.js';
import { exportDuplicatesCSV } from './duplicateUtils.js';

/**
 * Downloads a single file from the batch list in the requested format.
 */
export async function downloadBatchItem(fileItem, format = 'excel', options = {}) {
  if (!fileItem || !fileItem.rawDataset || fileItem.rawDataset.length === 0) {
    throw new Error(`File ${fileItem.fileName || 'selected'} has no records to export.`);
  }

  const activeRecords = fileItem.removeDuplicates
    ? (fileItem.duplicateAnalysis?.uniqueRecords || fileItem.rawDataset)
    : (fileItem.duplicateAnalysis?.rawRecords || fileItem.rawDataset);

  const baseName = (fileItem.fileName || 'Directory').replace(/\.[^/.]+$/, '');
  const fileOptions = {
    ...options,
    uploadedFileName: `${baseName}_Formatted`,
    selectedColumns: fileItem.selectedColumns || [],
  };

  switch (format) {
    case 'excel_directory':
      return await generateDirectoryExcel(activeRecords, fileOptions);
    case 'excel_structured':
      return await generateStructuredExcel(activeRecords, fileOptions);
    case 'pdf_directory':
      return await generateDirectoryPDF(activeRecords, fileOptions);
    case 'pdf_structured':
      return await generateStructuredPDF(activeRecords, fileOptions);
    case 'csv':
      return exportCSV(activeRecords, fileOptions);
    case 'duplicates_csv':
      if (fileItem.duplicateAnalysis) {
        return exportDuplicatesCSV(fileItem.duplicateAnalysis, baseName);
      }
      break;
    default:
      return await generateDirectoryExcel(activeRecords, fileOptions);
  }
}

/**
 * Exports all processed files into a single ZIP archive.
 */
export async function exportBatchAsZip(filesList = [], options = {}, format = 'all') {
  const readyFiles = filesList.filter(f => f.status === 'ready' && f.rawDataset && f.rawDataset.length > 0);
  
  if (readyFiles.length === 0) {
    throw new Error('No successfully processed files available to export in the batch.');
  }

  const zip = new JSZip();
  const summaryRows = [
    ['File Name', 'Status', 'Total Raw Records', 'Duplicates Found', 'Duplicates Removed', 'Active Output Records', 'Selected Columns']
  ];

  for (let idx = 0; idx < readyFiles.length; idx++) {
    const fileItem = readyFiles[idx];
    const baseName = (fileItem.fileName || `File_${idx + 1}`).replace(/\.[^/.]+$/, '');
    
    const activeRecords = fileItem.removeDuplicates
      ? (fileItem.duplicateAnalysis?.uniqueRecords || fileItem.rawDataset)
      : (fileItem.duplicateAnalysis?.rawRecords || fileItem.rawDataset);

    const fileOptions = {
      ...options,
      uploadedFileName: `${baseName}_Formatted`,
      selectedColumns: fileItem.selectedColumns || [],
      returnBufferOnly: true,
      returnBlobOnly: true,
    };

    // 1. Directory Excel Output
    if (format === 'excel' || format === 'all') {
      try {
        const excelBuffer = await generateDirectoryExcel(activeRecords, fileOptions);
        zip.file(`${baseName}_Directory.xlsx`, excelBuffer);
      } catch (err) {
        console.error(`Error generating Excel for ${fileItem.fileName}:`, err);
      }
    }

    // 2. Directory PDF Output
    if (format === 'pdf' || format === 'all') {
      try {
        const pdfBlob = await generateDirectoryPDF(activeRecords, fileOptions);
        zip.file(`${baseName}_Directory.pdf`, pdfBlob);
      } catch (err) {
        console.error(`Error generating PDF for ${fileItem.fileName}:`, err);
      }
    }

    // 3. Duplicates Audit CSV (if duplicates exist)
    if (fileItem.duplicateAnalysis?.duplicateCount > 0) {
      const dupHeaders = ['Duplicate Row #', 'Original Row #', 'Match Reason', 'Matched Fields', 'Record Details'];
      const dupRows = fileItem.duplicateAnalysis.duplicateItems.map(item => [
        item.duplicateIndex,
        item.originalIndex,
        `"${(item.matchReason || '').replace(/"/g, '""')}"`,
        `"${(item.matchedFields || []).join('; ')}"`,
        `"${JSON.stringify(item.duplicateRecord || {}).replace(/"/g, '""')}"`
      ]);
      const dupCsv = [dupHeaders.join(','), ...dupRows.map(r => r.join(','))].join('\r\n');
      zip.file(`${baseName}_Duplicates_Audit.csv`, dupCsv);
    }

    // Record stats in summary sheet
    summaryRows.push([
      `"${fileItem.fileName}"`,
      'Ready',
      fileItem.duplicateAnalysis?.totalRaw || fileItem.rawDataset.length,
      fileItem.duplicateAnalysis?.duplicateCount || 0,
      fileItem.removeDuplicates ? (fileItem.duplicateAnalysis?.duplicateCount || 0) : 0,
      activeRecords.length,
      `"${(fileItem.selectedColumns || []).join(', ')}"`
    ]);
  }

  // Include overall Batch Summary Report
  const summaryCsv = summaryRows.map(r => r.join(',')).join('\r\n');
  zip.file('00_Batch_Summary_Report.csv', summaryCsv);

  const zipBlob = await zip.generateAsync({ type: 'blob' });
  const timestamp = new Date().toISOString().slice(0, 10);
  const zipFilename = `Processed_Batch_Files_${timestamp}.zip`;

  const url = URL.createObjectURL(zipBlob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = zipFilename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  setTimeout(() => URL.revokeObjectURL(url), 1500);

  return { success: true, filename: zipFilename, totalFiles: readyFiles.length };
}
