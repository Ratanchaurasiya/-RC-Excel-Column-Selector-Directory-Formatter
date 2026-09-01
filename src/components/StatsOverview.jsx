import React from 'react';
import { Database, CheckCircle2, CopyX, Columns2 } from 'lucide-react';

export default function StatsOverview({ stats, recordsCount, columnsCount = 3, removeDuplicates = true }) {
  const cards = [
    {
      label: 'Total Records Detected',
      value: (stats?.totalRaw || recordsCount).toLocaleString(),
      subtext: 'From source workbook',
      icon: Database,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      border: 'border-blue-200',
    },
    {
      label: 'Duplicates Removed',
      value: removeDuplicates ? (stats?.duplicatesRemoved || 0).toLocaleString() : '0',
      subtext: removeDuplicates ? `${stats?.duplicatesRemoved || 0} duplicate(s) excluded` : 'Duplicate removal is OFF',
      icon: CopyX,
      color: removeDuplicates && (stats?.duplicatesRemoved > 0) ? 'text-amber-600' : 'text-slate-400',
      bg: removeDuplicates && (stats?.duplicatesRemoved > 0) ? 'bg-amber-50' : 'bg-slate-50',
      border: removeDuplicates && (stats?.duplicatesRemoved > 0) ? 'border-amber-200' : 'border-slate-200',
    },
    {
      label: 'Active Output Records',
      value: recordsCount.toLocaleString(),
      subtext: 'Ready for Excel & PDF export',
      icon: CheckCircle2,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
    },
    {
      label: 'Directory Layout',
      value: `${columnsCount} Columns`,
      subtext: `${Math.ceil(recordsCount / (columnsCount || 3))} rows (Contiguous Grid)`,
      icon: Columns2,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
      border: 'border-purple-200',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className={`bg-white rounded-xl p-4 border ${card.border} shadow-xs flex items-center justify-between transition-all hover:shadow-md`}
          >
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{card.label}</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-extrabold text-slate-900">{card.value}</span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">{card.subtext}</p>
            </div>
            <div className={`w-12 h-12 rounded-xl ${card.bg} ${card.color} flex items-center justify-center flex-shrink-0`}>
              <Icon className="w-6 h-6" />
            </div>
          </div>
        );
      })}
    </div>
  );
}
