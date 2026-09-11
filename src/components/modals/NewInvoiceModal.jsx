import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Plus, Trash2, X, Calculator, Building } from 'lucide-react';
import { formatINR } from '../../utils/formatters';

export const NewInvoiceModal = ({ isOpen, onClose }) => {
  const { projects, addInvoice } = useApp();

  const [projectId, setProjectId] = useState(projects[0]?.id || '');
  const [clientName, setClientName] = useState(projects[0]?.client || '');
  const [clientPhone, setClientPhone] = useState(projects[0]?.clientPhone || '');
  const [clientAddress, setClientAddress] = useState(projects[0]?.location || '');
  const [invoiceNumber, setInvoiceNumber] = useState(`GB/2026/${Math.floor(100 + Math.random() * 900)}`);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState(new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0]);
  const [taxRate, setTaxRate] = useState(18);
  const [paidAmount, setPaidAmount] = useState(0);
  const [paymentMode, setPaymentMode] = useState('SBI RTGS');

  const [items, setItems] = useState([
    { description: 'RCC Slab Concreting (Stage 3)', qty: 1500, unit: 'Sq.Ft', rate: 450, amount: 675000 }
  ]);

  if (!isOpen) return null;

  const handleProjectSelect = (projId) => {
    setProjectId(projId);
    const selected = projects.find(p => p.id === projId);
    if (selected) {
      setClientName(selected.client);
      setClientPhone(selected.clientPhone || '');
      setClientAddress(selected.location || '');
    }
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...items];
    updated[index][field] = value;
    if (field === 'qty' || field === 'rate') {
      const q = Number(updated[index].qty) || 0;
      const r = Number(updated[index].rate) || 0;
      updated[index].amount = q * r;
    }
    setItems(updated);
  };

  const addItemRow = () => {
    setItems([...items, { description: '', qty: 1, unit: 'Sq.Ft', rate: 0, amount: 0 }]);
  };

  const removeItemRow = (index) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const subtotal = items.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const taxAmount = (subtotal * taxRate) / 100;
  const totalAmount = subtotal + taxAmount;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (items.length === 0 || subtotal <= 0) {
      alert('Please add at least one line item with valid amount.');
      return;
    }

    const proj = projects.find(p => p.id === projectId);

    addInvoice({
      invoiceNumber,
      projectId,
      projectName: proj ? proj.name : 'General Project',
      clientName,
      clientPhone,
      clientAddress,
      date,
      dueDate,
      items,
      subtotal,
      taxRate,
      taxAmount,
      totalAmount,
      paidAmount: Number(paidAmount) || 0,
      paymentMode: Number(paidAmount) > 0 ? paymentMode : null
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-3xl rounded-2xl p-6 shadow-2xl space-y-6 my-auto max-h-[90vh] overflow-y-auto">
        
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-white">Create Client GST Tax Invoice</h3>
            <p className="text-xs text-slate-400">Generate professional invoice under GURUBARAN BUILDERS</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          
          {/* Top Row: Project & Invoice # */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-400 mb-1 font-semibold">Select Project Site *</label>
              <select
                value={projectId}
                onChange={(e) => handleProjectSelect(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white"
              >
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.client})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-slate-400 mb-1 font-semibold">Invoice Number *</label>
              <input
                type="text"
                required
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1 font-semibold">Bill Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white"
              />
            </div>
          </div>

          {/* Client Details */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-400 mb-1 font-semibold">Client Name *</label>
              <input
                type="text"
                required
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white font-bold"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1 font-semibold">Client Phone</label>
              <input
                type="text"
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1 font-semibold">Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white"
              />
            </div>
          </div>

          {/* Line Items */}
          <div className="space-y-2 pt-2">
            <div className="flex justify-between items-center">
              <label className="font-bold text-slate-300">Work Description / Line Items</label>
              <button
                type="button"
                onClick={addItemRow}
                className="inline-flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 cursor-pointer font-bold"
              >
                <Plus className="w-3.5 h-3.5" /> Add Row
              </button>
            </div>

            <div className="space-y-2">
              {items.map((item, idx) => (
                <div key={idx} className="flex flex-wrap sm:flex-nowrap items-center gap-2 bg-slate-800/60 p-2.5 rounded-xl border border-slate-700">
                  <input
                    type="text"
                    placeholder="Item description (e.g. Masonry, Plastering, Steel binding)"
                    required
                    value={item.description}
                    onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                    className="flex-1 min-w-[180px] p-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs"
                  />
                  <input
                    type="number"
                    placeholder="Qty"
                    required
                    value={item.qty}
                    onChange={(e) => handleItemChange(idx, 'qty', e.target.value)}
                    className="w-20 p-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs font-mono"
                  />
                  <input
                    type="text"
                    placeholder="Unit (Sq.Ft, MT, Nos)"
                    value={item.unit}
                    onChange={(e) => handleItemChange(idx, 'unit', e.target.value)}
                    className="w-20 p-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs"
                  />
                  <input
                    type="number"
                    placeholder="Rate (₹)"
                    required
                    value={item.rate}
                    onChange={(e) => handleItemChange(idx, 'rate', e.target.value)}
                    className="w-24 p-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs font-mono"
                  />
                  <div className="w-28 text-right font-bold text-white font-mono text-xs">
                    {formatINR(item.amount)}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItemRow(idx)}
                    className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-950 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Calculations Summary */}
          <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700 space-y-2 mt-4">
            <div className="flex justify-between">
              <span className="text-slate-400">Subtotal:</span>
              <span className="font-bold text-white font-mono">{formatINR(subtotal)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">GST Rate (%):</span>
              <select
                value={taxRate}
                onChange={(e) => setTaxRate(Number(e.target.value))}
                className="p-1 rounded bg-slate-800 border border-slate-700 text-white"
              >
                <option value="0">0% (Exempt)</option>
                <option value="5">5% (Composite)</option>
                <option value="12">12% (Civil Works)</option>
                <option value="18">18% (Standard Construction GST)</option>
                <option value="28">28% (Luxury)</option>
              </select>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Tax Amount:</span>
              <span className="font-bold text-slate-300 font-mono">{formatINR(taxAmount)}</span>
            </div>
            <div className="flex justify-between text-sm font-bold pt-2 border-t border-slate-700">
              <span className="text-amber-400">Grand Total Invoice:</span>
              <span className="font-mono text-amber-400 text-base">{formatINR(totalAmount)}</span>
            </div>
          </div>

          {/* Advance / Payment Received Now */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div>
              <label className="block text-slate-400 mb-1 font-semibold">Payment Received Today (₹)</label>
              <input
                type="number"
                value={paidAmount}
                onChange={(e) => setPaidAmount(e.target.value)}
                placeholder="0 if unpaid"
                className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-emerald-400 font-bold text-sm font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1 font-semibold">Payment Mode</label>
              <select
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white"
              >
                <option value="SBI RTGS / NEFT">SBI RTGS / NEFT</option>
                <option value="HDFC Bank Transfer">HDFC Bank Transfer</option>
                <option value="Cheque Deposit">Cheque Deposit</option>
                <option value="UPI / Online QR">UPI / Online QR</option>
                <option value="Cash in Hand">Cash in Hand</option>
              </select>
            </div>
          </div>

          {/* Submit Buttons */}
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
              Generate & Save Invoice
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
