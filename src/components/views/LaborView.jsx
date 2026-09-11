import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Users, 
  Plus, 
  Calendar, 
  DollarSign, 
  Trash2, 
  CheckCircle, 
  Clock, 
  HardHat,
  UserCheck
} from 'lucide-react';
import { formatINR } from '../../utils/formatters';

export const LaborView = () => {
  const { laborRoster, addLabor, updateLabor, deleteLabor, projects, addExpense } = useApp();
  const [showAddWorker, setShowAddWorker] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({
    name: '',
    role: 'Mason (Mistri)',
    dailyRate: 900,
    phone: '',
    siteAssigned: projects[0]?.id || '',
    daysPresentThisMonth: 20,
    advancePaid: 0
  });

  const handleAddWorker = (e) => {
    e.preventDefault();
    if (!formData.name) return;
    addLabor(formData);
    setShowAddWorker(false);
    setFormData({
      name: '',
      role: 'Mason (Mistri)',
      dailyRate: 900,
      phone: '',
      siteAssigned: projects[0]?.id || '',
      daysPresentThisMonth: 20,
      advancePaid: 0
    });
  };

  const handleDisburseWage = (worker) => {
    const grossWage = worker.daysPresentThisMonth * worker.dailyRate;
    const netPayable = Math.max(0, grossWage - (worker.advancePaid || 0));
    
    if (confirm(`Disburse net wage of ${formatINR(netPayable)} for ${worker.name}?`)) {
      const proj = projects.find(p => p.id === worker.siteAssigned);
      addExpense({
        date: new Date().toISOString().split('T')[0],
        projectId: worker.siteAssigned,
        projectName: proj ? proj.name : 'General',
        category: 'Labor & Wages',
        item: `Monthly Wage Payout: ${worker.name} (${worker.role}) - ${worker.daysPresentThisMonth} Days`,
        vendor: `${worker.name} (Worker)`,
        amount: netPayable,
        paymentMode: 'Cash in Hand',
        billNumber: `WAGE-${worker.id}-${Date.now().toString().slice(-4)}`,
        notes: `Wage computed: ${worker.daysPresentThisMonth} days @ ${worker.dailyRate}/day. Less advance: ${worker.advancePaid}`
      });

      updateLabor(worker.id, {
        advancePaid: 0,
        daysPresentThisMonth: 0
      });
      alert(`Wage payment voucher of ${formatINR(netPayable)} generated and added to site expenses!`);
    }
  };

  const totalMonthlyWageLiability = laborRoster.reduce((sum, w) => {
    return sum + (w.daysPresentThisMonth * w.dailyRate) - (w.advancePaid || 0);
  }, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white m-0 tracking-tight">Labour Attendance & Daily Wage Tracker</h2>
          <p className="text-xs text-slate-400">Manage site workers (Masons, Carpenters, Bar benders, Helpers), attendance days & wage disbursements</p>
        </div>
        <button
          onClick={() => setShowAddWorker(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm shadow-md shadow-amber-500/20 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" /> Add Labour
        </button>
      </div>

      {/* Summary Box */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900/90 border border-slate-800 p-4.5 rounded-2xl">
          <div className="text-xs font-bold text-slate-400 uppercase">Active Labor Workforce</div>
          <div className="text-2xl font-black text-white mt-1">{laborRoster.length} Workers</div>
        </div>
        <div className="bg-slate-900/90 border border-slate-800 p-4.5 rounded-2xl">
          <div className="text-xs font-bold text-slate-400 uppercase">Total Advance Given</div>
          <div className="text-2xl font-black text-amber-400 mt-1">
            {formatINR(laborRoster.reduce((sum, w) => sum + Number(w.advancePaid || 0), 0))}
          </div>
        </div>
        <div className="bg-slate-900/90 border border-slate-800 p-4.5 rounded-2xl">
          <div className="text-xs font-bold text-slate-400 uppercase">Net Wage Payable This Month</div>
          <div className="text-2xl font-black text-rose-400 mt-1">{formatINR(totalMonthlyWageLiability)}</div>
        </div>
      </div>

      {/* Labor Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-[11px] uppercase tracking-wider text-slate-400 bg-slate-800/80 border-b border-slate-700">
              <tr>
                <th className="py-3.5 px-4 font-bold">Worker ID & Name</th>
                <th className="py-3.5 px-4 font-bold">Designation / Skill</th>
                <th className="py-3.5 px-4 font-bold">Assigned Site</th>
                <th className="py-3.5 px-4 font-bold text-right">Daily Rate</th>
                <th className="py-3.5 px-4 font-bold text-center">Days Present</th>
                <th className="py-3.5 px-4 font-bold text-right">Gross Earned</th>
                <th className="py-3.5 px-4 font-bold text-right">Advance Paid</th>
                <th className="py-3.5 px-4 font-bold text-right">Net Payable</th>
                <th className="py-3.5 px-4 font-bold text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 font-medium">
              {laborRoster.length === 0 ? (
                <tr>
                  <td colSpan="9" className="py-8 text-center text-slate-400 text-sm">
                    No labour records found. Click <strong>"+ Add Labour"</strong> to enroll workers.
                  </td>
                </tr>
              ) : (
                laborRoster.map((worker, index) => {
                  const assignedProj = projects.find(p => p.id === worker.siteAssigned);
                  const grossEarned = worker.daysPresentThisMonth * worker.dailyRate;
                  const netPayable = Math.max(0, grossEarned - (worker.advancePaid || 0));

                  return (
                    <tr key={worker.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-white text-sm">
                          <span className="text-amber-400 font-mono mr-1.5">{index + 1}.</span>
                          {worker.name}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">{worker.id} • {worker.phone}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                          {worker.role}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-300">{assignedProj ? assignedProj.name : 'General HQ'}</td>
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-200 text-right">{formatINR(worker.dailyRate)}/day</td>
                      <td className="py-3.5 px-4 text-center font-bold text-white">
                        <div className="inline-flex items-center gap-1.5 bg-slate-800 px-2 py-0.5 rounded-md border border-slate-700">
                          <span>{worker.daysPresentThisMonth}</span>
                          <button 
                            onClick={() => {
                              const newDays = prompt(`Update attendance days for ${worker.name}:`, worker.daysPresentThisMonth);
                              if (newDays !== null) updateLabor(worker.id, { daysPresentThisMonth: parseInt(newDays) || 0 });
                            }}
                            className="text-[10px] text-amber-400 hover:underline cursor-pointer"
                          >
                            edit
                          </button>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-300 text-right">{formatINR(grossEarned)}</td>
                      <td className="py-3.5 px-4 font-mono text-rose-400 text-right">
                        {formatINR(worker.advancePaid || 0)}
                        <button 
                          onClick={() => {
                            const adv = prompt(`Add Advance Amount for ${worker.name}:`, '1000');
                            if (adv !== null) {
                              const addVal = parseInt(adv) || 0;
                              updateLabor(worker.id, { advancePaid: (worker.advancePaid || 0) + addVal });
                            }
                          }}
                          className="block text-[10px] text-amber-400 hover:underline cursor-pointer ml-auto"
                        >
                          + advance
                        </button>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-emerald-400 text-right text-sm">
                        {formatINR(netPayable)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleDisburseWage(worker)}
                            disabled={netPayable <= 0}
                            className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500 text-emerald-300 hover:text-slate-950 font-bold text-xs transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                          >
                            Disburse Wage
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Remove worker ${worker.name}?`)) deleteLabor(worker.id);
                            }}
                            className="p-1 rounded-lg bg-slate-800 text-rose-400 hover:bg-rose-950 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Worker Modal */}
      {showAddWorker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white">Enroll Construction Worker</h3>
            <form onSubmit={handleAddWorker} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Worker Full Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Ramesh Kumar"
                  className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Trade / Role</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs"
                  >
                    <option value="Head Mason (Mistri)">Head Mason (Mistri)</option>
                    <option value="Senior Carpenter">Senior Carpenter</option>
                    <option value="Bar Bender Lead">Bar Bender Lead</option>
                    <option value="Licensed Electrician">Licensed Electrician</option>
                    <option value="Plumbing Technician">Plumbing Technician</option>
                    <option value="Painter">Painter</option>
                    <option value="Construction Helper">Construction Helper</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Daily Wage Rate (₹) *</label>
                  <input
                    type="number"
                    required
                    value={formData.dailyRate}
                    onChange={(e) => setFormData({ ...formData, dailyRate: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Phone Number</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+91 98401..."
                    className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Assigned Construction Site</label>
                  <select
                    value={formData.siteAssigned}
                    onChange={(e) => setFormData({ ...formData, siteAssigned: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs"
                  >
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddWorker(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold cursor-pointer shadow-lg shadow-amber-500/20"
                >
                  Add Labour
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
