import React, { useState } from 'react';
import Header from './components/Header';
import StatsOverview from './components/StatsOverview';
import FileUpload from './components/FileUpload';
import ColumnSelector from './components/ColumnSelector';
import SettingsBar from './components/SettingsBar';
import DirectoryPreview from './components/DirectoryPreview';
import RecordModal from './components/RecordModal';
import { parseExcelData, parseRawTextData } from './utils/parser';
import {
  generateDirectoryExcel,
  generateStructuredExcel,
  generateSelectedColumnsExcel,
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
  STUDENT_SAMPLE_RECORDS
} from './utils/sampleData';
import { Sparkles, FileSpreadsheet, CheckCircle2, ShieldCheck, Printer, Table, BookOpen, Layers, LayoutGrid, Columns, Sliders } from 'lucide-react';

export default function App() {
  // Start with the student scenario data as demo default
  const [columns, setColumns] = useState(STUDENT_SAMPLE_COLUMNS);
  const [selectedColumns, setSelectedColumns] = useState(['Name', 'CGPA']);
  const [tableData, setTableData] = useState(STUDENT_SAMPLE_RECORDS);
  const [records, setRecords] = useState(STUDENT_SAMPLE_RECORDS);
  
  const [stats, setStats] = useState({
    totalRaw: STUDENT_SAMPLE_RECORDS.length,
    duplicatesRemoved: 0,
    formattedCount: STUDENT_SAMPLE_RECORDS.length,
    totalColumns: STUDENT_SAMPLE_COLUMNS.length,
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeModalRecord, setActiveModalRecord] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState('Student_Records');

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

  // Handle file upload (.xlsx, .xls, .csv)
  const handleFileUpload = async (file) => {
    setIsProcessing(true);
    const baseName = file.name.replace(/\.[^/.]+$/, '');
    setUploadedFileName(baseName);
    try {
      const result = await parseExcelData(file);
      if ((result.tableData && result.tableData.length > 0) || (result.records && result.records.length > 0)) {
        const detectedCols = result.columns || [];
        setColumns(detectedCols);
        setSelectedColumns(detectedCols);
        setTableData(result.tableData || result.records);
        setRecords(result.records);
        setStats(result.stats);
      } else {
        alert('Could not find valid tabular records in the uploaded file. Please verify contents.');
      }
    } catch (err) {
      console.error(err);
      alert('Error parsing Excel: ' + (err.message || 'Unknown error'));
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle raw pasted text
  const handleTextParse = (text) => {
    setIsProcessing(true);
    try {
      const result = parseRawTextData(text);
      if ((result.tableData && result.tableData.length > 0) || (result.records && result.records.length > 0)) {
        const detectedCols = result.columns || [];
        setColumns(detectedCols);
        setSelectedColumns(detectedCols);
        setTableData(result.tableData || result.records);
        setRecords(result.records);
        setStats(result.stats);
      } else {
        alert('Could not detect records in pasted text. Make sure each record has rows and columns.');
      }
    } catch (err) {
      alert('Error parsing text: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // Load student example dataset with Name & CGPA pre-selected
  const handleStudentSampleLoad = () => {
    setColumns(STUDENT_SAMPLE_COLUMNS);
    setSelectedColumns(['Name', 'CGPA']);
    setTableData(STUDENT_SAMPLE_RECORDS);
    setRecords(STUDENT_SAMPLE_RECORDS);
    setUploadedFileName('Student_Data');
    setStats({
      totalRaw: STUDENT_SAMPLE_RECORDS.length,
      duplicatesRemoved: 0,
      formattedCount: STUDENT_SAMPLE_RECORDS.length,
      totalColumns: STUDENT_SAMPLE_COLUMNS.length,
    });
  };

  // Load hospital & clinic sample data
  const handleSampleLoad = () => {
    const dirCols = ['Name', 'Address', 'Phone Number'];
    setColumns(dirCols);
    setSelectedColumns(dirCols);
    setRecords(SAMPLE_RECORDS);
    setTableData(SAMPLE_RECORDS.map(r => ({
      id: r.id,
      Name: r.name,
      Address: r.address,
      'Phone Number': r.phone,
      ...r
    })));
    setUploadedFileName('Hospital_Directory');
    setStats({
      totalRaw: SAMPLE_RECORDS.length,
      duplicatesRemoved: 0,
      formattedCount: SAMPLE_RECORDS.length,
      totalColumns: dirCols.length,
    });
  };

  // Reset / Clear
  const handleReset = () => {
    setColumns([]);
    setSelectedColumns([]);
    setTableData([]);
    setRecords([]);
    setStats({ totalRaw: 0, duplicatesRemoved: 0, formattedCount: 0, totalColumns: 0 });
  };

  // Add / Edit record
  const handleOpenAddModal = () => {
    setActiveModalRecord(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (rec) => {
    setActiveModalRecord(rec);
    setIsModalOpen(true);
  };

  const handleSaveRecord = (recordData) => {
    if (activeModalRecord) {
      setRecords(prev => prev.map(r => (r.id === recordData.id ? recordData : r)));
      setTableData(prev => prev.map(r => (r.id === recordData.id ? recordData : r)));
    } else {
      setRecords(prev => [recordData, ...prev]);
      setTableData(prev => [recordData, ...prev]);
    }
  };

  const handleDeleteRecord = (id) => {
    setRecords(prev => prev.filter(r => r.id !== id));
    setTableData(prev => prev.filter(r => r.id !== id));
  };

  // Export handlers with selectedColumns
  const exportOptions = {
    ...options,
    uploadedFileName,
    selectedColumns,
  };

  const activeDataSource = tableData.length > 0 ? tableData : records;

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
              Selective Column Extraction &bull; Dynamic Multi-Column Excel &amp; PDF Generator
            </div>
            
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-2">
              Select Required Columns &amp; Export Excel
            </h1>
            
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-4">
              Upload any Excel file containing multiple columns (e.g. <em>Name, Contact No., Address, District, CGPA</em>). Select only the columns you want (e.g. <strong>Name &amp; CGPA</strong>) to generate a clean, customized Excel file with zero extra columns.
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

        {/* Upload Section */}
        <div className="no-print">
          <FileUpload
            onFileUpload={handleFileUpload}
            onTextParse={handleTextParse}
            isProcessing={isProcessing}
          />
        </div>

        {/* Column Selection & Dashboard Controls */}
        {activeDataSource.length > 0 && (
          <>
            <div className="no-print">
              <StatsOverview
                stats={stats}
                recordsCount={activeDataSource.length}
              />

              {/* DEDICATED COLUMN SELECTION COMPONENT */}
              <ColumnSelector
                columns={columns}
                selectedColumns={selectedColumns}
                onSelectionChange={setSelectedColumns}
                tableData={activeDataSource}
                onGenerateExcel={handleGenerateStructuredExcel}
                isGenerating={isGenerating}
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
              records={records}
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

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 mt-auto no-print">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs text-slate-500">
          Excel Column Selector &amp; Data Extractor &bull; Extract Only Selected Columns &bull; Excel (.xlsx), CSV, PDF &bull; Multi-column Directory
        </div>
      </footer>
    </div>
  );
}

