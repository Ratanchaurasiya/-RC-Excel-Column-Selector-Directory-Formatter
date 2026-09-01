import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, ClipboardPaste, ArrowRight, CheckCircle, AlertCircle, FileSpreadsheet, Loader2, Files } from 'lucide-react';
import { RAW_BLOCK_SAMPLE_TEXT } from '../utils/sampleData';

export default function FileUpload({ onFileUpload, onTextParse, isProcessing }) {
  const [activeTab, setActiveTab] = useState('upload'); // 'upload' | 'paste'
  const [pasteText, setPasteText] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const fileInputRef = useRef(null);

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (files.length === 0) return;
    await processSelectedFiles(files);
  };

  const processSelectedFiles = async (files) => {
    setErrorMsg('');
    const validExts = ['.xlsx', '.xls', '.csv'];
    const validFiles = files.filter(file => {
      const fileName = file.name.toLowerCase();
      return validExts.some(ext => fileName.endsWith(ext));
    });

    if (validFiles.length === 0) {
      setErrorMsg('Please upload valid Excel (.xlsx, .xls) or CSV files.');
      return;
    }

    try {
      await onFileUpload(validFiles);
    } catch (err) {
      setErrorMsg(err.message || 'Error processing Excel files. Please verify format.');
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files);
      await processSelectedFiles(files);
    }
  };

  const handlePasteSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');
    if (!pasteText.trim()) {
      setErrorMsg('Please paste some text first.');
      return;
    }
    try {
      onTextParse(pasteText);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to parse pasted text.');
    }
  };

  const handleLoadSampleText = () => {
    setPasteText(RAW_BLOCK_SAMPLE_TEXT);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-8">
      {/* Tabs */}
      <div className="flex border-b border-slate-200 bg-slate-50/70 px-4 pt-3 gap-2">
        <button
          onClick={() => setActiveTab('upload')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-t-xl transition-all ${
            activeTab === 'upload'
              ? 'bg-white text-slate-900 border-t-2 border-emerald-500 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
          }`}
        >
          <UploadCloud className="w-4 h-4 text-emerald-600" />
          Upload Excel File(s)
        </button>

        <button
          onClick={() => setActiveTab('paste')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-t-xl transition-all ${
            activeTab === 'paste'
              ? 'bg-white text-slate-900 border-t-2 border-emerald-500 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
          }`}
        >
          <ClipboardPaste className="w-4 h-4 text-emerald-600" />
          Paste Unstructured Text
        </button>
      </div>

      <div className="p-6 sm:p-8">
        {errorMsg && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between gap-2 text-sm text-red-700">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-500" />
              <span>{errorMsg}</span>
            </div>
            <button
              onClick={() => setErrorMsg('')}
              className="text-xs text-red-600 hover:underline font-bold px-2 py-1"
            >
              Dismiss
            </button>
          </div>
        )}

        {activeTab === 'upload' ? (
          <div>
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
              onClick={() => {
                if (fileInputRef.current) {
                  fileInputRef.current.value = '';
                  fileInputRef.current.click();
                }
              }}
              className={`border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-all ${
                isDragOver
                  ? 'border-emerald-500 bg-emerald-50/50 scale-[0.99]'
                  : 'border-slate-300 hover:border-emerald-400 bg-slate-50/50 hover:bg-emerald-50/20'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={handleFileChange}
                onClick={(e) => { e.target.value = ''; }}
              />

              <div className="mx-auto w-16 h-16 rounded-2xl bg-emerald-100/80 text-emerald-600 flex items-center justify-center mb-4 shadow-inner">
                {isProcessing ? (
                  <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
                ) : (
                  <Files className="w-8 h-8" />
                )}
              </div>

              <h3 className="text-base sm:text-lg font-semibold text-slate-800 mb-1">
                {isProcessing ? 'Processing Excel File(s)...' : 'Click to upload or drag & drop single or multiple Excel files'}
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
                Supports multiple files at once (.xlsx, .xls, .csv). Each file is processed independently with separate outputs.
              </p>

              <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs text-slate-600 shadow-xs font-medium">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                Batch processing &bull; Multi-file ZIP export &bull; Individual file downloads
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handlePasteSubmit} className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Paste raw clinic / business blocks (e.g. from WhatsApp, Word, or Web)
              </label>
              <button
                type="button"
                onClick={handleLoadSampleText}
                className="text-xs font-medium text-emerald-600 hover:text-emerald-700 underline"
              >
                Insert Sample Block Text
              </button>
            </div>

            <textarea
              rows={8}
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder={`Example format:
Jyoti Hospital ICU & Pharmacy
Ziva Living - Boys PG in Science City
B-4, 7, 1st Floor, Science City Road, Sola, Ahmedabad 380060
099091 66557

Dr Mital Patel
Boned Hospital City Square, Ahmedabad
09897077004`}
              className="w-full rounded-xl border border-slate-300 p-4 text-sm font-mono text-slate-800 placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all"
            />

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setPasteText('')}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Clear
              </button>
              <button
                type="submit"
                disabled={!pasteText.trim() || isProcessing}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-xl shadow-sm transition-all"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    Format into Directory
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
