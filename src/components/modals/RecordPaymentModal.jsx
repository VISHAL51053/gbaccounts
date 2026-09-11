import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { X, DollarSign, CheckCircle } from 'lucide-react';
import { formatINR } from '../../utils/formatters';

export const RecordPaymentModal = ({ isOpen, onClose, invoice }) => {
  const { recordInvoicePayment, accounts } = useApp();

  const [amount, setAmount] = useState(invoice?.balance || '');
  const [paymentMode, setPaymentMode] = useState('SBI RTGS');
  const [accountId, setAccountId] = useState(accounts[0]?.id || 'ACC-01');

  if (!isOpen || !invoice) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) {
      alert('Please enter a valid amount.');
      return;
    }

    recordInvoicePayment(invoice.id, Number(amount), paymentMode, accountId);
    onClose();
    alert(`Payment of ${formatINR(Number(amount))} recorded successfully for ${invoice.invoiceNumber}!`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4">
        
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-white">Record Client Payment</h3>
            <p className="text-xs text-slate-400">Invoice: <strong className="text-amber-400 font-mono">{invoice.invoiceNumber}</strong></p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="bg-slate-800/60 p-3.5 rounded-xl border border-slate-700 text-xs space-y-1.5">
          <div className="flex justify-between">
            <span className="text-slate-400">Client Name:</span>
            <span className="font-bold text-white">{invoice.clientName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Site / Project:</span>
            <span className="font-bold text-white">{invoice.projectName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Total Invoice Bill:</span>
            <span className="font-mono text-slate-200">{formatINR(invoice.totalAmount)}</span>
          </div>
          <div className="flex justify-between pt-1 border-t border-slate-700">
            <span className="text-slate-400 font-semibold">Remaining Due:</span>
            <span className="font-mono font-bold text-rose-400">{formatINR(invoice.balance)}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block text-slate-400 mb-1 font-semibold">Payment Amount Received (₹) *</label>
            <input
              type="number"
              required
              max={invoice.balance}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-emerald-400 font-black text-lg font-mono"
            />
          </div>

          <div>
            <label className="block text-slate-400 mb-1 font-semibold">Deposit Into Bank Account</label>
            <select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs"
            >
              {accounts.map(a => (
                <option key={a.id} value={a.id}>{a.name} ({formatINR(a.balance)})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-400 mb-1 font-semibold">Payment Method / Reference</label>
            <input
              type="text"
              value={paymentMode}
              onChange={(e) => setPaymentMode(e.target.value)}
              placeholder="e.g. SBI RTGS (Ref: 991204)"
              className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs"
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
              className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold shadow-lg shadow-emerald-500/20 cursor-pointer"
            >
              Confirm Payment
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
