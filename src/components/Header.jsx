import React, { useRef } from 'react';
import { FileSpreadsheet, Download, Sparkles, RefreshCw, UploadCloud } from 'lucide-react';
import * as XLSX from 'xlsx';
import { generateStudentSampleWorkbook } from '../utils/sampleData';

export default function Header({ onReset, onSampleLoad, onStudentSampleLoad, onFileUpload, totalRecords }) {
  const headerFileInputRef = useRef(null);

  const handleDownloadSampleInput = () => {
    const wb = generateStudentSampleWorkbook(XLSX);
    XLSX.writeFile(wb, 'Student_Records_Sample.xlsx');
  };

  const handleHeaderFileChange = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (files.length > 0 && onFileUpload) {
      await onFileUpload(files);
    }
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white font-extrabold text-sm shadow-md shadow-emerald-500/20 tracking-wider">
              RC
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-extrabold text-slate-900 leading-none">
                  RC <span className="text-emerald-700 font-bold">&bull; Excel Column Selector &amp; Directory Formatter</span>
                </h1>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  RC Edition
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Selective Column Extraction &bull; 1 to 5 Columns Directory Excel &amp; PDF Generator
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2.5">
            {/* Hidden header file input */}
            <input
              ref={headerFileInputRef}
              type="file"
              multiple
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={handleHeaderFileChange}
              onClick={(e) => { e.target.value = ''; }}
            />

            <button
              onClick={() => headerFileInputRef.current?.click()}
              title="Upload any Excel (.xlsx, .xls, .csv) file without refreshing"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors cursor-pointer"
            >
              <UploadCloud className="w-3.5 h-3.5 text-emerald-600" />
              Upload File
            </button>

            <button
              onClick={handleDownloadSampleInput}
              title="Download sample Excel with Name, Contact No, Address, District, CGPA"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              Download Test Excel
            </button>

            {onStudentSampleLoad && (
              <button
                onClick={onStudentSampleLoad}
                title="Load Student Data (Name, Contact No, Address, District, CGPA) with Name & CGPA selected"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 rounded-lg shadow-sm transition-all"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-200" />
                Try Example (Name &amp; CGPA)
              </button>
            )}

            {totalRecords > 0 && (
              <button
                onClick={onReset}
                title="Clear current data and start fresh"
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 rounded-lg transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Reset
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
