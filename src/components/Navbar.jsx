import React from 'react';
import { useApp } from '../context/AppContext';
import { 
  Building2, 
  HardHat, 
  Download, 
  RotateCcw, 
  PlusCircle, 
  Calendar,
  Wallet,
  FileSpreadsheet
} from 'lucide-react';
import { formatINR } from '../utils/formatters';

export const Navbar = ({ onOpenNewInvoice, onOpenNewExpense }) => {
  const { companyProfile, exportDataJSON, totalCashBankBalance } = useApp();

  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-30 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo & Company Name */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-amber-500/20 border border-amber-400/40">
              <Building2 className="w-7 h-7 text-slate-950 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white m-0 uppercase font-sans">
                  {companyProfile.name || "GURUBARAN BUILDERS"}
                </h1>
                <span className="hidden md:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  <HardHat className="w-3.5 h-3.5 text-amber-400" />
                  Civil & Infra ERP
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium tracking-wide">
                {companyProfile.tagline || "Quality Construction & Civil Engineering Excellence"}
              </p>
            </div>
          </div>

          {/* Right Header Stats & Actions */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Live Date */}
            <div className="hidden sm:flex items-center gap-2 bg-slate-800/50 px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 border border-slate-700/60">
              <Calendar className="w-4 h-4 text-amber-400" />
              <span>{today}</span>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={onOpenNewInvoice}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm transition-all shadow-md shadow-amber-500/20 active:scale-95 cursor-pointer"
                title="Create New GST Invoice"
              >
                <PlusCircle className="w-4 h-4" />
                <span className="hidden sm:inline">New</span> Invoice
              </button>

              <button
                onClick={onOpenNewExpense}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs sm:text-sm transition-all active:scale-95 cursor-pointer"
                title="Record Construction Raw Material Purchase"
              >
                <PlusCircle className="w-4 h-4 text-amber-400" />
                <span className="hidden sm:inline">Add</span> Material
              </button>

              <button
                onClick={exportDataJSON}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
                title="Backup Entire Database (JSON)"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>

          </div>

        </div>
      </div>
    </header>
  );
};
