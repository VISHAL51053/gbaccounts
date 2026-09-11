import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Building2, 
  Save, 
  Download, 
  Upload, 
  RotateCcw, 
  CheckCircle, 
  ShieldAlert,
  Landmark,
  Phone,
  Mail,
  MapPin
} from 'lucide-react';

export const SettingsView = () => {
  const { 
    companyProfile, 
    setCompanyProfile, 
    exportDataJSON, 
    importDataJSON, 
    resetToDemoData 
  } = useApp();

  const [formData, setFormData] = useState({
    name: companyProfile.name || '',
    tagline: companyProfile.tagline || '',
    owner: companyProfile.owner || '',
    gstin: companyProfile.gstin || '',
    pan: companyProfile.pan || '',
    phone: companyProfile.phone || '',
    email: companyProfile.email || '',
    website: companyProfile.website || '',
    address: companyProfile.address || '',
    bankName: companyProfile.bankDetails?.bankName || '',
    accountName: companyProfile.bankDetails?.accountName || '',
    accountNumber: companyProfile.bankDetails?.accountNumber || '',
    ifscCode: companyProfile.bankDetails?.ifscCode || '',
    branch: companyProfile.bankDetails?.branch || '',
    terms: companyProfile.terms || ''
  });

  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setCompanyProfile({
      name: formData.name,
      tagline: formData.tagline,
      owner: formData.owner,
      gstin: formData.gstin,
      pan: formData.pan,
      phone: formData.phone,
      email: formData.email,
      website: formData.website,
      address: formData.address,
      bankDetails: {
        bankName: formData.bankName,
        accountName: formData.accountName,
        accountNumber: formData.accountNumber,
        ifscCode: formData.ifscCode,
        branch: formData.branch
      },
      terms: formData.terms
    });

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const json = JSON.parse(event.target.result);
          importDataJSON(json);
          alert('Database restored successfully from backup file!');
        } catch (err) {
          alert('Invalid JSON file format.');
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl pb-12">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-black text-white m-0 tracking-tight">Company Profile & System Settings</h2>
        <p className="text-xs text-slate-400">Configure business information, GSTIN, letterhead bank details, and data backups</p>
      </div>

      {savedSuccess && (
        <div className="bg-emerald-500/15 border border-emerald-500/30 p-4 rounded-xl text-emerald-400 text-xs font-bold flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />
          <span>Company profile and bank credentials saved successfully!</span>
        </div>
      )}

      {/* Main Settings Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Company Identity */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-md space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <Building2 className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-white text-sm uppercase">1. Business Identity</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-400 mb-1 font-semibold">Company Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white font-bold text-sm"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1 font-semibold">Tagline / Motto</label>
              <input
                type="text"
                value={formData.tagline}
                onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1 font-semibold">GSTIN *</label>
              <input
                type="text"
                required
                value={formData.gstin}
                onChange={(e) => setFormData({ ...formData, gstin: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono text-xs uppercase"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1 font-semibold">PAN *</label>
              <input
                type="text"
                required
                value={formData.pan}
                onChange={(e) => setFormData({ ...formData, pan: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono text-xs uppercase"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1 font-semibold">Contact Phone(s)</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1 font-semibold">Official Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-slate-400 mb-1 font-semibold">Registered Office Address</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs"
              />
            </div>
          </div>
        </div>

        {/* Banking Info for Invoices */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-md space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <Landmark className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-white text-sm uppercase">2. Bank Credentials (Printed on Invoices)</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-400 mb-1 font-semibold">Bank Name</label>
              <input
                type="text"
                value={formData.bankName}
                onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1 font-semibold">Account Holder Name</label>
              <input
                type="text"
                value={formData.accountName}
                onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1 font-semibold">Account Number</label>
              <input
                type="text"
                value={formData.accountNumber}
                onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono text-xs"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1 font-semibold">IFSC Code</label>
              <input
                type="text"
                value={formData.ifscCode}
                onChange={(e) => setFormData({ ...formData, ifscCode: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono text-xs uppercase"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-slate-400 mb-1 font-semibold">Branch Name & Address</label>
              <input
                type="text"
                value={formData.branch}
                onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs"
              />
            </div>
          </div>
        </div>

        {/* Invoice Terms */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-md space-y-4">
          <h3 className="font-bold text-white text-sm uppercase">3. Standard Terms & Conditions for Invoices</h3>
          <textarea
            rows="3"
            value={formData.terms}
            onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
            className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-500"
          />
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" /> Save Profile Details
          </button>
        </div>
      </form>

      {/* Data Backup & Restore Section */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-md space-y-4 mt-8">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
          <ShieldAlert className="w-5 h-5 text-amber-400" />
          <h3 className="font-bold text-white text-sm uppercase">Data Backup & Disaster Recovery</h3>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">
          All financial vouchers, invoices, muster roll wages, and site ledgers are stored securely on this computer. You can export a snapshot backup file or restore from a previous JSON archive anytime.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            onClick={exportDataJSON}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs border border-slate-700 cursor-pointer"
          >
            <Download className="w-4 h-4 text-emerald-400" /> Export Full Backup (.json)
          </button>

          <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs border border-slate-700 cursor-pointer">
            <Upload className="w-4 h-4 text-blue-400" /> Restore Backup (.json)
            <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
          </label>

          <button
            onClick={() => {
              if (confirm('Are you sure you want to clear all data and start completely fresh?')) {
                clearAllData();
                alert('All data has been cleared. You now have a fresh, clean database.');
              }
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-rose-950/40 text-rose-300 font-semibold text-xs border border-rose-900/50 cursor-pointer ml-auto"
          >
            <RotateCcw className="w-4 h-4" /> Clear All Data (Fresh Start)
          </button>
        </div>
      </div>

    </div>
  );
};
