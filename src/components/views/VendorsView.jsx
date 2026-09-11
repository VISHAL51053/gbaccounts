import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Truck, 
  Plus, 
  Search, 
  Phone, 
  MapPin, 
  CreditCard, 
  Trash2, 
  FileText,
  DollarSign
} from 'lucide-react';
import { formatINR } from '../../utils/formatters';

export const VendorsView = () => {
  const { vendors, addVendor, updateVendor, deleteVendor, addExpense, projects } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddVendor, setShowAddVendor] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    contactPerson: '',
    phone: '',
    category: 'TMT Steel & Structural Iron',
    gstin: '',
    address: '',
    balanceDue: 0
  });

  const handleAddVendor = (e) => {
    e.preventDefault();
    if (!formData.name) return;
    addVendor(formData);
    setShowAddVendor(false);
    setFormData({
      name: '',
      contactPerson: '',
      phone: '',
      category: 'TMT Steel & Structural Iron',
      gstin: '',
      address: '',
      balanceDue: 0
    });
  };

  const handlePayVendor = (vendor) => {
    const payAmt = prompt(`Enter Payment Amount for ${vendor.name} (Current Balance Due: ${formatINR(vendor.balanceDue)}):`, vendor.balanceDue);
    if (payAmt !== null && !isNaN(payAmt) && Number(payAmt) > 0) {
      const numAmt = Number(payAmt);
      addExpense({
        date: new Date().toISOString().split('T')[0],
        projectId: projects[0]?.id || '',
        projectName: 'Vendor Settlement',
        category: 'Materials',
        item: `Vendor Payment Settlement to ${vendor.name}`,
        vendor: vendor.name,
        amount: numAmt,
        paymentMode: 'SBI Bank Transfer',
        billNumber: `PAY-VND-${Date.now().toString().slice(-4)}`,
        notes: `Balance before: ${vendor.balanceDue}. Paid: ${numAmt}`
      });

      updateVendor(vendor.id, {
        balanceDue: Math.max(0, vendor.balanceDue - numAmt)
      });
      alert(`Payment of ${formatINR(numAmt)} recorded for ${vendor.name}!`);
    }
  };

  const filteredVendors = vendors.filter(v => 
    v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.contactPerson?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white m-0 tracking-tight">Vendors & Material Suppliers</h2>
          <p className="text-xs text-slate-400">Directory of steel mills, cement stockists, quarry suppliers, and specialized subcontractors</p>
        </div>
        <button
          onClick={() => setShowAddVendor(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm shadow-md shadow-amber-500/20 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" /> Add Vendor
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search supplier, material category, contact..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-amber-500"
        />
      </div>

      {/* Vendors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredVendors.map((vendor) => (
          <div key={vendor.id} className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-md hover:border-slate-700 transition-all flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 uppercase">
                    {vendor.id}
                  </span>
                  <h3 className="text-lg font-bold text-white mt-1">{vendor.name}</h3>
                  <span className="text-xs text-amber-400 font-semibold">{vendor.category}</span>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-slate-400 block">Balance Payable</span>
                  <span className="text-lg font-black text-rose-400">{formatINR(vendor.balanceDue)}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs text-slate-300 mt-4 bg-slate-800/40 p-3.5 rounded-xl border border-slate-800">
                <div>
                  <span className="text-slate-400 block text-[10px]">Contact Person</span>
                  <span className="font-semibold text-white">{vendor.contactPerson || '-'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Phone Number</span>
                  <span className="font-semibold text-white">{vendor.phone || '-'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">GSTIN</span>
                  <span className="font-semibold text-white font-mono">{vendor.gstin || 'Unregistered'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Office / Yard Address</span>
                  <span className="font-semibold text-white truncate block">{vendor.address || 'Chennai'}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-800 text-xs">
              <button
                onClick={() => {
                  const newBal = prompt(`Update Outstanding Balance Due for ${vendor.name}:`, vendor.balanceDue);
                  if (newBal !== null && !isNaN(newBal)) {
                    updateVendor(vendor.id, { balanceDue: Number(newBal) });
                  }
                }}
                className="text-amber-400 hover:underline cursor-pointer"
              >
                Edit Balance Due
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePayVendor(vendor)}
                  className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500 text-emerald-300 hover:text-slate-950 font-bold transition-all cursor-pointer"
                >
                  Pay Vendor
                </button>
                <button
                  onClick={() => {
                    if (confirm(`Remove vendor ${vendor.name}?`)) deleteVendor(vendor.id);
                  }}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/50 text-rose-400 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Vendor Modal */}
      {showAddVendor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white">Add New Supplier / Vendor</h3>
            <form onSubmit={handleAddVendor} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Vendor / Company Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Mahalakshmi Ready-Mix Concrete"
                  className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Contact Person</label>
                  <input
                    type="text"
                    value={formData.contactPerson}
                    onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Phone Number</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Supply Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs"
                >
                  <option value="TMT Steel & Structural Iron">TMT Steel & Structural Iron</option>
                  <option value="OPC & PPC Cement">OPC & PPC Cement</option>
                  <option value="M-Sand, Aggregates & Gravel">M-Sand, Aggregates & Gravel</option>
                  <option value="Ready-Mix Concrete (RMC)">Ready-Mix Concrete (RMC)</option>
                  <option value="Bricks, AAC Blocks & Tiles">Bricks, AAC Blocks & Tiles</option>
                  <option value="Electricals & Plumbing Piping">Electricals & Plumbing Piping</option>
                  <option value="Earth Moving & Crane Rentals">Earth Moving & Crane Rentals</option>
                  <option value="Specialized Subcontractor">Specialized Subcontractor</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">GSTIN</label>
                  <input
                    type="text"
                    value={formData.gstin}
                    onChange={(e) => setFormData({ ...formData, gstin: e.target.value })}
                    placeholder="33AABCS..."
                    className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Opening Balance Due (₹)</label>
                  <input
                    type="number"
                    value={formData.balanceDue}
                    onChange={(e) => setFormData({ ...formData, balanceDue: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Yard / Office Address</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Street, City, Pin"
                  className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddVendor(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold cursor-pointer"
                >
                  Save Vendor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
