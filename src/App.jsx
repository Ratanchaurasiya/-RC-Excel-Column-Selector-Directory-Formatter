import React, { useState, useMemo } from 'react';
import Header from './components/Header';
import StatsOverview from './components/StatsOverview';
import BatchFileManager from './components/BatchFileManager';
import DuplicateManager from './components/DuplicateManager';
import FileUpload from './components/FileUpload';
import ColumnSelector from './components/ColumnSelector';
import SettingsBar from './components/SettingsBar';
import DirectoryPreview from './components/DirectoryPreview';
import RecordModal from './components/RecordModal';
import { parseExcelData, parseRawTextData } from './utils/parser';
import { analyzeDuplicates } from './utils/duplicateUtils';
import {
  generateDirectoryExcel,
  generateStructuredExcel,
  generateCombinedExcel,
  exportCSV,
} from './utils/excelGenerator';
import {
  generateDirectoryPDF,
  generateStructuredPDF,
} from './utils/pdfGenerator';
import {
  SAMPLE_RECORDS,
  STUDENT_SAMPLE_COLUMNS,
  STUDENT_SAMPLE_WITH_DUPLICATES,
} from './utils/sampleData';
import { Sparkles, Files, Archive } from 'lucide-react';

const createInitialFile = () => {
  const fileId = 'initial_student_file';
  const dupAnalysis = analyzeDuplicates(STUDENT_SAMPLE_WITH_DUPLICATES, STUDENT_SAMPLE_COLUMNS);
  return {
    id: fileId,
    fileName: 'Student_Data.xlsx',
    status: 'ready',
    rawDataset: STUDENT_SAMPLE_WITH_DUPLICATES,
    columns: STUDENT_SAMPLE_COLUMNS,
    selectedColumns: ['Name', 'CGPA'],
    removeDuplicates: true,
    duplicateAnalysis: dupAnalysis,
  };
};

