import React, { useState } from 'react';
import {
  Download, Search, Plus, Edit2, Trash2, FileSpreadsheet,
  Printer, Check, Copy, Table, Columns2, ChevronDown, FileText,
  Layers, FileCode, Sparkles, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function DirectoryPreview({
  records,
  tableData = [],
  columns = [],
  selectedColumns = [],
  onGenerateDirectoryExcel,
  onGenerateStructuredExcel,
  onGenerateCombinedExcel,
  onGenerateDirectoryPDF,
  onGenerateStructuredPDF,
  onExportCSV,
  onEditRecord,
  onDeleteRecord,
  onAddNewRecord,
  options
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [activeView, setActiveView] = useState('directory');
  const [showExportMenu, setShowExportMenu] = useState(false);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(24);

  // Active columns to display
  const activeCols = selectedColumns && selectedColumns.length > 0
    ? selectedColumns
    : (columns && columns.length > 0 ? columns : ['Name', 'Address', 'Phone Number']);

  // Records source: use tableData if available and structured, fallback to records
  const dataSource = tableData && tableData.length > 0 ? tableData : records;

  const filteredRecords = dataSource.filter(r => {
    const term = searchTerm.toLowerCase();
    if (!term) return true;
    
    // Check all active columns
    const inCols = activeCols.some(col => {
      const val = r[col];
      return val !== undefined && val !== null && String(val).toLowerCase().includes(term);
    });

    return (
      inCols ||
      (r.name && String(r.name).toLowerCase().includes(term)) ||
      (r.address && String(r.address).toLowerCase().includes(term)) ||
      (r.phone && String(r.phone).toLowerCase().includes(term))
    );
  });


  const columnsCount = Number(options.columnsCount) || 2;
  const nameColor = options.nameColor || '#0F172A';
  const addressColor = options.addressColor || '#334155';
  const phoneColor = options.phoneColor || '#0F172A';
  const borderColor = options.borderColor || '#94A3B8';

  // Pagination calculation
  const effectivePageSize = pageSize === 'all' ? filteredRecords.length : Number(pageSize);
  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / effectivePageSize));
  const validPage = Math.min(currentPage, totalPages);
  
  const startIndex = (validPage - 1) * effectivePageSize;
  const pageRecords = filteredRecords.slice(startIndex, startIndex + effectivePageSize);

  const triggerExport = async (exportFn, typeName) => {
    setIsExporting(true);
    setShowExportMenu(false);
    try {
      await exportFn();
      confetti({
        particleCount: 75,
        spread: 60,
        origin: { y: 0.8 },
        colors: ['#059669', '#10b981', '#34d399', '#0284c7']
      });
    } catch (err) {
      alert('Error exporting ' + typeName + ': ' + err.message);
    } finally {
      setIsExporting(false);
    }
  };

  const handleBrowserPrint = () => {
    window.print();
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-12">
      {/* Header bar */}
      <div className="p-4 sm:p-6 border-b border-slate-200 bg-slate-50/70 flex flex-col lg:flex-row lg:items-center justify-between gap-4 no-print">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              {activeView === 'structured'
                ? `Extracted Table Preview • ${activeCols.length} Selected Columns`
                : `Live Preview • ${columnsCount} Columns Per Page`}
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
              {filteredRecords.length} {filteredRecords.length === 1 ? 'Row' : 'Rows'}
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-200/70 text-slate-700">
              {activeCols.length} of {columns.length || activeCols.length} Columns Included
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {activeView === 'structured'
              ? `Previewing extracted data with chosen columns: ${activeCols.slice(0, 4).join(', ')}${activeCols.length > 4 ? ` +${activeCols.length - 4} more` : ''}`
              : 'Real-time multi-column directory card preview with custom font colors & box borders.'}
          </p>
        </div>

        {/* View Switcher */}
        <div className="flex items-center bg-slate-200/80 p-1 rounded-xl">
          <button
            onClick={() => setActiveView('structured')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeView === 'structured'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Table className="w-3.5 h-3.5 text-emerald-600" />
            Selected Columns Table ({activeCols.length})
          </button>
          <button
            onClick={() => setActiveView('directory')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeView === 'directory'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Columns2 className="w-3.5 h-3.5 text-emerald-600" />
            {columnsCount}-Col Directory Cards
          </button>
        </div>
      </div>

      {/* Control Toolbar */}
      <div className="px-4 sm:px-6 py-3 bg-white border-b border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 no-print">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            placeholder={`Search across ${activeCols.length} columns...`}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 bg-slate-50/50 focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200 outline-none"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onAddNewRecord}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl shadow-2xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-600" />
            Add Row
          </button>

          {/* Direct Print */}
          <button
            onClick={handleBrowserPrint}
            title="Print directly or save as PDF via system print dialog"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl transition-colors"
          >
            <Printer className="w-3.5 h-3.5 text-slate-700" />
            Print
          </button>

          {/* PDF Download Button */}
          <button
            onClick={() => triggerExport(activeView === 'directory' ? onGenerateDirectoryPDF : onGenerateStructuredPDF, 'PDF')}
            disabled={isExporting || filteredRecords.length === 0 || activeCols.length === 0}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-800 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl transition-colors"
          >
            <FileText className="w-3.5 h-3.5 text-red-600" />
            PDF
          </button>

          {/* Primary Excel Download Button */}
          <button
            onClick={() => triggerExport(activeView === 'directory' ? onGenerateDirectoryExcel : onGenerateStructuredExcel, 'Excel')}
            disabled={isExporting || filteredRecords.length === 0 || activeCols.length === 0}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 disabled:opacity-50 rounded-xl shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            {isExporting ? 'Generating Excel...' : activeView === 'directory' ? `Generate Excel (${columnsCount} Col)` : `Generate Excel (${activeCols.length} Columns)`}
          </button>

          {/* More Formats Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="p-2 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl transition-colors"
              title="More Formats"
            >
              <ChevronDown className="w-4 h-4" />
            </button>

            {showExportMenu && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-100 text-xs">
                <div className="px-3.5 py-1 font-bold text-[10px] text-slate-400 uppercase tracking-wider">
                  Excel Workbooks (.xlsx)
                </div>
                <button
                  onClick={() => triggerExport(onGenerateStructuredExcel, 'Selected Columns Excel')}
                  className="w-full text-left px-3.5 py-2 hover:bg-emerald-50 text-slate-700 hover:text-emerald-900 flex items-center gap-2.5"
                >
                  <Table className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <div>
                    <div className="font-semibold">Selected Columns Excel (.xlsx)</div>
                    <div className="text-[10px] text-slate-400">Only {activeCols.length} selected columns included</div>
                  </div>
                </button>
                <button
                  onClick={() => triggerExport(onGenerateDirectoryExcel, 'Directory Excel')}
                  className="w-full text-left px-3.5 py-2 hover:bg-emerald-50 text-slate-700 hover:text-emerald-900 flex items-center gap-2.5"
                >
                  <Columns2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <div>
                    <div className="font-semibold">{columnsCount}-Column Directory (.xlsx)</div>
                    <div className="text-[10px] text-slate-400">{columnsCount} blocks per row with Box Borders</div>
                  </div>
                </button>
                <button
                  onClick={() => triggerExport(onGenerateCombinedExcel, 'Combined Workbook')}
                  className="w-full text-left px-3.5 py-2 hover:bg-emerald-50 text-slate-700 hover:text-emerald-900 flex items-center gap-2.5"
                >
                  <Layers className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <div>
                    <div className="font-semibold">Combined Multi-Sheet (.xlsx)</div>
                    <div className="text-[10px] text-slate-400">Both Selected Table &amp; Directory sheets</div>
                  </div>
                </button>

                <div className="border-t border-slate-100 my-1.5"></div>

                <div className="px-3.5 py-1 font-bold text-[10px] text-slate-400 uppercase tracking-wider">
                  PDF Documents (.pdf)
                </div>
                <button
                  onClick={() => triggerExport(onGenerateDirectoryPDF, 'Directory PDF')}
                  className="w-full text-left px-3.5 py-2 hover:bg-red-50 text-slate-700 hover:text-red-900 flex items-center gap-2.5"
                >
                  <FileText className="w-4 h-4 text-red-600 flex-shrink-0" />
                  <div>
                    <div className="font-semibold">{columnsCount}-Column Directory PDF (.pdf)</div>
                    <div className="text-[10px] text-slate-400">Multi-page vector PDF with box borders</div>
                  </div>
                </button>
                <button
                  onClick={() => triggerExport(onGenerateStructuredPDF, 'Structured PDF')}
                  className="w-full text-left px-3.5 py-2 hover:bg-red-50 text-slate-700 hover:text-red-900 flex items-center gap-2.5"
                >
                  <Table className="w-4 h-4 text-red-600 flex-shrink-0" />
                  <div>
                    <div className="font-semibold">Structured Table (.pdf)</div>
                    <div className="text-[10px] text-slate-400">Tabular database print format</div>
                  </div>
                </button>

                <div className="border-t border-slate-100 my-1.5"></div>

                <button
                  onClick={() => {
                    setShowExportMenu(false);
                    onExportCSV();
                  }}
                  className="w-full text-left px-3.5 py-2 hover:bg-slate-100 text-slate-700 flex items-center gap-2.5"
                >
                  <FileCode className="w-4 h-4 text-slate-500 flex-shrink-0" />
                  <div className="font-semibold">Clean CSV (.csv)</div>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Preview Container */}
      {activeView === 'directory' ? (
        /* PRINT DIRECTORY VIEW WITH DYNAMIC N-COLUMN GRID & CUSTOM COLORS */
        <div className="p-4 sm:p-8 bg-slate-200/70 overflow-x-auto print-page-container">
          <div
            className={`mx-auto bg-white rounded-sm shadow-xl border border-slate-300/80 p-6 sm:p-8 text-slate-900 print-page-container ${
              columnsCount >= 4 ? 'max-w-7xl' : columnsCount === 3 ? 'max-w-5xl' : 'max-w-4xl'
            }`}
            style={{
              fontFamily: options.fontFamily === 'Arial' ? 'Arial, sans-serif' : options.fontFamily === 'Times New Roman' ? '"Times New Roman", serif' : options.fontFamily === 'Segoe UI' ? '"Segoe UI", sans-serif' : 'Calibri, sans-serif'
            }}
          >
            {/* Optional Title */}
            {options.showTitleBanner && (
              <div className="text-center font-bold text-base tracking-wide uppercase pb-4 mb-6 border-b border-slate-300">
                {options.sheetTitle || 'Business & Clinic Directory'}
              </div>
            )}

            {/* Dynamic Multi-Column Grid */}
            <div
              className={`grid ${options.includeBorders ? 'gap-0 border' : 'gap-3.5'}`}
              style={{
                gridTemplateColumns: `repeat(${columnsCount}, minmax(0, 1fr))`,
                borderColor: options.includeBorders ? borderColor : 'transparent'
              }}
            >
              {pageRecords.map((record) => (
                <div
                  key={record.id}
                  className={`group relative transition-all flex flex-col justify-between ${
                    options.includeBorders
                      ? 'p-3 bg-white border'
                      : 'p-1.5 hover:bg-slate-50/60 rounded-md'
                  }`}
                  style={{
                    borderColor: options.includeBorders ? borderColor : 'transparent'
                  }}
                >
                  {/* Floating Action Buttons */}
                  <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white/95 p-1 rounded-md border border-slate-200 shadow-xs flex items-center gap-1 z-10 no-print">
                    <button
                      onClick={() => copyToClipboard(`${record.name}\n${record.address}\n${record.phone}`, record.id)}
                      title="Copy record"
                      className="p-1 text-slate-500 hover:text-slate-800 rounded hover:bg-slate-100"
                    >
                      {copiedId === record.id ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    </button>
                    <button
                      onClick={() => onEditRecord(record)}
                      title="Edit"
                      className="p-1 text-slate-500 hover:text-blue-600 rounded hover:bg-blue-50"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => onDeleteRecord(record.id)}
                      title="Delete"
                      className="p-1 text-slate-500 hover:text-red-600 rounded hover:bg-red-50"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>

                  {(() => {
                    const fields = [];
                    if (selectedColumns && selectedColumns.length > 0) {
                      selectedColumns.forEach(colName => {
                        const val = record[colName] !== undefined && record[colName] !== null
                          ? String(record[colName]).trim()
                          : (record[colName.toLowerCase()] !== undefined && record[colName.toLowerCase()] !== null ? String(record[colName.toLowerCase()]).trim() : '');
                        if (val) {
                          fields.push({ colName, val });
                        }
                      });
                    } else {
                      if (record.name || record.Name) fields.push({ colName: 'Name', val: record.name || record.Name });
                      if (record.address || record.Address) fields.push({ colName: 'Address', val: record.address || record.Address });
                      if (record.phone || record['Contact No.'] || record['Phone Number']) fields.push({ colName: 'Phone', val: record.phone || record['Contact No.'] || record['Phone Number'] });
                    }

                    if (fields.length === 0) {
                      return <div className="text-xs text-slate-400 italic">No selected data</div>;
                    }

                    return (
                      <div className="flex flex-col flex-1 justify-between">
                        <div>
                          {fields.map((field, idx) => {
                            const isFirst = idx === 0;
                            const isLast = idx === fields.length - 1;
                            const isPhoneLike = /phone|contact|mobile|cell|tel|number/i.test(field.colName);
                            const isCgpaOrScore = /cgpa|score|grade|percent|rate/i.test(field.colName);
                            const alignClass = options.textAlign === 'left' ? 'text-left' : 'text-center';

                            let color = addressColor;
                            if (options[`color_${field.colName}`]) {
                              color = options[`color_${field.colName}`];
                            } else if (isFirst) {
                              color = nameColor;
                            } else if (isLast && (isPhoneLike || isCgpaOrScore || fields.length >= 2)) {
                              color = phoneColor;
                            }

                            if (isFirst) {
                              return (
                                <React.Fragment key={field.colName}>
                                  <div
                                    className={`leading-tight mb-1 font-bold text-left ${
                                      columnsCount >= 4 ? 'text-xs' : 'text-[13px]'
                                    }`}
                                    style={{ color }}
                                  >
                                    To,
                                  </div>
                                  <div
                                    className={`font-bold mb-1 leading-tight ${alignClass} ${
                                      columnsCount >= 4 ? 'text-xs' : 'text-[13px]'
                                    }`}
                                    style={{ color }}
                                  >
                                    {field.val}
                                  </div>
                                </React.Fragment>
                              );
                            }

                            if (isLast && (isPhoneLike || isCgpaOrScore || fields.length >= 2)) {
                              return (
                                <div
                                  key={field.colName}
                                  className={`font-bold tracking-tight mt-auto pt-1 ${alignClass} ${
                                    columnsCount >= 4 ? 'text-[10.5px]' : 'text-[11.5px]'
                                  }`}
                                  style={{ color }}
                                >
                                  {isPhoneLike && options.showPhoneLabel ? `Ph: ${field.val}` : field.val}
                                </div>
                              );
                            }

                            return (
                              <div
                                key={field.colName}
                                className={`leading-snug mb-1 whitespace-pre-line ${alignClass} ${
                                  columnsCount >= 4 ? 'text-[10px]' : 'text-[11px]'
                                }`}
                                style={{ color }}
                              >
                                {field.val}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}
                </div>

              ))}
            </div>

            {filteredRecords.length === 0 && (
              <div className="py-16 text-center text-slate-400">
                <FileSpreadsheet className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                <p className="text-sm font-semibold text-slate-600">No records found</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* STRUCTURED TABLE VIEW WITH DYNAMIC SELECTED COLUMNS */
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-emerald-900 text-white font-semibold">
                <th className="py-3 px-4 w-14 text-center border-r border-emerald-800">#</th>
                {activeCols.map((colName) => (
                  <th key={colName} className="py-3 px-4 border-r border-emerald-800 whitespace-nowrap">
                    {colName}
                  </th>
                ))}
                <th className="py-3 px-3 w-20 text-center no-print">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {pageRecords.map((record, index) => (
                <tr
                  key={record.id || index}
                  className={`hover:bg-emerald-50/40 transition-colors group ${
                    index % 2 === 1 ? 'bg-slate-50/60' : 'bg-white'
                  }`}
                >
                  <td className="py-3 px-4 text-center font-medium text-slate-500 border-r border-slate-200/80">
                    {startIndex + index + 1}
                  </td>
                  {activeCols.map((colName, colIdx) => {
                    const val = record[colName];
                    const isNameLike = colIdx === 0 || /name/i.test(colName);
                    const isPhoneLike = /phone|contact|mobile/i.test(colName);

                    return (
                      <td
                        key={colName}
                        className={`py-3 px-4 border-r border-slate-200/80 align-top ${
                          isNameLike ? 'font-bold' : isPhoneLike ? 'font-mono font-bold' : ''
                        }`}
                        style={{
                          color: isNameLike ? nameColor : isPhoneLike ? phoneColor : '#1E293B'
                        }}
                      >
                        {val !== undefined && val !== null && String(val).trim() !== '' ? (
                          String(val)
                        ) : (
                          <span className="text-slate-300 italic">--</span>
                        )}
                      </td>
                    );
                  })}
                  <td className="py-3 px-3 text-center align-top no-print">
                    <div className="flex items-center justify-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => {
                          const textToCopy = activeCols.map(c => `${c}: ${record[c] || ''}`).join('\n');
                          copyToClipboard(textToCopy, record.id);
                        }}
                        title="Copy record"
                        className="p-1 text-slate-500 hover:text-slate-800 rounded hover:bg-slate-200"
                      >
                        {copiedId === record.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        onClick={() => onEditRecord(record)}
                        title="Edit record"
                        className="p-1 text-slate-500 hover:text-blue-600 rounded hover:bg-blue-50"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteRecord(record.id)}
                        title="Delete record"
                        className="p-1 text-slate-500 hover:text-red-600 rounded hover:bg-red-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Footer */}
      <div className="px-4 sm:px-6 py-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600 no-print">
        <div className="flex items-center gap-3">
          <span>
            Showing <span className="font-bold text-slate-900">{filteredRecords.length > 0 ? startIndex + 1 : 0}</span> to <span className="font-bold text-slate-900">{Math.min(startIndex + effectivePageSize, filteredRecords.length)}</span> of <span className="font-bold text-slate-900">{filteredRecords.length}</span> records
          </span>
          <div className="flex items-center gap-1.5 ml-2">
            <span className="text-slate-400">View per page:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(e.target.value);
                setCurrentPage(1);
              }}
              className="px-2 py-1 rounded-md border border-slate-300 bg-white text-slate-800 font-medium focus:border-emerald-500 outline-none"
            >
              <option value={12}>12</option>
              <option value={24}>24</option>
              <option value={48}>48</option>
              <option value={96}>96</option>
              <option value="all">All ({filteredRecords.length})</option>
            </select>
          </div>
        </div>

        {/* Page navigation */}
        {totalPages > 1 && (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={validPage === 1}
              className="p-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white"
              title="First Page"
            >
              <ChevronsLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
              disabled={validPage === 1}
              className="p-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white"
              title="Previous Page"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            <span className="px-3 py-1 font-semibold text-slate-800 bg-white border border-slate-300 rounded-lg">
              Page {validPage} of {totalPages}
            </span>

            <button
              onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
              disabled={validPage === totalPages}
              className="p-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white"
              title="Next Page"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={validPage === totalPages}
              className="p-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white"
              title="Last Page"
            >
              <ChevronsRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
