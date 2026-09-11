import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { X, Boxes, Building, Truck, DollarSign, Package } from 'lucide-react';

export const NewExpenseModal = ({ isOpen, onClose }) => {
  const { projects, vendors, addExpense, accounts } = useApp();

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [projectId, setProjectId] = useState(projects[0]?.id || '');
  const [category, setCategory] = useState('Raw Materials');
  const [item, setItem] = useState('');
  const [vendor, setVendor] = useState(vendors[0]?.name || '');
  const [amount, setAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState(accounts[0]?.name || 'Primary Bank Current Account');
  const [billNumber, setBillNumber] = useState('');
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!item || !amount || Number(amount) <= 0) {
      alert('Please fill in valid material description and amount.');
      return;
    }

    const proj = projects.find(p => p.id === projectId);

    addExpense({
      date,
      projectId,
      projectName: proj ? proj.name : 'General Overhead',
      category,
      item,
      vendor,
      amount: Number(amount),
      taxAmount: Math.round(Number(amount) * 0.18),
      paymentMode,
      billNumber: billNumber || `MAT-${Date.now().toString().slice(-5)}`,
      notes
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl p-6 shadow-2xl space-y-4 my-auto">
        
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-white">Add Raw Material / Procurement Entry</h3>
            <p className="text-xs text-slate-400">Log cement, steel, sand, aggregates, bricks, electricals or equipment fuel</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 mb-1 font-semibold">Purchase Date *</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1 font-semibold">Material / Cost Category *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white"
              >
                <option value="Raw Materials">Raw Materials (Cement, TMT Steel, Sand, Bricks)</option>
                <option value="Electrical & Plumbing">Electricals & Plumbing Pipes</option>
                <option value="Finishing Materials">Flooring, Marble, Tiles & Paints</option>
                <option value="Machinery & Fuel">Machinery Rental, Fuel & JCB</option>
                <option value="Labor & Wages">Labor Contractor & Wages</option>
                <option value="Subcontractor">Subcontractor Works</option>
                <option value="Site Overheads">Site Admin & Safety Gear</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-400 mb-1 font-semibold">Associated Site / Project *</label>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white"
            >
              {projects.length === 0 ? (
                <option value="">No sites created yet (General Site)</option>
              ) : (
                projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.location})</option>
                ))
              )}
            </select>
          </div>

          <div>
            <label className="block text-slate-400 mb-1 font-semibold">Material Item & Quantity *</label>
            <input
              type="text"
              required
              value={item}
              onChange={(e) => setItem(e.target.value)}
              placeholder="e.g. 53 Grade OPC Cement (500 Bags) or 16mm TMT Steel (10 MT)"
              className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white font-semibold text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 mb-1 font-semibold">Vendor / Supplier Name</label>
              <input
                type="text"
                value={vendor}
                onChange={(e) => setVendor(e.target.value)}
                placeholder="e.g. Sri Balaji Steel Corp"
                className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1 font-semibold">Challan / Bill Ref #</label>
              <input
                type="text"
                value={billNumber}
                onChange={(e) => setBillNumber(e.target.value)}
                placeholder="e.g. DC-9912 / INV-4401"
                className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 mb-1 font-semibold">Total Cost Amount (₹) *</label>
              <input
                type="number"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter total cost"
                className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-amber-400 font-black text-base font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1 font-semibold">Payment Mode / Account</label>
              <select
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white"
              >
                {accounts.map(a => (
                  <option key={a.id} value={a.name}>{a.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-400 mb-1 font-semibold">Site Delivery Remarks / QC Note</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Material received at site, test certificate verified by site engineer"
              className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white"
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
              className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shadow-lg shadow-amber-500/20 cursor-pointer"
            >
              Save Material Entry
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
