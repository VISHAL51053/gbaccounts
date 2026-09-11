import React from 'react';
import { useApp } from '../context/AppContext';
import { 
  LayoutDashboard, 
  Building, 
  Boxes, 
  Users2, 
  Landmark, 
  BarChart3, 
  Settings, 
  ShieldCheck, 
  Truck 
} from 'lucide-react';

export const Sidebar = () => {
  const { activeTab, setActiveTab } = useApp();

  const navItems = [
    { id: 'dashboard', label: 'Home Dashboard', icon: LayoutDashboard },
    { id: 'projects', label: 'Sites & Projects', icon: Building },
    { id: 'expenses', label: 'General Income & Expense', icon: Boxes },
    { id: 'labor', label: 'Labour Attendance', icon: Users2 },
    { id: 'vendors', label: 'Vendors & Suppliers', icon: Truck },
    { id: 'banking', label: 'Bank & Cash Book', icon: Landmark },
    { id: 'reports', label: 'Financial Reports & P&L', icon: BarChart3 },
    { id: 'settings', label: 'Company Settings', icon: Settings },
  ];

  return (
    <aside className="w-full md:w-64 bg-slate-900/90 border-r border-slate-800 p-4 flex flex-col justify-between shrink-0">
      <div className="space-y-6">
        <div className="px-2">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Navigation</p>
        </div>

        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-semibold text-sm transition-all cursor-pointer text-left ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-slate-950' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Info Box */}
      <div className="mt-8 pt-4 border-t border-slate-800/80 px-2 text-xs text-slate-400">
        <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/50">
          <div className="flex items-center gap-2 text-amber-400 font-bold mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>GURUBARAN ERP</span>
          </div>
          <p className="text-[11px] text-slate-400">Financial Year 2026-27</p>
          <p className="text-[10px] text-slate-400 mt-1">Version 2.4 (Enterprise Edition)</p>
        </div>
      </div>
    </aside>
  );
};
