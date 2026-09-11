import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { X, Building2, MapPin, User } from 'lucide-react';

export const NewProjectModal = ({ isOpen, onClose }) => {
  const { addProject } = useApp();

  const [formData, setFormData] = useState({
    name: '',
    client: '',
    location: ''
  });

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Please enter a site name.');
      return;
    }

    addProject({
      name: formData.name.trim(),
      client: formData.client.trim() || 'Direct Client',
      location: formData.location.trim() || 'Site Location',
      budget: 0,
      spent: 0,
      progress: 10,
      status: 'In Progress',
      supervisor: 'Civil Engg'
    });

    setFormData({ name: '', client: '', location: '' });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4 my-auto">
        
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2 text-amber-400">
            <Building2 className="w-5 h-5" />
            <h3 className="text-base font-bold text-white">Add Construction Site / Project</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-400 mb-1 font-semibold">Site / Project Name *</label>
            <input
              type="text"
              required
              autoFocus
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. RK6 / Royal Palm Residency"
              className="w-full p-3 rounded-xl bg-slate-800 border border-slate-700 text-white font-bold text-sm focus:border-amber-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-400 mb-1 font-semibold">Client Name *</label>
            <input
              type="text"
              required
              value={formData.client}
              onChange={(e) => setFormData({ ...formData, client: e.target.value })}
              placeholder="e.g. RANGAMA KOVIL / Mr. Ramachandran"
              className="w-full p-3 rounded-xl bg-slate-800 border border-slate-700 text-white focus:border-amber-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-400 mb-1 font-semibold">Site Location *</label>
            <input
              type="text"
              required
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="e.g. INGUR / OMR Chennai"
              className="w-full p-3 rounded-xl bg-slate-800 border border-slate-700 text-white focus:border-amber-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shadow-lg shadow-amber-500/20 cursor-pointer"
            >
              Create Site
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