export default function App() {
  const [filesList, setFilesList] = useState([createInitialFile()]);
  const [activeFileId, setActiveFileId] = useState('initial_student_file');
  const [globalRemoveDuplicates, setGlobalRemoveDuplicates] = useState(true);
  const [syncColumnsAcrossBatch, setSyncColumnsAcrossBatch] = useState(true);

  const [isProcessing, setIsProcessing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeModalRecord, setActiveModalRecord] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Active File object
  const activeFile = useMemo(() => {
    return filesList.find(f => f.id === activeFileId) || filesList[0] || null;
  }, [filesList, activeFileId]);

  // Derived state for currently active file
  const columns = activeFile?.columns || [];
  const selectedColumns = activeFile?.selectedColumns || activeFile?.columns || [];
  const rawDataset = activeFile?.rawDataset || [];
  const removeDuplicates = activeFile ? activeFile.removeDuplicates : true;
  const duplicateAnalysis = activeFile?.duplicateAnalysis || {
    rawRecords: [],
    uniqueRecords: [],
    duplicateItems: [],
    totalRaw: 0,
    duplicateCount: 0,
    uniqueCount: 0,
  };
  const uploadedFileName = activeFile ? activeFile.fileName.replace(/\.[^/.]+$/, '') : 'Dataset';

  // Active dataset for current file (deduplicated or raw depending on removeDuplicates)
  const activeDataSource = useMemo(() => {
    if (!activeFile) return [];
    return activeFile.removeDuplicates
      ? (activeFile.duplicateAnalysis?.uniqueRecords || activeFile.rawDataset || [])
      : (activeFile.duplicateAnalysis?.rawRecords || activeFile.rawDataset || []);
  }, [activeFile]);

  // Computed live stats for active file
  const computedStats = useMemo(() => {
    return {
      totalRaw: duplicateAnalysis.totalRaw,
      duplicatesRemoved: removeDuplicates ? duplicateAnalysis.duplicateCount : 0,
      duplicateCount: duplicateAnalysis.duplicateCount,
      formattedCount: activeDataSource.length,
      totalColumns: columns.length,
    };
  }, [duplicateAnalysis, removeDuplicates, activeDataSource.length, columns.length]);

  // Styling options
  const [options, setOptions] = useState({
    sheetTitle: 'Business Directory',
    fontFamily: 'Calibri',
    includeBorders: true,
    showPhoneLabel: false,
    pageSize: 'A4',
    orientation: 'portrait',
    columnsCount: 3,
    textAlign: 'center',
    showTitleBanner: false,
    nameColor: '#0F172A',
    addressColor: '#334155',
    phoneColor: '#0F172A',
    borderColor: '#334155',
  });

  // Handle single or multiple file upload (.xlsx, .xls, .csv)
  const handleFileUpload = async (files) => {
    const incomingFiles = Array.isArray(files) ? files : [files];
    if (incomingFiles.length === 0) return;

    setIsProcessing(true);
    const newFileEntries = [];

    for (let i = 0; i < incomingFiles.length; i++) {
      const file = incomingFiles[i];
      const fileId = `file_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
      
      try {
        const result = await parseExcelData(file);
        const incomingRaw = result.rawTableData || result.rawRecords || result.tableData || result.records || [];
        const detectedCols = result.columns || [];
        const dAnalysis = analyzeDuplicates(incomingRaw, detectedCols);

        newFileEntries.push({
          id: fileId,
          fileName: file.name,
          status: 'ready',
          rawDataset: incomingRaw,
          columns: detectedCols,
          selectedColumns: detectedCols,
          removeDuplicates: globalRemoveDuplicates,
          duplicateAnalysis: dAnalysis,
        });
      } catch (err) {
        console.error(`Error parsing file ${file.name}:`, err);
        newFileEntries.push({
          id: fileId,
          fileName: file.name,
          status: 'error',
          errorMessage: err.message || 'Parsing error',
          rawDataset: [],
          columns: [],
          selectedColumns: [],
          removeDuplicates: globalRemoveDuplicates,
          duplicateAnalysis: { rawRecords: [], uniqueRecords: [], duplicateItems: [], totalRaw: 0, duplicateCount: 0, uniqueCount: 0 },
        });
      }
    }

    if (newFileEntries.length > 0) {
      setFilesList(prev => {
        // If previous only contained the default sample, replace it; otherwise append
        const isDefaultOnly = prev.length === 1 && prev[0].id === 'initial_student_file';
        return isDefaultOnly ? newFileEntries : [...prev, ...newFileEntries];
      });

      // Focus on the first newly added successful file
      const firstReady = newFileEntries.find(f => f.status === 'ready') || newFileEntries[0];
      if (firstReady) {
        setActiveFileId(firstReady.id);
      }
    }

    setIsProcessing(false);
  };

  // Handle raw pasted text
  const handleTextParse = (text) => {
    setIsProcessing(true);
    try {
      const result = parseRawTextData(text);
      const incomingRaw = result.rawTableData || result.rawRecords || result.tableData || result.records || [];
      if (incomingRaw.length > 0) {
        const detectedCols = result.columns || [];
        const dAnalysis = analyzeDuplicates(incomingRaw, detectedCols);
        const fileId = `text_batch_${Date.now()}`;
        const newFileItem = {
          id: fileId,
          fileName: 'Pasted_Text_Data.xlsx',
          status: 'ready',
          rawDataset: incomingRaw,
          columns: detectedCols,
          selectedColumns: detectedCols,
          removeDuplicates: globalRemoveDuplicates,
          duplicateAnalysis: dAnalysis,
        };

        setFilesList(prev => {
          const isDefaultOnly = prev.length === 1 && prev[0].id === 'initial_student_file';
          return isDefaultOnly ? [newFileItem] : [...prev, newFileItem];
        });
        setActiveFileId(fileId);
      } else {
        alert('Could not detect records in pasted text. Make sure each record has rows and columns.');
      }
    } catch (err) {
      alert('Error parsing text: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // Toggle Global Duplicate ON/OFF (updates all files in batch)
  const handleToggleGlobalDuplicates = (newState) => {
    setGlobalRemoveDuplicates(newState);
    setFilesList(prev => prev.map(f => ({
      ...f,
      removeDuplicates: newState
    })));
  };

  // Toggle Duplicate ON/OFF for Active File
  const handleToggleActiveFileDuplicates = (newState) => {
    if (!activeFileId) return;
    setFilesList(prev => prev.map(f => {
      if (f.id === activeFileId) {
        return { ...f, removeDuplicates: newState };
      }
      return f;
    }));
  };

  // Update Selected Columns for Active File (and optionally sync across batch)
  const handleActiveFileColumnSelection = (newSelectedCols) => {
    if (!activeFileId) return;

    if (syncColumnsAcrossBatch && filesList.length > 1) {
      // Sync across all files in batch: for each file, select columns that match newSelectedCols (case-insensitive)
      setFilesList(prev => prev.map(f => {
        if (f.id === activeFileId) {
          return { ...f, selectedColumns: newSelectedCols };
        }
        // Match existing columns in this file
        const matchingCols = (f.columns || []).filter(colName => {
          return newSelectedCols.some(sel => sel.trim().toLowerCase() === colName.trim().toLowerCase());
        });
        return {
          ...f,
          selectedColumns: matchingCols.length > 0 ? matchingCols : f.selectedColumns
        };
      }));
    } else {
      // Single active file update
      setFilesList(prev => prev.map(f => {
        if (f.id === activeFileId) {
          return { ...f, selectedColumns: newSelectedCols };
        }
        return f;
      }));
    }
  };

  // Explicitly Apply Selected Columns to All Files in Batch
  const handleApplyColumnsToAllFiles = (colsToApply) => {
    setFilesList(prev => prev.map(f => {
      const matchingCols = (f.columns || []).filter(colName => {
        return colsToApply.some(sel => sel.trim().toLowerCase() === colName.trim().toLowerCase());
      });
      return {
        ...f,
        selectedColumns: matchingCols.length > 0 ? matchingCols : (f.selectedColumns || f.columns)
      };
    }));
  };

  // Remove a file from batch
  const handleRemoveFile = (fileIdToRemove) => {
    setFilesList(prev => {
      const filtered = prev.filter(f => f.id !== fileIdToRemove);
      if (activeFileId === fileIdToRemove && filtered.length > 0) {
        setActiveFileId(filtered[0].id);
      }
      return filtered;
    });
  };

  // Clear all files
  const handleClearAllFiles = () => {
    setFilesList([]);
    setActiveFileId(null);
  };

  // Load student example dataset with Name & CGPA pre-selected
  const handleStudentSampleLoad = () => {
    const studentFile = createInitialFile();
    setFilesList([studentFile]);
    setActiveFileId(studentFile.id);
  };

  // Load hospital & clinic sample data
  const handleSampleLoad = () => {
    const dirCols = ['Name', 'Address', 'Phone Number'];
    const records = SAMPLE_RECORDS.map(r => ({
      id: r.id,
      Name: r.name,
      Address: r.address,
      'Phone Number': r.phone,
      ...r
    }));
    const dAnalysis = analyzeDuplicates(records, dirCols);
    const clinicFile = {
      id: 'clinic_sample_file',
      fileName: 'Hospital_Clinic_Directory.xlsx',
      status: 'ready',
      rawDataset: records,
      columns: dirCols,
      selectedColumns: dirCols,
      removeDuplicates: true,
      duplicateAnalysis: dAnalysis,
    };
    setFilesList([clinicFile]);
    setActiveFileId(clinicFile.id);
  };

  // Reset / Clear
  const handleReset = () => {
    setFilesList([]);
    setActiveFileId(null);
  };

  // Add / Edit record for active file
  const handleOpenAddModal = () => {
    setActiveModalRecord(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (rec) => {
    setActiveModalRecord(rec);
    setIsModalOpen(true);
  };

  const handleSaveRecord = (recordData) => {
    if (!activeFileId) return;
    setFilesList(prev => prev.map(f => {
      if (f.id === activeFileId) {
        let updatedRaw;
        if (activeModalRecord) {
          updatedRaw = f.rawDataset.map(r => (r.id === recordData.id ? recordData : r));
        } else {
          updatedRaw = [recordData, ...f.rawDataset];
        }
        const updatedDAnalysis = analyzeDuplicates(updatedRaw, f.columns);
        return {
          ...f,
          rawDataset: updatedRaw,
          duplicateAnalysis: updatedDAnalysis,
        };
      }
      return f;
    }));
  };

  const handleDeleteRecord = (id) => {
    if (!activeFileId) return;
    setFilesList(prev => prev.map(f => {
      if (f.id === activeFileId) {
        const updatedRaw = f.rawDataset.filter(r => r.id !== id);
        const updatedDAnalysis = analyzeDuplicates(updatedRaw, f.columns);
        return {
          ...f,
          rawDataset: updatedRaw,
          duplicateAnalysis: updatedDAnalysis,
        };
      }
      return f;
    }));
  };

  // Export handlers with selectedColumns and activeDataSource
  const exportOptions = {
    ...options,
    uploadedFileName,
    selectedColumns,
  };

  const handleGenerateDirectoryExcel = async () => {
    setIsGenerating(true);
    try {
      return await generateDirectoryExcel(activeDataSource, exportOptions);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateStructuredExcel = async () => {
    setIsGenerating(true);
    try {
      return await generateStructuredExcel(activeDataSource, exportOptions);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateCombinedExcel = async () => {
    return await generateCombinedExcel(activeDataSource, exportOptions);
  };

  const handleGenerateDirectoryPDF = async () => {
    return await generateDirectoryPDF(activeDataSource, exportOptions);
  };

  const handleGenerateStructuredPDF = async () => {
    return await generateStructuredPDF(activeDataSource, exportOptions);
  };

  const handleExportCSV = () => {
    exportCSV(activeDataSource, exportOptions);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 text-slate-900">
      {/* Header */}
      <Header
        onReset={handleReset}
        onSampleLoad={handleSampleLoad}
        onStudentSampleLoad={handleStudentSampleLoad}
        onFileUpload={handleFileUpload}
        totalRecords={activeDataSource.length}
      />

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Intro Hero Banner */}
        <div className="mb-8 bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden no-print">
          <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              Multi-File Batch Processing &bull; Selective Column Extraction &bull; ZIP Export
            </div>
            
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-2">
              Batch Process &amp; Format Multiple Excel Files
            </h1>
            
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-4">
              Upload multiple Excel files at once. Each file is processed independently with separate column customization, duplicate detection, and output generation. Download individual files or bundle all into a single <strong>ZIP archive</strong>.
            </p>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                onClick={handleStudentSampleLoad}
                className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-white shadow-md shadow-emerald-500/30 transition-all flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Load Example: Extract Name &amp; CGPA only
              </button>
              <button
                onClick={handleSampleLoad}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-white/10 hover:bg-white/20 text-slate-200 transition-all"
              >
                Load Clinic Directory Data
              </button>
            </div>
          </div>
        </div>

        {/* Upload Section (Always available for batch drag & drop) */}
        <div className="no-print">
          <FileUpload
            onFileUpload={handleFileUpload}
            onTextParse={handleTextParse}
            isProcessing={isProcessing}
          />
        </div>

        {/* BATCH MULTI-FILE WORKSPACE & FILE LIST */}
        {filesList.length > 0 && (
          <BatchFileManager
            filesList={filesList}
            activeFileId={activeFileId}
            onSelectActiveFile={setActiveFileId}
            onRemoveFile={handleRemoveFile}
            onClearAllFiles={handleClearAllFiles}
            onUploadMoreFiles={handleFileUpload}
            onToggleGlobalDuplicates={handleToggleGlobalDuplicates}
            globalRemoveDuplicates={globalRemoveDuplicates}
            options={options}
            isBatchProcessing={isProcessing}
          />
        )}

        {/* Column Selection & Active File Dashboard Controls */}
        {activeFile && rawDataset.length > 0 && (
          <>
            <div className="no-print">
              <StatsOverview
                stats={computedStats}
                recordsCount={activeDataSource.length}
                columnsCount={options.columnsCount}
                removeDuplicates={removeDuplicates}
              />

              {/* DUPLICATE DATA FEATURE — ON/OFF CONTROL & AUDIT TABLE FOR ACTIVE FILE */}
              <DuplicateManager
                removeDuplicates={removeDuplicates}
                onToggleRemoveDuplicates={handleToggleActiveFileDuplicates}
                duplicateAnalysis={duplicateAnalysis}
                columns={columns}
                uploadedFileName={uploadedFileName}
              />

              {/* DEDICATED COLUMN SELECTION COMPONENT */}
              <ColumnSelector
                columns={columns}
                selectedColumns={selectedColumns}
                onSelectionChange={handleActiveFileColumnSelection}
                tableData={activeDataSource}
                onGenerateExcel={handleGenerateStructuredExcel}
                isGenerating={isGenerating}
                totalBatchFiles={filesList.length}
                syncColumnsAcrossBatch={syncColumnsAcrossBatch}
                onToggleSyncColumns={setSyncColumnsAcrossBatch}
                onApplyToAllFiles={handleApplyColumnsToAllFiles}
              />

              {/* Optional Settings & Font Color Customizer */}
              <SettingsBar
                options={options}
                setOptions={setOptions}
                onGenerateExcel={handleGenerateStructuredExcel}
                isGenerating={isGenerating}
                selectedColumns={selectedColumns}
              />
            </div>

            {/* Interactive Live Preview & Multi-Format Export */}
            <DirectoryPreview
              records={activeDataSource}
              tableData={activeDataSource}
              columns={columns}
              selectedColumns={selectedColumns}
              onGenerateDirectoryExcel={handleGenerateDirectoryExcel}
              onGenerateStructuredExcel={handleGenerateStructuredExcel}
              onGenerateCombinedExcel={handleGenerateCombinedExcel}
              onGenerateDirectoryPDF={handleGenerateDirectoryPDF}
              onGenerateStructuredPDF={handleGenerateStructuredPDF}
              onExportCSV={handleExportCSV}
              onEditRecord={handleOpenEditModal}
              onDeleteRecord={handleDeleteRecord}
              onAddNewRecord={handleOpenAddModal}
              options={options}
              duplicateAnalysis={duplicateAnalysis}
              onFileUpload={handleFileUpload}
              uploadedFileName={uploadedFileName}
            />
          </>
        )}
      </main>

      {/* Record Add/Edit Modal */}
      <RecordModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveRecord}
        record={activeModalRecord}
        columns={columns}
      />
    </div>
  );
}
