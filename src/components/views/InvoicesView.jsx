import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  FileText, 
  Plus, 
  Search, 
  Printer, 
  CheckCircle, 
  CreditCard, 
  Trash2, 
  Clock, 
  Download,
  Building,
  DollarSign
} from 'lucide-react';
import { formatINR, formatDate } from '../../utils/formatters';

export const InvoicesView = ({ onOpenNewInvoice, onOpenRecordPayment }) => {
  const { invoices, deleteInvoice, setSelectedInvoiceForPrint } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch = 
      inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.projectName.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;
    if (statusFilter === 'All') return true;
    return inv.status === statusFilter;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white m-0 tracking-tight">Client Invoices & Billing</h2>
          <p className="text-xs text-slate-400">Generate GST compliant construction bills, track milestone payments & print invoices</p>
        </div>
        <button
          onClick={onOpenNewInvoice}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm shadow-md shadow-amber-500/20 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" /> Create New Invoice
        </button>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/90 p-4 rounded-2xl border border-slate-800">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search invoice #, client, project..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto bg-slate-800/80 p-1 rounded-xl border border-slate-700 text-xs font-semibold">
          {['All', 'Paid', 'Partially Paid', 'Unpaid'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                statusFilter === status ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-300 hover:text-white'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Invoice Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-[11px] uppercase tracking-wider text-slate-400 bg-slate-800/80 border-b border-slate-700">
              <tr>
                <th className="py-3.5 px-4 font-bold">Invoice Number</th>
                <th className="py-3.5 px-4 font-bold">Client / Site</th>
                <th className="py-3.5 px-4 font-bold">Bill Date</th>
                <th className="py-3.5 px-4 font-bold">Due Date</th>
                <th className="py-3.5 px-4 font-bold text-right">Taxable Subtotal</th>
                <th className="py-3.5 px-4 font-bold text-right">GST (18%)</th>
                <th className="py-3.5 px-4 font-bold text-right">Grand Total</th>
                <th className="py-3.5 px-4 font-bold text-right">Balance Due</th>
                <th className="py-3.5 px-4 font-bold text-center">Status</th>
                <th className="py-3.5 px-4 font-bold text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 font-medium">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan="10" className="py-8 text-center text-slate-400 text-sm">
                    No invoices found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-amber-400 font-mono text-sm">
                      {inv.invoiceNumber}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-white text-sm">{inv.clientName}</div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <Building className="w-3 h-3 text-amber-400" />
                        {inv.projectName}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300 whitespace-nowrap">{formatDate(inv.date)}</td>
                    <td className="py-3.5 px-4 text-slate-300 whitespace-nowrap">{formatDate(inv.dueDate)}</td>
                    <td className="py-3.5 px-4 font-mono text-slate-300 text-right">{formatINR(inv.subtotal)}</td>
                    <td className="py-3.5 px-4 font-mono text-slate-400 text-right">{formatINR(inv.taxAmount)}</td>
                    <td className="py-3.5 px-4 font-mono font-bold text-white text-right text-sm">{formatINR(inv.totalAmount)}</td>
                    <td className="py-3.5 px-4 font-mono font-bold text-right">
                      {inv.balance > 0 ? (
                        <span className="text-rose-400">{formatINR(inv.balance)}</span>
                      ) : (
                        <span className="text-emerald-400">₹0</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold inline-block ${
                        inv.status === 'Paid' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                        inv.status === 'Partially Paid' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                        'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      }`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setSelectedInvoiceForPrint(inv)}
                          className="p-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500 text-amber-400 hover:text-slate-950 transition-all cursor-pointer"
                          title="Print / View PDF Invoice"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                        {inv.balance > 0 && (
                          <button
                            onClick={() => onOpenRecordPayment(inv)}
                            className="p-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500 text-emerald-400 hover:text-slate-950 transition-all cursor-pointer"
                            title="Record Payment"
                          >
                            <DollarSign className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => {
                            if (confirm(`Delete invoice ${inv.invoiceNumber}?`)) {
                              deleteInvoice(inv.id);
                            }
                          }}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/50 text-rose-400 transition-all cursor-pointer"
                          title="Delete Invoice"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
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
