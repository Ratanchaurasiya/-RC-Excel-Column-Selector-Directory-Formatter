import React, { useState } from 'react';
import {
  CheckSquare, Square, Check, RefreshCw, Search, ArrowLeft, ArrowRight,
  Sparkles, Layers, FileSpreadsheet, Download, Sliders, Eye, AlertCircle
} from 'lucide-react';

export default function ColumnSelector({
  columns = [],
  selectedColumns = [],
  onSelectionChange,
  tableData = [],
  onGenerateExcel,
  isGenerating
}) {
  const [searchFilter, setSearchFilter] = useState('');

  if (!columns || columns.length === 0) {
    return null;
  }

  // Get sample values for each column (first 2 non-empty values)
  const getSampleValues = (colName) => {
    if (!tableData || tableData.length === 0) return '';
    const samples = [];
    for (const row of tableData) {
      const val = row[colName];
      if (val !== undefined && val !== null && String(val).trim() !== '') {
        samples.push(String(val).trim());
        if (samples.length >= 2) break;
      }
    }
    return samples.join(', ');
  };

  const handleToggleColumn = (colName) => {
    if (selectedColumns.includes(colName)) {
      onSelectionChange(selectedColumns.filter(c => c !== colName));
    } else {
      onSelectionChange([...selectedColumns, colName]);
    }
  };

  const handleSelectAll = () => {
    onSelectionChange([...columns]);
  };

  const handleDeselectAll = () => {
    onSelectionChange([]);
  };

  const handleInvertSelection = () => {
    const inverted = columns.filter(c => !selectedColumns.includes(c));
    onSelectionChange(inverted);
  };

  const handleMoveColumn = (colName, direction) => {
    const idx = selectedColumns.indexOf(colName);
    if (idx === -1) return;
    const newIdx = idx + direction;
    if (newIdx < 0 || newIdx >= selectedColumns.length) return;

    const updated = [...selectedColumns];
    const temp = updated[idx];
    updated[idx] = updated[newIdx];
    updated[newIdx] = temp;
    onSelectionChange(updated);
  };

  const filteredColumns = columns.filter(col =>
    col.toLowerCase().includes(searchFilter.toLowerCase())
  );

  const excludedColumns = columns.filter(col => !selectedColumns.includes(col));

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 mb-6 shadow-sm">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">
                  Select Fields to Include:
                </h3>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  selectedColumns.length > 0
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    : 'bg-amber-100 text-amber-800 border border-amber-200'
                }`}>
                  {selectedColumns.length} of {columns.length} Fields Selected
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Select the exact data fields you want to include in the directory cards &amp; Excel output.
              </p>
            </div>
          </div>
        </div>

        {/* Quick Batch Selection Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleSelectAll}
            className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
          >
            Select All
          </button>
          <button
            onClick={handleDeselectAll}
            className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
          >
            Clear All
          </button>
          <button
            onClick={handleInvertSelection}
            className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
          >
            Invert
          </button>
        </div>
      </div>


      {/* Column Search & Filter (if more than 4 columns) */}
      {columns.length > 4 && (
        <div className="pt-3 pb-2">
          <div className="relative max-w-sm">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Search column names..."
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-300 bg-slate-50/50 focus:bg-white focus:border-emerald-500 outline-none"
            />
          </div>
        </div>
      )}

      {/* Interactive Columns Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 pt-3">
        {filteredColumns.map((colName) => {
          const isSelected = selectedColumns.includes(colName);
          const orderIndex = selectedColumns.indexOf(colName);
          const samples = getSampleValues(colName);

          return (
            <div
              key={colName}
              onClick={() => handleToggleColumn(colName)}
              className={`group relative p-3 rounded-xl border transition-all cursor-pointer select-none flex flex-col justify-between ${
                isSelected
                  ? 'bg-emerald-50/60 border-emerald-500 shadow-xs ring-1 ring-emerald-400/40'
                  : 'bg-slate-50/50 border-slate-200 hover:border-slate-300 hover:bg-slate-100/50'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors ${
                      isSelected
                        ? 'bg-emerald-600 text-white'
                        : 'border border-slate-300 bg-white text-transparent'
                    }`}>
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                    <span className="font-bold text-xs text-slate-800 truncate" title={colName}>
                      {colName}
                    </span>
                  </div>

                  {/* Order Badge if selected */}
                  {isSelected && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-200/80 text-emerald-900">
                      #{orderIndex + 1}
                    </span>
                  )}
                </div>

                {/* Sample Value Preview */}
                {samples && (
                  <div className="mt-2 text-[11px] text-slate-500 truncate" title={`Sample: ${samples}`}>
                    <span className="text-slate-400 font-medium">Sample: </span>
                    <span className="font-mono text-slate-600">{samples}</span>
                  </div>
                )}
              </div>

              {/* Column Reordering Buttons */}
              {isSelected && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="mt-2 pt-2 border-t border-emerald-200/60 flex items-center justify-between text-[10px] text-slate-500"
                >
                  <span className="text-emerald-700 font-semibold">Included</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleMoveColumn(colName, -1)}
                      disabled={orderIndex === 0}
                      title="Move column left"
                      className="p-1 rounded bg-white border border-slate-200 hover:bg-emerald-100 disabled:opacity-30 disabled:hover:bg-white"
                    >
                      <ArrowLeft className="w-2.5 h-2.5 text-slate-700" />
                    </button>
                    <button
                      onClick={() => handleMoveColumn(colName, 1)}
                      disabled={orderIndex === selectedColumns.length - 1}
                      title="Move column right"
                      className="p-1 rounded bg-white border border-slate-200 hover:bg-emerald-100 disabled:opacity-30 disabled:hover:bg-white"
                    >
                      <ArrowRight className="w-2.5 h-2.5 text-slate-700" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Output Summary Banner */}
      <div className="mt-4 p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="flex-1">
          <div className="font-bold text-slate-700 mb-1 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-emerald-600" />
            Final Generated Excel Columns ({selectedColumns.length}):
          </div>

          {selectedColumns.length > 0 ? (
            <div className="flex flex-wrap items-center gap-1.5">
              {selectedColumns.map((col, idx) => (
                <span
                  key={col}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-semibold text-xs shadow-2xs"
                >
                  <span className="opacity-70 text-[10px]">#{idx + 1}</span>
                  {col}
                </span>
              ))}
            </div>
          ) : (
            <div className="text-amber-700 font-semibold flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              Please select at least 1 column to generate the Excel file.
            </div>
          )}

          {excludedColumns.length > 0 && selectedColumns.length > 0 && (
            <div className="mt-1.5 text-[11px] text-slate-400">
              <span className="font-medium text-slate-500">Excluded ({excludedColumns.length}):</span>{' '}
              {excludedColumns.join(', ')}
            </div>
          )}
        </div>

        {/* Direct Generate Shortcut Button */}
        {onGenerateExcel && (
          <button
            onClick={onGenerateExcel}
            disabled={isGenerating || selectedColumns.length === 0}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 disabled:opacity-40 rounded-xl shadow-sm transition-all cursor-pointer flex-shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            {isGenerating ? 'Generating Excel...' : `Generate Excel (${selectedColumns.length} Col)`}
          </button>
        )}
      </div>
    </div>
  );
}
