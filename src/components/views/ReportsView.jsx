import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  BarChart3, 
  FileSpreadsheet, 
  Printer, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Building2,
  Calendar,
  CheckCircle2
} from 'lucide-react';
import { formatINR, formatCompactINR } from '../../utils/formatters';

export const ReportsView = () => {
  const { companyProfile, projects, invoices, expenses, totalRevenue, totalExpenses, netProfit } = useApp();
  const [reportType, setReportType] = useState('pnl');

  // Compute GST stats
  const totalGstOutputCollected = invoices.reduce((sum, i) => sum + Number(i.taxAmount || 0), 0);
  const totalGstInputCredit = expenses.reduce((sum, e) => sum + Number(e.taxAmount || 0), 0);
  const netGstPayable = Math.max(0, totalGstOutputCollected - totalGstInputCredit);

  // Print function
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div>
          <h2 className="text-2xl font-black text-white m-0 tracking-tight">Financial Reports & Statements</h2>
          <p className="text-xs text-slate-400">Official Profit & Loss Statement, Project Cost Audits, and GST Tax Summaries</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
            <button
              onClick={() => setReportType('pnl')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                reportType === 'pnl' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Profit & Loss (P&L)
            </button>
            <button
              onClick={() => setReportType('projects')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                reportType === 'projects' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Site Profitability
            </button>
            <button
              onClick={() => setReportType('gst')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                reportType === 'gst' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              GST Summary
            </button>
          </div>

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs border border-slate-700 cursor-pointer"
          >
            <Printer className="w-4 h-4 text-amber-400" /> Print Report
          </button>
        </div>
      </div>

      {/* Report Container */}
      <div className="bg-slate-900/95 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl text-slate-200">
        
        {/* Report Company Header */}
        <div className="border-b border-slate-800 pb-6 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Building2 className="w-6 h-6 text-amber-500" />
              <h1 className="text-xl sm:text-2xl font-black text-white uppercase tracking-wide m-0">
                {companyProfile.name}
              </h1>
            </div>
            <p className="text-xs text-slate-400 mt-1">{companyProfile.address}</p>
            <p className="text-xs text-slate-400">GSTIN: {companyProfile.gstin} • PAN: {companyProfile.pan}</p>
          </div>
          <div className="text-right">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 inline-block uppercase">
              Financial Year 2026 - 2027
            </span>
            <p className="text-xs text-slate-400 mt-1">Generated: {new Date().toLocaleDateString('en-IN')}</p>
          </div>
        </div>

        {/* P&L Statement */}
        {reportType === 'pnl' && (
          <div className="space-y-6">
            <div className="text-center pb-2">
              <h2 className="text-lg font-bold text-white uppercase tracking-wider">STATEMENT OF PROFIT & LOSS</h2>
              <p className="text-xs text-slate-400">For the Period April 1, 2026 to Present</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Income Column */}
              <div className="bg-slate-800/40 p-5 rounded-xl border border-slate-800 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-700">
                  <h3 className="font-bold text-emerald-400 text-sm uppercase">A. Operating Revenue (Inflow)</h3>
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                </div>
                
                <div className="space-y-2.5 text-xs">
                  {invoices.map((inv) => (
                    <div key={inv.id} className="flex justify-between">
                      <span className="text-slate-300">{inv.projectName} ({inv.clientName})</span>
                      <span className="font-mono font-semibold text-white">{formatINR(inv.paidAmount)}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-3 border-t border-slate-700 flex justify-between text-sm font-bold">
                  <span className="text-emerald-400">TOTAL REVENUE (A)</span>
                  <span className="font-mono text-emerald-400">{formatINR(totalRevenue)}</span>
                </div>
              </div>

              {/* Expenses Column */}
              <div className="bg-slate-800/40 p-5 rounded-xl border border-slate-800 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-700">
                  <h3 className="font-bold text-rose-400 text-sm uppercase">B. Operating Expenses (Outflow)</h3>
                  <TrendingDown className="w-4 h-4 text-rose-400" />
                </div>

                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-300">Raw Materials (Cement, Steel, Sand, Bricks)</span>
                    <span className="font-mono font-semibold text-white">
                      {formatINR(expenses.filter(e => e.category === 'Materials').reduce((s, e) => s + Number(e.amount), 0))}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-300">Site Labor & Muster Roll Wages</span>
                    <span className="font-mono font-semibold text-white">
                      {formatINR(expenses.filter(e => e.category === 'Labor & Wages').reduce((s, e) => s + Number(e.amount), 0))}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-300">Subcontractors & Specialist Works</span>
                    <span className="font-mono font-semibold text-white">
                      {formatINR(expenses.filter(e => e.category === 'Subcontractor').reduce((s, e) => s + Number(e.amount), 0))}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-300">Machinery Rentals, Fuel & Earthwork</span>
                    <span className="font-mono font-semibold text-white">
                      {formatINR(expenses.filter(e => e.category === 'Machinery & Fuel').reduce((s, e) => s + Number(e.amount), 0))}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-300">Administrative, Safety & Office Overheads</span>
                    <span className="font-mono font-semibold text-white">
                      {formatINR(expenses.filter(e => e.category === 'Admin & Office').reduce((s, e) => s + Number(e.amount), 0))}
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-700 flex justify-between text-sm font-bold">
                  <span className="text-rose-400">TOTAL EXPENSES (B)</span>
                  <span className="font-mono text-rose-400">{formatINR(totalExpenses)}</span>
                </div>
              </div>

            </div>

            {/* Net Operating Profit Banner */}
            <div className="bg-gradient-to-r from-amber-500/20 via-amber-500/10 to-transparent p-5 rounded-2xl border border-amber-500/30 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">NET OPERATING PROFIT (A - B)</span>
                <span className="text-xs text-slate-300">Net earnings before depreciation and income tax provisions</span>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-amber-400 font-mono">
                {formatINR(netProfit)}
              </div>
            </div>
          </div>
        )}

        {/* Site Profitability Table */}
        {reportType === 'projects' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Site-Wise Profitability Audit</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-800/80 text-slate-400 uppercase">
                  <tr>
                    <th className="p-3">Project Site</th>
                    <th className="p-3">Client</th>
                    <th className="p-3 text-right">Sanctioned Budget</th>
                    <th className="p-3 text-right">Invoiced to Client</th>
                    <th className="p-3 text-right">Cost Incurred</th>
                    <th className="p-3 text-right">Gross Profit Margin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {projects.map(p => {
                    const projectInvoiced = invoices
                      .filter(i => i.projectId === p.id)
                      .reduce((sum, i) => sum + Number(i.totalAmount || 0), 0);
                    const gross = projectInvoiced - p.spent;
                    const margin = projectInvoiced > 0 ? ((gross / projectInvoiced) * 100).toFixed(1) : '0';

                    return (
                      <tr key={p.id} className="hover:bg-slate-800/40">
                        <td className="p-3 font-bold text-white">{p.name}</td>
                        <td className="p-3 text-slate-300">{p.client}</td>
                        <td className="p-3 font-mono text-right text-slate-300">{formatINR(p.budget)}</td>
                        <td className="p-3 font-mono text-right text-emerald-400 font-semibold">{formatINR(projectInvoiced)}</td>
                        <td className="p-3 font-mono text-right text-rose-400 font-semibold">{formatINR(p.spent)}</td>
                        <td className="p-3 font-mono text-right font-bold text-amber-400">
                          {formatINR(gross)} ({margin}%)
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* GST Tax Summary */}
        {reportType === 'gst' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">GST Output vs Input Tax Credit Summary</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-800">
                <span className="text-xs text-slate-400 block font-semibold">Output GST Collected (18%)</span>
                <span className="text-xl font-bold text-emerald-400 mt-1 block font-mono">{formatINR(totalGstOutputCollected)}</span>
              </div>
              <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-800">
                <span className="text-xs text-slate-400 block font-semibold">Input Tax Credit (ITC) Available</span>
                <span className="text-xl font-bold text-blue-400 mt-1 block font-mono">{formatINR(totalGstInputCredit)}</span>
              </div>
              <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-800">
                <span className="text-xs text-slate-400 block font-semibold">Net GST Payable (Govt Treasury)</span>
                <span className="text-xl font-bold text-amber-400 mt-1 block font-mono">{formatINR(netGstPayable)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Authorized Signatory Footer */}
        <div className="mt-12 pt-8 border-t border-slate-800 flex justify-between items-end text-xs text-slate-400">
          <div>
            <p className="font-semibold text-slate-300">Prepared by Accounts Department</p>
            <p>{companyProfile.name}</p>
          </div>
          <div className="text-right">
            <div className="h-10 border-b border-slate-700 w-48 mb-2"></div>
            <p className="font-bold text-white uppercase">Managing Partner / Authorized Signatory</p>
          </div>
        </div>

      </div>
    </div>
  );
};
