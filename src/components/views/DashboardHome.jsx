import React from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Building2, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  ArrowUpRight, 
  ArrowDownRight,
  Plus,
  FileText,
  Hammer,
  Truck,
  Users,
  ChevronRight,
  HardHat,
  FolderPlus,
  PlusCircle
} from 'lucide-react';
import { formatINR, formatCompactINR, formatDate } from '../../utils/formatters';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';

export const DashboardHome = ({ onOpenNewInvoice, onOpenNewExpense, onOpenNewProject }) => {
  const { 
    companyProfile, 
    projects, 
    invoices, 
    expenses, 
    totalRevenue, 
    totalInvoiced, 
    totalExpenses, 
    netProfit, 
    totalReceivables, 
    totalPayables,
    totalCashBankBalance,
    setActiveTab,
    setSelectedInvoiceForPrint
  } = useApp();

  // Category-wise Expense distribution
  const expenseByCategory = expenses.reduce((acc, exp) => {
    const cat = exp.category || 'Other';
    acc[cat] = (acc[cat] || 0) + Number(exp.amount || 0);
    return acc;
  }, {});

  const pieData = Object.keys(expenseByCategory).map(key => ({
    name: key,
    value: expenseByCategory[key]
  }));

  const COLORS = ['#f59e0b', '#3b82f6', '#10b981', '#ec4899', '#8b5cf6', '#64748b'];

  const profitMargin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : 0;

  return (
    <div className="space-y-8 pb-12">
      
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-amber-950/40 border border-slate-800 p-6 sm:p-8 shadow-xl">
        <div className="absolute right-0 top-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-bold tracking-wide">
              <Building2 className="w-3.5 h-3.5" />
              <span>OFFICIAL ACCOUNTS & FINANCIAL MANAGEMENT PORTAL</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white m-0">
              Welcome to <span className="text-amber-400">{companyProfile.name || "GURUBARAN BUILDERS"}</span>
            </h1>
            <p className="text-slate-300 text-sm max-w-2xl leading-relaxed">
              Clean accounting workspace ready. Start recording your construction sites, client invoices, raw material purchases, and muster roll wages.
            </p>
          </div>

          {/* Quick Shortcuts */}
          <div className="flex flex-wrap gap-2.5">
            <button
              onClick={onOpenNewInvoice}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Create Invoice
            </button>
            <button
              onClick={onOpenNewExpense}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-sm border border-slate-700 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 text-amber-400" />
              Add Material
            </button>
            <button
              onClick={onOpenNewProject}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-sm border border-slate-700 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 text-amber-400" />
              New Site
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        
        {/* Active Sites */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-md hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Construction Sites</span>
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-white">{projects.length} Sites</div>
            <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-400 font-medium">
              <span>Ongoing building projects in personal database</span>
            </div>
          </div>
        </div>

        {/* Total Material Costs */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-md hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Material Purchases</span>
            <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-rose-400">{formatINR(totalExpenses)}</div>
            <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-400 font-medium">
              <span>{expenses.length} procurement records logged</span>
            </div>
          </div>
        </div>

        {/* Total Cash & Bank Balance */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-md hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Cash & Bank Balance</span>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-emerald-400">{formatINR(totalCashBankBalance)}</div>
            <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-400 font-medium">
              <span>Current available operating balance</span>
            </div>
          </div>
        </div>

      </div>

      {/* Active Construction Sites */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-md">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold text-white m-0">Active Construction Sites & Projects</h2>
            <p className="text-xs text-slate-400">Track ongoing sites and material cost incurred</p>
          </div>
          <button 
            onClick={() => setActiveTab('projects')}
            className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer"
          >
            View All Sites <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {projects.length === 0 ? (
          <div className="text-center py-10 border-2 border-dashed border-slate-800 rounded-xl space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mx-auto text-amber-400">
              <FolderPlus className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-white">No Construction Sites Added Yet</h3>
              <p className="text-xs text-slate-400">Click below to add your first building site or client project.</p>
            </div>
            <button
              onClick={onOpenNewProject}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" /> + Add First Project Site
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {projects.map((project) => (
              <div key={project.id} className="bg-slate-800/60 border border-slate-700/70 rounded-xl p-4.5 space-y-3 hover:border-amber-500/40 transition-all">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-mono tracking-wider px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 uppercase">
                      {project.id}
                    </span>
                    <h3 className="text-base font-bold text-white mt-1">{project.name}</h3>
                    <p className="text-xs text-slate-400 font-medium">{project.location || 'Location'}</p>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-amber-500/20 text-amber-400">
                    {project.status || 'Active'}
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-medium">Material Cost:</span>
                  <span className="font-bold font-mono text-rose-400">{formatINR(project.spent || 0)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Client Invoices & Company Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Invoices */}
        <div className="lg:col-span-2 bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-md">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-white m-0">Recent Client Invoices</h2>
              <p className="text-xs text-slate-400">Latest billing records & status</p>
            </div>
            <button 
              onClick={() => setActiveTab('invoices')}
              className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer"
            >
              View Invoices <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {invoices.length === 0 ? (
            <div className="text-center py-10 border-2 border-dashed border-slate-800 rounded-xl space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mx-auto text-amber-400">
                <FileText className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-white">No Invoices Created Yet</h3>
                <p className="text-xs text-slate-400">Generate your first GST construction bill with itemized quantities.</p>
              </div>
              <button
                onClick={onOpenNewInvoice}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Create First Invoice
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="text-[11px] uppercase tracking-wider text-slate-400 bg-slate-800/60 border-b border-slate-700">
                  <tr>
                    <th className="py-3 px-3">Invoice #</th>
                    <th className="py-3 px-3">Client & Site</th>
                    <th className="py-3 px-3">Date</th>
                    <th className="py-3 px-3">Amount</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 font-medium">
                  {invoices.slice(0, 4).map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-3 font-bold text-amber-400">{inv.invoiceNumber}</td>
                      <td className="py-3 px-3">
                        <div className="font-bold text-white">{inv.clientName}</div>
                        <div className="text-[11px] text-slate-400">{inv.projectName}</div>
                      </td>
                      <td className="py-3 px-3 text-slate-300">{formatDate(inv.date)}</td>
                      <td className="py-3 px-3 font-bold text-white">{formatINR(inv.totalAmount)}</td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400">
                          {inv.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => setSelectedInvoiceForPrint(inv)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 cursor-pointer"
                          title="View / Print Tax Invoice"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Quick Company Profile Overview */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-md flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base leading-tight uppercase">{companyProfile.name}</h3>
                <span className="text-xs text-amber-400 font-semibold">Civil Engineering & Construction ERP</span>
              </div>
            </div>

            <div className="space-y-2.5 text-xs text-slate-300 pt-2 border-t border-slate-800">
              <div className="flex justify-between">
                <span className="text-slate-400">GSTIN:</span>
                <span className="font-bold text-slate-100">{companyProfile.gstin || 'Not Configured'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">PAN:</span>
                <span className="font-bold text-slate-100">{companyProfile.pan || 'Not Configured'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Primary Bank:</span>
                <span className="font-bold text-slate-100">{companyProfile.bankDetails?.bankName || 'State Bank of India'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">A/C Number:</span>
                <span className="font-bold text-slate-100 font-mono">{companyProfile.bankDetails?.accountNumber || 'Not Configured'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">IFSC Code:</span>
                <span className="font-bold text-slate-100 font-mono">{companyProfile.bankDetails?.ifscCode || 'Not Configured'}</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800">
            <button
              onClick={() => setActiveTab('settings')}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition-all text-center cursor-pointer"
            >
              Update Company Info & Bank A/C
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};
