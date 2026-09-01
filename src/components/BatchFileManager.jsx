import React, { useState, useRef } from 'react';
import {
  Files, FileSpreadsheet, Download, Trash2, CheckCircle2,
  AlertCircle, Loader2, Plus, Sparkles, Archive, FileText,
  Copy, ToggleLeft, ToggleRight, Layers, Eye, RefreshCw
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { exportBatchAsZip, downloadBatchItem } from '../utils/batchExport.js';

export default function BatchFileManager({
  filesList = [],
  activeFileId,
  onSelectActiveFile,
  onRemoveFile,
  onClearAllFiles,
  onUploadMoreFiles,
  onToggleGlobalDuplicates,
  globalRemoveDuplicates,
  options,
  isBatchProcessing = false
}) {
  const [isZipping, setIsZipping] = useState(false);
  const [downloadingFileId, setDownloadingFileId] = useState(null);
  const multiFileInputRef = useRef(null);

  if (!filesList || filesList.length === 0) {
    return null;
  }

  // Aggregate Batch Statistics
  const totalFiles = filesList.length;
  const readyFiles = filesList.filter(f => f.status === 'ready');
  const totalRawRecords = readyFiles.reduce((acc, f) => acc + (f.duplicateAnalysis?.totalRaw || (f.rawDataset?.length || 0)), 0);
  const totalDuplicates = readyFiles.reduce((acc, f) => acc + (f.duplicateAnalysis?.duplicateCount || 0), 0);
  const totalOutputRecords = readyFiles.reduce((acc, f) => {
    const active = f.removeDuplicates
      ? (f.duplicateAnalysis?.uniqueRecords || f.rawDataset || [])
      : (f.duplicateAnalysis?.rawRecords || f.rawDataset || []);
    return acc + active.length;
  }, 0);

  const handleDownloadZip = async (format = 'all') => {
    setIsZipping(true);
    try {
      await exportBatchAsZip(filesList, options, format);
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.8 }
      });
    } catch (err) {
      alert(`Batch Zip Download Failed: ${err.message}`);
    } finally {
      setIsZipping(false);
    }
  };

  const handleDownloadSingle = async (fileItem, format = 'excel_directory') => {
    setDownloadingFileId(`${fileItem.id}_${format}`);
    try {
      await downloadBatchItem(fileItem, format, options);
    } catch (err) {
      alert(`Download Failed for ${fileItem.fileName}: ${err.message}`);
    } finally {
      setDownloadingFileId(null);
    }
  };

  const handleMultiFileInput = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (files.length > 0 && onUploadMoreFiles) {
      await onUploadMoreFiles(files);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-8 no-print">
      {/* Hidden input for adding more files */}
      <input
        ref={multiFileInputRef}
        type="file"
        multiple
        accept=".xlsx,.xls,.csv"
        className="hidden"
        onChange={handleMultiFileInput}
        onClick={(e) => { e.target.value = ''; }}
      />

      {/* Header Bar */}
      <div className="p-4 sm:p-6 bg-slate-900 text-white flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Files className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white">
                  Batch Multi-File Workspace
                </h2>
                <span className="bg-emerald-500 text-slate-950 text-xs font-extrabold px-2.5 py-0.5 rounded-full shadow-xs">
                  {totalFiles} {totalFiles === 1 ? 'File' : 'Files'} Uploaded
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Each file is processed independently with its own columns, duplicate detection, and separate outputs.
              </p>
            </div>
          </div>
        </div>

        {/* Global Batch Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Duplicate ON/OFF Toggle for ALL Files */}
          <div className="flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700">
            <span className="text-xs font-semibold text-slate-300">
              Deduplicate All:
            </span>
            <button
              onClick={() => onToggleGlobalDuplicates(!globalRemoveDuplicates)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                globalRemoveDuplicates
                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              {globalRemoveDuplicates ? (
                <>
                  <ToggleRight className="w-4 h-4 text-slate-950" />
                  ON
                </>
              ) : (
                <>
                  <ToggleLeft className="w-4 h-4 text-slate-400" />
                  OFF
                </>
              )}
            </button>
          </div>

          {/* Upload More Files Button */}
          <button
            onClick={() => multiFileInputRef.current?.click()}
            disabled={isBatchProcessing}
            title="Select more Excel (.xlsx, .xls) or CSV files to add to this batch"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4 text-emerald-400" />
            Add More Files
          </button>

          {/* Download ALL as ZIP */}
          <button
            onClick={() => handleDownloadZip('all')}
            disabled={isZipping || readyFiles.length === 0}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-bold text-slate-950 bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 active:scale-95 disabled:opacity-50 rounded-xl shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
          >
            {isZipping ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Bundling ZIP...
              </>
            ) : (
              <>
                <Archive className="w-4 h-4" />
                Download All ({readyFiles.length} Files .ZIP)
              </>
            )}
          </button>
        </div>
      </div>

      {/* Aggregate Batch Stats Bar */}
      <div className="bg-slate-50 border-b border-slate-200 px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-4 text-slate-600">
          <div>
            Total Raw: <strong className="text-slate-900 font-bold">{totalRawRecords}</strong> records
          </div>
          <span className="text-slate-300">&bull;</span>
          <div>
            Duplicates Found: <strong className="text-amber-700 font-bold">{totalDuplicates}</strong>
          </div>
          <span className="text-slate-300">&bull;</span>
          <div>
            Active Clean Output: <strong className="text-emerald-700 font-bold">{totalOutputRecords}</strong> records
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onClearAllFiles}
            className="text-xs text-slate-500 hover:text-red-600 hover:underline transition-colors"
          >
            Clear All Files
          </button>
        </div>
      </div>

      {/* Files List Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-100/80 text-slate-700 font-semibold border-b border-slate-200">
              <th className="py-3 px-4 w-12 text-center">Active</th>
              <th className="py-3 px-4">File Name</th>
              <th className="py-3 px-3 w-28 text-center">Status</th>
              <th className="py-3 px-3 w-28 text-center">Raw Records</th>
              <th className="py-3 px-3 w-28 text-center">Duplicates</th>
              <th className="py-3 px-3 w-28 text-center">Output Records</th>
              <th className="py-3 px-4 text-right">Individual Downloads</th>
              <th className="py-3 px-3 w-14 text-center">Remove</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {filesList.map((fileItem, idx) => {
              const isActive = fileItem.id === activeFileId;
              const dAnalysis = fileItem.duplicateAnalysis;
              const rawCount = dAnalysis?.totalRaw || (fileItem.rawDataset?.length || 0);
              const dupCount = dAnalysis?.duplicateCount || 0;
              const activeCount = fileItem.removeDuplicates
                ? (dAnalysis?.uniqueRecords?.length ?? rawCount - dupCount)
                : rawCount;

              return (
                <tr
                  key={fileItem.id || idx}
                  onClick={() => onSelectActiveFile(fileItem.id)}
                  className={`transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-emerald-50/70 hover:bg-emerald-50'
                      : 'hover:bg-slate-50/80 bg-white'
                  }`}
                >
                  {/* Active Radio Badge */}
                  <td className="py-3 px-4 text-center align-middle">
                    <div className="flex items-center justify-center">
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${
                        isActive
                          ? 'border-emerald-600 bg-emerald-600'
                          : 'border-slate-300 bg-white hover:border-slate-400'
                      }`}>
                        {isActive && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                    </div>
                  </td>

                  {/* File Name & Columns Info */}
                  <td className="py-3 px-4 align-middle">
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className={`w-4 h-4 flex-shrink-0 ${
                        isActive ? 'text-emerald-600' : 'text-slate-500'
                      }`} />
                      <div>
                        <div className="font-bold text-slate-900 flex items-center gap-2">
                          <span>{fileItem.fileName}</span>
                          {isActive && (
                            <span className="text-[10px] uppercase font-extrabold bg-emerald-600 text-white px-2 py-0.5 rounded-full shadow-2xs">
                              Viewing
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-1 flex flex-wrap items-center gap-1.5">
                          <span className="font-semibold text-emerald-800">
                            {fileItem.selectedColumns?.length || fileItem.columns?.length || 0} fields:
                          </span>
                          {(fileItem.selectedColumns || fileItem.columns || []).map((col, cIdx) => (
                            <span key={cIdx} className="bg-emerald-100/80 text-emerald-900 px-1.5 py-0.5 rounded font-mono text-[10px] font-bold border border-emerald-200">
                              {col}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Status */}
                  <td className="py-3 px-3 text-center align-middle">
                    {fileItem.status === 'processing' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-100 text-blue-800 animate-pulse">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Parsing...
                      </span>
                    ) : fileItem.status === 'error' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-red-100 text-red-800" title={fileItem.errorMessage}>
                        <AlertCircle className="w-3 h-3 text-red-600" />
                        Error
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Ready
                      </span>
                    )}
                  </td>

                  {/* Raw Records */}
                  <td className="py-3 px-3 text-center align-middle font-mono font-bold text-slate-700">
                    {rawCount}
                  </td>

                  {/* Duplicates */}
                  <td className="py-3 px-3 text-center align-middle">
                    {dupCount > 0 ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full font-mono text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                        {dupCount} dups
                      </span>
                    ) : (
                      <span className="text-slate-400 font-mono">0</span>
                    )}
                  </td>

                  {/* Active Output Records */}
                  <td className="py-3 px-3 text-center align-middle font-mono font-bold text-emerald-700">
                    {activeCount}
                  </td>

                  {/* Individual Download Buttons */}
                  <td className="py-3 px-4 text-right align-middle" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1.5">
                      {/* Excel Download */}
                      <button
                        onClick={() => handleDownloadSingle(fileItem, 'excel_directory')}
                        disabled={fileItem.status !== 'ready' || downloadingFileId === `${fileItem.id}_excel_directory`}
                        title={`Download ${fileItem.fileName} as Directory Excel`}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 rounded-lg transition-colors disabled:opacity-40"
                      >
                        {downloadingFileId === `${fileItem.id}_excel_directory` ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Download className="w-3.5 h-3.5" />
                        )}
                        Excel
                      </button>

                      {/* PDF Download */}
                      <button
                        onClick={() => handleDownloadSingle(fileItem, 'pdf_directory')}
                        disabled={fileItem.status !== 'ready' || downloadingFileId === `${fileItem.id}_pdf_directory`}
                        title={`Download ${fileItem.fileName} as Directory PDF`}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-red-800 bg-red-100 hover:bg-red-200 rounded-lg transition-colors disabled:opacity-40"
                      >
                        {downloadingFileId === `${fileItem.id}_pdf_directory` ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <FileText className="w-3.5 h-3.5" />
                        )}
                        PDF
                      </button>
                    </div>
                  </td>

                  {/* Remove Button */}
                  <td className="py-3 px-3 text-center align-middle" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => onRemoveFile(fileItem.id)}
                      title={`Remove ${fileItem.fileName} from batch`}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
