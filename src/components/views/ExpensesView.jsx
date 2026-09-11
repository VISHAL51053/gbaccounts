import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Boxes, 
  Plus, 
  Search, 
  Trash2, 
  Filter, 
  Building, 
  Truck, 
  Calendar,
  Layers,
  FileCheck,
  Package
} from 'lucide-react';
import { formatINR, formatDate } from '../../utils/formatters';

export const ExpensesView = ({ onOpenNewExpense }) => {
  const { expenses, deleteExpense, projects } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedProject, setSelectedProject] = useState('All');

  const categories = ['All', 'Materials (Cement, Steel, Sand)', 'Labor & Wages', 'Subcontractor Works', 'Machinery & Fuel', 'Site Overheads'];

  const filteredExpenses = expenses.filter(exp => {
    const matchesSearch = 
      exp.item.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exp.vendor?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exp.billNumber?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;
    if (selectedCategory !== 'All' && exp.category !== selectedCategory) return false;
    if (selectedProject !== 'All' && exp.projectId !== selectedProject) return false;
    return true;
  });

  const totalFilteredAmount = filteredExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white m-0 tracking-tight">Raw Materials & Site Purchases</h2>
        </div>
        <button
          onClick={onOpenNewExpense}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm shadow-md shadow-amber-500/20 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" /> Add Material Purchase
        </button>
      </div>

      {/* Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-900/90 p-4 rounded-2xl border border-slate-800">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search material item, supplier, bill #..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full py-2 px-3 rounded-xl bg-slate-800 border border-slate-700 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-500"
          >
            {categories.map(c => (
              <option key={c} value={c}>{c === 'All' ? 'All Material & Cost Categories' : c}</option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="w-full py-2 px-3 rounded-xl bg-slate-800 border border-slate-700 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-500"
          >
            <option value="All">All Construction Sites / Projects</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Material Summary Banner */}
      <div className="flex items-center justify-between bg-slate-900/60 p-4 rounded-xl border border-slate-800 text-xs">
        <div className="flex items-center gap-2">
          <FileCheck className="w-4 h-4 text-amber-400" />
          <span className="text-slate-300">Showing <strong className="text-white">{filteredExpenses.length}</strong> material purchase records</span>
        </div>
        <div>
          <span className="text-slate-400 mr-2">Total Material Incurred:</span>
          <span className="font-bold text-base text-rose-400 font-mono">{formatINR(totalFilteredAmount)}</span>
        </div>
      </div>

      {/* Materials Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-[11px] uppercase tracking-wider text-slate-400 bg-slate-800/80 border-b border-slate-700">
              <tr>
                <th className="py-3.5 px-4 font-bold">Date</th>
                <th className="py-3.5 px-4 font-bold">Category</th>
                <th className="py-3.5 px-4 font-bold">Material / Description</th>
                <th className="py-3.5 px-4 font-bold">Site / Project</th>
                <th className="py-3.5 px-4 font-bold">Vendor / Supplier</th>
                <th className="py-3.5 px-4 font-bold">Bill # / Mode</th>
                <th className="py-3.5 px-4 font-bold text-right">Cost (₹)</th>
                <th className="py-3.5 px-4 font-bold text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 font-medium">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-8 text-center text-slate-400 text-sm">
                    No material records found. Click <strong>"+ Add Material Purchase"</strong> to log stock entries.
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 text-slate-300 whitespace-nowrap">{formatDate(exp.date)}</td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                        {exp.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-white max-w-xs">{exp.item}</div>
                      {exp.notes && <div className="text-[11px] text-slate-400 italic">{exp.notes}</div>}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-slate-200 font-semibold">{exp.projectName || 'General'}</span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">{exp.vendor || '-'}</td>
                    <td className="py-3.5 px-4">
                      <div className="text-slate-200 font-mono text-[11px]">{exp.billNumber || '-'}</div>
                      <div className="text-[10px] text-slate-400">{exp.paymentMode}</div>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-rose-400 text-right text-sm">
                      {formatINR(exp.amount)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => {
                          if (confirm(`Delete material purchase record "${exp.item}"?`)) {
                            deleteExpense(exp.id);
                          }
                        }}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/50 text-rose-400 transition-colors cursor-pointer"
                        title="Delete Entry"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
