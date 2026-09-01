import React, { useState } from 'react';
import {
  CopyX, CheckCircle2, AlertCircle, ChevronDown, ChevronUp,
  Download, Search, ShieldCheck, ShieldAlert, Check, FileSpreadsheet, Eye
} from 'lucide-react';
import { exportDuplicatesCSV } from '../utils/duplicateUtils';

export default function DuplicateManager({
  removeDuplicates,
  onToggleRemoveDuplicates,
  duplicateAnalysis,
  columns = [],
  uploadedFileName = 'Dataset'
}) {
  const {
    totalRaw = 0,
    duplicateCount = 0,
    uniqueCount = 0,
    duplicateItems = []
  } = duplicateAnalysis || {};

  // Default to expanded whenever duplicates exist so the user immediately sees them
  const [isExpanded, setIsExpanded] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'compare'

  const filteredDuplicates = duplicateItems.filter(item => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const dRec = item.duplicateRecord || {};
    return Object.values(dRec).some(val => val !== undefined && val !== null && String(val).toLowerCase().includes(term))
      || (item.matchReason && item.matchReason.toLowerCase().includes(term));
  });

  const handleExportDuplicates = () => {
    exportDuplicatesCSV(duplicateItems, `${uploadedFileName}_Duplicate_Records_Found.csv`);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 mb-6 shadow-sm">
      {/* Top Header: Title & Prominent ON/OFF Control */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold flex-shrink-0 ${
            removeDuplicates
              ? 'bg-emerald-100 text-emerald-700'
              : 'bg-slate-100 text-slate-600'
          }`}>
            {removeDuplicates ? <ShieldCheck className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5 text-amber-600" />}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-bold text-slate-900">
                Duplicate Records &amp; Values Inspector
              </h3>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                removeDuplicates
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  : 'bg-amber-100 text-amber-800 border border-amber-200'
              }`}>
                {removeDuplicates ? 'AUTO-CLEAN: ON' : 'PRESERVE ALL: OFF'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Inspect detected duplicate entries, compare duplicate values with original rows, and toggle removal.
            </p>
          </div>
        </div>

        {/* Visual ON / OFF Toggle Button */}
        <div className="flex items-center gap-3 self-start md:self-auto">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Remove Duplicates:
          </span>
          
          <div className="inline-flex items-center bg-slate-200/90 p-1 rounded-xl shadow-inner border border-slate-300/60">
            <button
              onClick={() => onToggleRemoveDuplicates(true)}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                removeDuplicates
                  ? 'bg-emerald-600 text-white shadow-sm scale-102'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-300/40'
              }`}
              title="Detect and remove duplicate records from final output"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              ON
            </button>
            <button
              onClick={() => onToggleRemoveDuplicates(false)}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                !removeDuplicates
                  ? 'bg-slate-800 text-white shadow-sm scale-102'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-300/40'
              }`}
              title="Keep all original records, do not remove any duplicates"
            >
              <CopyX className="w-3.5 h-3.5" />
              OFF
            </button>
          </div>
        </div>
      </div>

      {/* Summary Stat Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 pb-3 text-xs">
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
          <span className="text-slate-500 font-medium block text-[11px] uppercase tracking-wider">Total Records</span>
          <span className="text-lg font-extrabold text-slate-900 mt-0.5 block">{totalRaw.toLocaleString()}</span>
          <span className="text-[10px] text-slate-400">Uploaded dataset</span>
        </div>

        <div className="bg-amber-50/70 p-3 rounded-xl border border-amber-200">
          <span className="text-amber-700 font-medium block text-[11px] uppercase tracking-wider">Duplicates Found</span>
          <span className="text-lg font-extrabold text-amber-900 mt-0.5 block">{duplicateCount.toLocaleString()}</span>
          <span className="text-[10px] text-amber-600">Matching criteria</span>
        </div>

        <div className={`p-3 rounded-xl border transition-colors ${
          removeDuplicates ? 'bg-red-50/60 border-red-200' : 'bg-slate-50 border-slate-200'
        }`}>
          <span className="text-slate-500 font-medium block text-[11px] uppercase tracking-wider">Records Removed</span>
          <span className={`text-lg font-extrabold mt-0.5 block ${removeDuplicates ? 'text-red-600' : 'text-slate-400'}`}>
            {removeDuplicates ? duplicateCount.toLocaleString() : '0'}
          </span>
          <span className="text-[10px] text-slate-400">
            {removeDuplicates ? 'Excluded from output' : 'Removal disabled'}
          </span>
        </div>

        <div className="bg-emerald-50/70 p-3 rounded-xl border border-emerald-200">
          <span className="text-emerald-700 font-medium block text-[11px] uppercase tracking-wider">Active Output Records</span>
          <span className="text-lg font-extrabold text-emerald-900 mt-0.5 block">
            {(removeDuplicates ? uniqueCount : totalRaw).toLocaleString()}
          </span>
          <span className="text-[10px] text-emerald-600">
            {removeDuplicates ? 'Unique records only' : 'All records preserved'}
          </span>
        </div>
      </div>

      {/* Status Notice Banner */}
      <div className={`p-3.5 rounded-xl border text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
        removeDuplicates
          ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
          : 'bg-amber-50/80 border-amber-200 text-amber-900'
      }`}>
        <div className="flex items-center gap-2">
          {removeDuplicates ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
          )}
          <span>
            {removeDuplicates ? (
              <>
                <strong>Duplicate removal is ON:</strong> {duplicateCount > 0 ? `${duplicateCount} duplicate record${duplicateCount === 1 ? '' : 's'} removed from the final output.` : 'No duplicate records detected in dataset.'}
              </>
            ) : (
              <>
                <strong>Duplicate removal is OFF:</strong> no duplicate records were removed. All {totalRaw} records are included in preview and exports.
              </>
            )}
          </span>
        </div>

        {duplicateCount > 0 && (
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                isExpanded
                  ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                  : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              {isExpanded ? 'Hide' : 'Show'} Duplicate Values ({duplicateCount})
              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={handleExportDuplicates}
              title="Download full audit report of detected duplicate records as CSV"
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-white hover:bg-slate-100 text-slate-700 border border-slate-300"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              CSV
            </button>
          </div>
        )}
      </div>

      {/* DEDICATED SECTION TO SEE DUPLICATE VALUES */}
      {isExpanded && duplicateCount > 0 && (
        <div className="mt-4 pt-4 border-t border-slate-200 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3">
            <div>
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <CopyX className="w-4 h-4 text-amber-600" />
                Duplicate Values Found ({duplicateCount})
              </h4>
              <p className="text-xs text-slate-500">
                Detailed side-by-side view of duplicated records vs their original match.
              </p>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              {/* View Switcher: Table vs Side-by-Side Comparison */}
              <div className="inline-flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
                <button
                  onClick={() => setViewMode('table')}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                    viewMode === 'table' ? 'bg-white shadow-2xs text-slate-900 font-bold' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Table View
                </button>
                <button
                  onClick={() => setViewMode('compare')}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                    viewMode === 'compare' ? 'bg-white shadow-2xs text-slate-900 font-bold' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Side-by-Side Comparison
                </button>
              </div>

              {/* Search filter within duplicates */}
              <div className="relative flex-1 sm:w-56">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Filter duplicate values..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:border-emerald-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* VIEW MODE 1: DETAILED AUDIT TABLE */}
          {viewMode === 'table' ? (
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100/90 text-slate-700 font-semibold border-b border-slate-200">
                    <th className="py-2.5 px-3 w-16 text-center">Row #</th>
                    <th className="py-2.5 px-3">Duplicate Record Values</th>
                    <th className="py-2.5 px-3">Detection Reason</th>
                    <th className="py-2.5 px-3">Original Match</th>
                    <th className="py-2.5 px-3 text-center">Matched Fields</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredDuplicates.map((item, idx) => {
                    const dRec = item.duplicateRecord || {};
                    const oRec = item.originalRecord || {};

                    const dName = dRec.name || dRec.Name || Object.values(dRec)[0] || 'Unnamed';
                    const dPhone = dRec.phone || dRec['Phone Number'] || dRec['Contact No.'] || '';
                    const dAddr = dRec.address || dRec.Address || '';

                    const oName = oRec.name || oRec.Name || Object.values(oRec)[0] || 'Unnamed';
                    const oPhone = oRec.phone || oRec['Phone Number'] || oRec['Contact No.'] || '';

                    return (
                      <tr key={item.id || idx} className="hover:bg-amber-50/40 transition-colors bg-white">
                        {/* Duplicate Row Number */}
                        <td className="py-2.5 px-3 text-center font-mono font-bold text-amber-900 bg-amber-50/50">
                          #{item.duplicateIndex}
                        </td>

                        {/* Duplicate Content */}
                        <td className="py-2.5 px-3">
                          <div className="font-bold text-slate-900 flex items-center gap-2">
                            <span>{dName}</span>
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                              DUPLICATE
                            </span>
                          </div>
                          {dAddr && <div className="text-[11px] text-slate-500 truncate max-w-xs">{dAddr}</div>}
                          {dPhone && <div className="text-[11px] font-mono font-semibold text-slate-700">{dPhone}</div>}
                        </td>

                        {/* Match Reason */}
                        <td className="py-2.5 px-3">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-100 text-amber-900 border border-amber-200">
                            {item.matchReason}
                          </span>
                        </td>

                        {/* Matched Original Record */}
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded border border-emerald-200">
                              Row #{item.originalIndex}
                            </span>
                            <span className="text-slate-700 font-medium truncate max-w-[180px]">
                              {oName} {oPhone ? `(${oPhone})` : ''}
                            </span>
                          </div>
                        </td>

                        {/* Matched Fields Badges */}
                        <td className="py-2.5 px-3 text-center">
                          <div className="flex flex-wrap items-center justify-center gap-1">
                            {(item.matchedFields || []).map(f => (
                              <span key={f} className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-red-100 text-red-800 border border-red-200">
                                {f}
                              </span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            /* VIEW MODE 2: SIDE-BY-SIDE CARD COMPARISON */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredDuplicates.map((item, idx) => {
                const dRec = item.duplicateRecord || {};
                const oRec = item.originalRecord || {};

                return (
                  <div key={item.id || idx} className="rounded-xl border border-amber-200 bg-amber-50/20 p-3.5 text-xs shadow-2xs">
                    <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-amber-200/70">
                      <span className="font-bold text-amber-900 flex items-center gap-1.5">
                        <CopyX className="w-3.5 h-3.5 text-amber-600" />
                        Match #{idx + 1}: {item.matchReason}
                      </span>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-amber-100 text-amber-900 rounded-full border border-amber-200">
                        Duplicate Row #{item.duplicateIndex}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {/* Original Record Card */}
                      <div className="bg-emerald-50/60 p-2.5 rounded-lg border border-emerald-200">
                        <div className="font-bold text-emerald-900 mb-1 flex items-center justify-between text-[11px]">
                          <span>Original (Row #{item.originalIndex})</span>
                          <span className="text-[9px] bg-emerald-200/80 text-emerald-900 px-1 py-0.2 rounded font-mono">Kept</span>
                        </div>
                        <div className="space-y-1 text-[11px] text-slate-700">
                          <div><strong>Name:</strong> {oRec.name || oRec.Name || '—'}</div>
                          <div><strong>Phone:</strong> {oRec.phone || oRec['Contact No.'] || oRec['Phone Number'] || '—'}</div>
                          <div className="truncate"><strong>Addr:</strong> {oRec.address || oRec.Address || '—'}</div>
                        </div>
                      </div>

                      {/* Duplicate Record Card */}
                      <div className="bg-red-50/60 p-2.5 rounded-lg border border-red-200">
                        <div className="font-bold text-red-900 mb-1 flex items-center justify-between text-[11px]">
                          <span>Duplicate (Row #{item.duplicateIndex})</span>
                          <span className="text-[9px] bg-red-200/80 text-red-900 px-1 py-0.2 rounded font-mono">
                            {removeDuplicates ? 'Removed' : 'Preserved'}
                          </span>
                        </div>
                        <div className="space-y-1 text-[11px] text-slate-700">
                          <div className={item.matchedFields?.includes('Name') ? 'text-red-700 font-bold bg-red-100/70 px-1 rounded' : ''}>
                            <strong>Name:</strong> {dRec.name || dRec.Name || '—'}
                          </div>
                          <div className={item.matchedFields?.includes('Phone') ? 'text-red-700 font-bold bg-red-100/70 px-1 rounded' : ''}>
                            <strong>Phone:</strong> {dRec.phone || dRec['Contact No.'] || dRec['Phone Number'] || '—'}
                          </div>
                          <div className={`truncate ${item.matchedFields?.includes('Address') ? 'text-red-700 font-bold bg-red-100/70 px-1 rounded' : ''}`}>
                            <strong>Addr:</strong> {dRec.address || dRec.Address || '—'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
