/**
 * Color utility functions for Excel, PDF, and CSS rendering.
 */

/**
 * Converts Hex color string (#RRGGBB or #RGB) to RGB object { r, g, b }.
 */
export function hexToRgb(hex) {
  if (!hex) return { r: 15, g: 23, b: 42 };
  let clean = String(hex).replace('#', '').trim();
  if (clean.length === 3) {
    clean = clean.split('').map(c => c + c).join('');
  }
  if (clean.length !== 6) return { r: 15, g: 23, b: 42 };

  const num = parseInt(clean, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

/**
 * Converts Hex color to Excel ARGB format string (e.g. #0F172A -> FF0F172A).
 */
export function hexToArgb(hex, defaultArgb = 'FF0F172A') {
  if (!hex) return defaultArgb;
  let clean = String(hex).replace('#', '').trim().toUpperCase();
  if (clean.length === 3) {
    clean = clean.split('').map(c => c + c).join('');
  }
  if (clean.length === 6) {
    return 'FF' + clean;
  }
  if (clean.length === 8) {
    return clean;
  }
  return defaultArgb;
}

/**
 * Predefined popular color presets.
 */
export const PREDEFINED_COLORS = [
  { name: 'Dark Slate', hex: '#0F172A', bg: 'bg-slate-900' },
  { name: 'Royal Navy', hex: '#1E3A8A', bg: 'bg-blue-900' },
  { name: 'Ocean Blue', hex: '#0369A1', bg: 'bg-sky-700' },
  { name: 'Emerald Green', hex: '#065F46', bg: 'bg-emerald-800' },
  { name: 'Teal Green', hex: '#0F766E', bg: 'bg-teal-700' },
  { name: 'Ruby Crimson', hex: '#991B1B', bg: 'bg-red-800' },
  { name: 'Bright Red', hex: '#DC2626', bg: 'bg-red-600' },
  { name: 'Regal Purple', hex: '#581C87', bg: 'bg-purple-900' },
  { name: 'Violet', hex: '#7C3AED', bg: 'bg-violet-600' },
  { name: 'Burnt Amber', hex: '#B45309', bg: 'bg-amber-700' },
  { name: 'Warm Charcoal', hex: '#334155', bg: 'bg-slate-700' },
  { name: 'Jet Black', hex: '#000000', bg: 'bg-black' },
];

/**
 * Predefined full theme palettes.
 */
export const THEME_PALETTES = [
  {
    id: 'executive',
    name: 'Executive Slate',
    nameColor: '#0F172A',
    addressColor: '#334155',
    phoneColor: '#0369A1',
    borderColor: '#94A3B8',
  },
  {
    id: 'navy',
    name: 'Royal Navy',
    nameColor: '#1E3A8A',
    addressColor: '#1E293B',
    phoneColor: '#2563EB',
    borderColor: '#93C5FD',
  },
  {
    id: 'emerald',
    name: 'Forest Emerald',
    nameColor: '#065F46',
    addressColor: '#14532D',
    phoneColor: '#059669',
    borderColor: '#6EE7B7',
  },
  {
    id: 'crimson',
    name: 'Ruby Crimson',
    nameColor: '#991B1B',
    addressColor: '#450A0A',
    phoneColor: '#DC2626',
    borderColor: '#FCA5A5',
  },
  {
    id: 'purple',
    name: 'Regal Purple',
    nameColor: '#581C87',
    addressColor: '#3B0764',
    phoneColor: '#7C3AED',
    borderColor: '#D8B4FE',
  },
  {
    id: 'monochrome',
    name: 'Classic Monochrome',
    nameColor: '#000000',
    addressColor: '#262626',
    phoneColor: '#000000',
    borderColor: '#737373',
  },
];
