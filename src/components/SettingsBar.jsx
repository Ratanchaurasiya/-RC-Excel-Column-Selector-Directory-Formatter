import React, { useState } from 'react';
import {
  SlidersHorizontal, BookOpen, Layers, LayoutGrid, Palette, FileText, Download,
  Sparkles, Check, ChevronDown, ChevronUp, RefreshCw, Eye, AlignCenter, Square
} from 'lucide-react';
import { PREDEFINED_COLORS, THEME_PALETTES } from '../utils/colorUtils';

export default function SettingsBar({ options, setOptions, onGenerateExcel, isGenerating, selectedColumns = [] }) {
  const columnOptions = [1, 2, 3, 4, 5];
  const [showColorPanel, setShowColorPanel] = useState(true);

  const activeCols = selectedColumns && selectedColumns.length > 0 ? selectedColumns : ['Name', 'Address', 'Phone Number'];

  // Dynamically build color sections based on selected columns + box border
  const colorSections = [
    ...activeCols.map((col, idx) => {
      const isFirst = idx === 0;
      const isLast = idx === activeCols.length - 1;
      const isPhoneLike = /phone|contact|mobile|cell|tel|number/i.test(col);
      const isCgpaOrScore = /cgpa|score|grade|percent|rate/i.test(col);

      let defaultColor = '#334155';
      if (isFirst) {
        defaultColor = '#0F172A';
      } else if (isLast && (isPhoneLike || isCgpaOrScore || activeCols.length >= 2)) {
        defaultColor = '#0F172A';
      }

      return {
        key: col,
        label: `${col} Text`,
        prop: `color_${col}`,
        default: defaultColor
      };
    }),
    { key: 'border', label: 'Box Border', prop: 'borderColor', default: '#334155' }
  ];

  const [activeColorSection, setActiveColorSection] = useState(colorSections[0]?.key || 'border');

  // Adjust active color section if it is no longer valid
  const currentSectionIndex = colorSections.findIndex(s => s.key === activeColorSection);
  const currentSection = currentSectionIndex !== -1 ? colorSections[currentSectionIndex] : colorSections[0];

  const currentColor = options[currentSection.prop] || currentSection.default;

  const handleColorChange = (hex) => {
    setOptions(prev => ({
      ...prev,
      [currentSection.prop]: hex
    }));
  };

  const applyThemePalette = (palette) => {
    const updated = {
      ...options,
      nameColor: palette.nameColor,
      addressColor: palette.addressColor,
      phoneColor: palette.phoneColor,
      borderColor: palette.borderColor,
    };
    
    activeCols.forEach((col, idx) => {
      const isFirst = idx === 0;
      const isLast = idx === activeCols.length - 1;
      const isPhoneLike = /phone|contact|mobile|cell|tel|number/i.test(col);
      const isCgpaOrScore = /cgpa|score|grade|percent|rate/i.test(col);

      if (isFirst) {
        updated[`color_${col}`] = palette.nameColor;
      } else if (isLast && (isPhoneLike || isCgpaOrScore || activeCols.length >= 2)) {
        updated[`color_${col}`] = palette.phoneColor;
      } else {
        updated[`color_${col}`] = palette.addressColor;
      }
    });

    setOptions(updated);
  };

  const resetColorsToDefault = () => {
    const updated = {
      ...options,
      nameColor: '#0F172A',
      addressColor: '#334155',
      phoneColor: '#0F172A',
      borderColor: '#334155',
    };

    activeCols.forEach((col, idx) => {
      const isFirst = idx === 0;
      const isLast = idx === activeCols.length - 1;
      const isPhoneLike = /phone|contact|mobile|cell|tel|number/i.test(col);
      const isCgpaOrScore = /cgpa|score|grade|percent|rate/i.test(col);

      if (isFirst) {
        updated[`color_${col}`] = '#0F172A';
      } else if (isLast && (isPhoneLike || isCgpaOrScore || activeCols.length >= 2)) {
        updated[`color_${col}`] = '#0F172A';
      } else {
        updated[`color_${col}`] = '#334155';
      }
    });

    setOptions(updated);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 mb-6 shadow-sm">
      {/* Top Banner: Columns Per Page Control & Primary Generate Button */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider whitespace-nowrap">
              Columns Per Page:
            </span>
          </div>

          {/* Segmented Button Group: [ 1 ] [ 2 ] [ 3 ] [ 4 ] [ 5 ] */}
          <div className="flex items-center bg-slate-200/80 p-1 rounded-xl shadow-inner">
            {columnOptions.map((num) => (
              <button
                key={num}
                onClick={() => setOptions(prev => ({ ...prev, columnsCount: num }))}
                className={`w-10 h-8 text-xs font-bold rounded-lg transition-all flex items-center justify-center ${
                  options.columnsCount === num
                    ? 'bg-emerald-600 text-white shadow-sm scale-105'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-slate-300/50'
                }`}
                title={`Format directory with ${num} ${num === 1 ? 'column' : 'columns'} per page`}
              >
                {num}
              </button>
            ))}
          </div>

          {/* Dropdown Selector: [Columns Per Page ▼] */}
          <div className="flex items-center gap-1.5 ml-1">
            <select
              value={options.columnsCount}
              onChange={(e) => setOptions(prev => ({ ...prev, columnsCount: Number(e.target.value) }))}
              className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-800 bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200 outline-none"
            >
              <option value={1}>1 Column Per Page</option>
              <option value={2}>2 Columns Per Page</option>
              <option value={3}>3 Columns Per Page</option>
              <option value={4}>4 Columns Per Page</option>
              <option value={5}>5 Columns Per Page</option>
            </select>
          </div>
        </div>

        {/* Generate Excel Button */}
        <button
          onClick={onGenerateExcel}
          disabled={isGenerating}
          className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 disabled:opacity-50 rounded-xl shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
        >
          <Download className="w-4 h-4" />
          {isGenerating ? 'Generating Excel...' : `Generate Excel (${options.columnsCount} Columns)`}
        </button>
      </div>

      {/* FONT COLOR & STYLING CUSTOMIZER SECTION */}
      <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Palette className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Font Color &amp; Theme Customizer
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={resetColorsToDefault}
              className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1 hover:underline"
              title="Reset all colors to default"
            >
              <RefreshCw className="w-3 h-3" />
              Reset Defaults
            </button>
            <button
              onClick={() => setShowColorPanel(!showColorPanel)}
              className="p-1 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-200 transition-colors"
            >
              {showColorPanel ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {showColorPanel && (
          <div className="space-y-4">
            {/* 1-Click Preset Theme Palettes */}
            <div>
              <div className="text-[11px] font-bold text-slate-600 mb-1.5 flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-amber-500" />
                Predefined Theme Palettes:
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                {THEME_PALETTES.map((theme) => {
                  const isActive =
                    options.nameColor === theme.nameColor &&
                    options.phoneColor === theme.phoneColor &&
                    options.borderColor === theme.borderColor;

                  return (
                    <button
                      key={theme.id}
                      onClick={() => applyThemePalette(theme)}
                      className={`p-2 rounded-xl border text-left transition-all ${
                        isActive
                          ? 'border-emerald-600 bg-emerald-50/50 shadow-xs ring-1 ring-emerald-500'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-1 mb-1.5">
                        <span className="w-3 h-3 rounded-full border border-slate-300 shadow-2xs" style={{ backgroundColor: theme.nameColor }} />
                        <span className="w-3 h-3 rounded-full border border-slate-300 shadow-2xs" style={{ backgroundColor: theme.addressColor }} />
                        <span className="w-3 h-3 rounded-full border border-slate-300 shadow-2xs" style={{ backgroundColor: theme.phoneColor }} />
                        <span className="w-3 h-3 rounded-full border border-slate-300 shadow-2xs" style={{ backgroundColor: theme.borderColor }} />
                      </div>
                      <div className="text-[11px] font-bold text-slate-800 truncate">{theme.name}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Individual Section Color Picker */}
            <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs">
              <div className="text-[11px] font-bold text-slate-600 mb-2">
                Select Section to Customize Color:
              </div>

              {/* Section Tabs */}
              <div className="flex flex-wrap gap-2 mb-3">
                {colorSections.map((sec) => {
                  const isSelected = currentSection.key === sec.key;
                  const colorVal = options[sec.prop] || sec.default;

                  return (
                    <button
                      key={sec.key}
                      onClick={() => setActiveColorSection(sec.key)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                        isSelected
                          ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                          : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                      }`}
                    >
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-white/60 shadow-2xs"
                        style={{ backgroundColor: colorVal }}
                      />
                      {sec.label}
                    </button>
                  );
                })}
              </div>

              {/* Controls for currently selected section */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-slate-100">
                {/* Predefined Color Swatches */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] font-semibold text-slate-500 mr-1">Predefined:</span>
                  {PREDEFINED_COLORS.map((c) => (
                    <button
                      key={c.hex}
                      onClick={() => handleColorChange(c.hex)}
                      title={`${c.name} (${c.hex})`}
                      className={`w-6 h-6 rounded-full border border-slate-300 flex items-center justify-center transition-transform hover:scale-110 shadow-2xs ${
                        currentColor.toLowerCase() === c.hex.toLowerCase()
                          ? 'ring-2 ring-emerald-500 ring-offset-1 scale-110'
                          : ''
                      }`}
                      style={{ backgroundColor: c.hex }}
                    >
                      {currentColor.toLowerCase() === c.hex.toLowerCase() && (
                        <Check className={`w-3 h-3 ${c.hex === '#000000' || c.hex === '#0F172A' || c.hex === '#1E3A8A' || c.hex === '#065F46' || c.hex === '#991B1B' || c.hex === '#581C87' ? 'text-white' : 'text-slate-900'}`} />
                      )}
                    </button>
                  ))}
                </div>

                {/* Color Picker Input & Hex */}
                <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-lg border border-slate-200">
                  <span className="text-[11px] font-bold text-slate-600 whitespace-nowrap">
                    Custom Color:
                  </span>
                  
                  {/* Native Color Picker */}
                  <div className="relative flex items-center">
                    <input
                      type="color"
                      value={currentColor}
                      onChange={(e) => handleColorChange(e.target.value)}
                      className="w-8 h-8 rounded-lg cursor-pointer border-0 bg-transparent p-0"
                      title="Click to open full spectrum color picker"
                    />
                  </div>

                  {/* Hex Text Input */}
                  <input
                    type="text"
                    value={currentColor}
                    onChange={(e) => handleColorChange(e.target.value)}
                    placeholder="#000000"
                    maxLength={7}
                    className="w-20 px-2 py-1 text-xs font-mono font-semibold rounded border border-slate-300 bg-white text-slate-800 focus:border-emerald-500 outline-none uppercase"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Additional Page & Format Settings */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3 text-xs pt-1">
        {/* Paper Size */}
        <div>
          <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1">
            <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
            Paper Size
          </label>
          <select
            value={options.pageSize}
            onChange={(e) => setOptions(prev => ({ ...prev, pageSize: e.target.value }))}
            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-slate-800 bg-white font-medium focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200 outline-none"
          >
            <option value="A4">A4 (Standard Sheet)</option>
            <option value="A3">A3 (Wide Sheet)</option>
            <option value="Letter">Letter</option>
            <option value="Legal">Legal</option>
          </select>
        </div>

        {/* Orientation */}
        <div>
          <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1">
            <Layers className="w-3.5 h-3.5 text-blue-600" />
            Orientation
          </label>
          <select
            value={options.orientation}
            onChange={(e) => setOptions(prev => ({ ...prev, orientation: e.target.value }))}
            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-slate-800 bg-white font-medium focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200 outline-none"
          >
            <option value="portrait">Portrait (Vertical)</option>
            <option value="landscape">Landscape (Horizontal)</option>
          </select>
        </div>

        {/* Box Borders */}
        <div>
          <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1">
            <LayoutGrid className="w-3.5 h-3.5 text-amber-600" />
            Box Borders
          </label>
          <select
            value={options.includeBorders ? 'true' : 'false'}
            onChange={(e) => setOptions(prev => ({ ...prev, includeBorders: e.target.value === 'true' }))}
            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-slate-800 bg-white font-medium focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200 outline-none"
          >
            <option value="true">Include Box Borders</option>
            <option value="false">No Box Borders</option>
          </select>
        </div>

        {/* Border Color */}
        <div>
          <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1">
            <Square className="w-3.5 h-3.5 text-slate-700" />
            Border Color
          </label>
          <div className="flex items-center gap-1.5">
            <input
              type="color"
              value={options.borderColor || '#334155'}
              onChange={(e) => setOptions(prev => ({ ...prev, borderColor: e.target.value }))}
              className="w-7 h-7 rounded-lg border border-slate-300 cursor-pointer bg-white p-0.5"
              title="Choose Border Color (Excel, PDF & Live Preview)"
            />
            <input
              type="text"
              value={options.borderColor || '#334155'}
              onChange={(e) => setOptions(prev => ({ ...prev, borderColor: e.target.value }))}
              maxLength={7}
              className="w-full px-2 py-1 text-xs font-mono font-semibold rounded-lg border border-slate-300 bg-white text-slate-800 focus:border-emerald-500 outline-none uppercase"
            />
          </div>
        </div>

        {/* Text Alignment */}
        <div>
          <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1">
            <AlignCenter className="w-3.5 h-3.5 text-indigo-600" />
            Text Alignment
          </label>
          <select
            value={options.textAlign || 'center'}
            onChange={(e) => setOptions(prev => ({ ...prev, textAlign: e.target.value }))}
            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-slate-800 bg-white font-medium focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200 outline-none"
          >
            <option value="center">Center Aligned (Standard)</option>
            <option value="left">Left Aligned</option>
          </select>
        </div>

        {/* Font Family */}
        <div>
          <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1">
            <Palette className="w-3.5 h-3.5 text-slate-600" />
            Font Family
          </label>
          <select
            value={options.fontFamily}
            onChange={(e) => setOptions(prev => ({ ...prev, fontFamily: e.target.value }))}
            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-slate-800 bg-white font-medium focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200 outline-none"
          >
            <option value="Calibri">Calibri</option>
            <option value="Arial">Arial</option>
            <option value="Segoe UI">Segoe UI</option>
            <option value="Times New Roman">Times New Roman</option>
          </select>
        </div>

        {/* Header Title */}
        <div>
          <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1">
            <FileText className="w-3.5 h-3.5 text-teal-600" />
            Sheet Title Banner
          </label>
          <select
            value={options.showTitleBanner ? 'show' : 'hide'}
            onChange={(e) => setOptions(prev => ({ ...prev, showTitleBanner: e.target.value === 'show' }))}
            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-slate-800 bg-white font-medium focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200 outline-none"
          >
            <option value="hide">Hide Title Banner</option>
            <option value="show">Show Title Banner</option>
          </select>
        </div>
      </div>
    </div>
  );
}
