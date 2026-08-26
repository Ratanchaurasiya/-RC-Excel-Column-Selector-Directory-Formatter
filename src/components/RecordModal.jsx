import React, { useState, useEffect } from 'react';
import { X, Save, Building2, MapPin, Phone, Plus, Layers } from 'lucide-react';

export default function RecordModal({ isOpen, onClose, onSave, record, columns = [] }) {
  const [formData, setFormData] = useState({});

  useEffect(() => {
    if (record) {
      setFormData({ ...record });
    } else {
      const initial = {};
      columns.forEach(col => {
        initial[col] = '';
      });
      initial.name = '';
      initial.address = '';
      initial.phone = '';
      setFormData(initial);
    }
  }, [record, isOpen, columns]);

  if (!isOpen) return null;

  const handleChange = (key, value) => {
    setFormData(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const savedData = {
      ...formData,
      id: record?.id || `rec_${Date.now()}`,
      name: formData.Name || formData.name || Object.values(formData)[0] || 'Unnamed',
      phone: formData['Contact No.'] || formData['Phone Number'] || formData.phone || '',
      address: formData.Address || formData.address || '',
    };

    onSave(savedData);
    onClose();
  };

  const activeFields = columns && columns.length > 0
    ? columns
    : ['Name', 'Address', 'Phone Number'];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            {record ? <Building2 className="w-4 h-4 text-emerald-600" /> : <Plus className="w-4 h-4 text-emerald-600" />}
            {record ? 'Edit Record' : 'Add New Record'}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-sm overflow-y-auto flex-1">
          {activeFields.map((field, idx) => {
            const isAddress = /address|location/i.test(field);
            const val = formData[field] ?? '';

            return (
              <div key={field}>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-slate-500" />
                  {field} {idx === 0 && '*'}
                </label>
                {isAddress ? (
                  <textarea
                    rows={2}
                    value={val}
                    onChange={(e) => handleChange(field, e.target.value)}
                    placeholder={`Enter ${field}...`}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none text-slate-800 text-xs"
                  />
                ) : (
                  <input
                    type="text"
                    required={idx === 0}
                    value={val}
                    onChange={(e) => handleChange(field, e.target.value)}
                    placeholder={`Enter ${field}...`}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none text-xs text-slate-800"
                  />
                )}
              </div>
            );
          })}

          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors"
            >
              <Save className="w-3.5 h-3.5" />
              Save Record
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

