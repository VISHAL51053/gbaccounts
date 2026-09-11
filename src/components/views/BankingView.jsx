import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Landmark, 
  ArrowRightLeft, 
  Wallet, 
  ArrowUpRight, 
  ArrowDownRight, 
  Plus, 
  CreditCard,
  Building,
  DollarSign
} from 'lucide-react';
import { formatINR, formatDate } from '../../utils/formatters';

export const BankingView = () => {
  const { accounts, transactions, transferFunds } = useApp();
  const [showTransferModal, setShowTransferModal] = useState(false);
  
  const [transferData, setTransferData] = useState({
    fromAccId: accounts[0]?.id || '',
    toAccId: accounts[1]?.id || '',
    amount: '',
    notes: 'Site Operational Cash Replenishment'
  });

  const handleTransfer = (e) => {
    e.preventDefault();
    if (!transferData.amount || Number(transferData.amount) <= 0) return;
    if (transferData.fromAccId === transferData.toAccId) {
      alert('Source and destination accounts must be different!');
      return;
    }

    transferFunds(transferData.fromAccId, transferData.toAccId, Number(transferData.amount), transferData.notes);
    setShowTransferModal(false);
    setTransferData({
      fromAccId: accounts[0]?.id || '',
      toAccId: accounts[1]?.id || '',
      amount: '',
      notes: ''
    });
    alert('Fund transfer recorded successfully!');
  };

  const totalFunds = accounts.reduce((acc, a) => acc + Number(a.balance || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white m-0 tracking-tight">Bank & Cash Accounts (Cash Book)</h2>
          <p className="text-xs text-slate-400">Current accounts, overdraft facilities, site petty cash vaults, and transaction logs</p>
        </div>
        <button
          onClick={() => setShowTransferModal(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm shadow-md shadow-amber-500/20 cursor-pointer shrink-0"
        >
          <ArrowRightLeft className="w-4 h-4" /> Transfer Funds
        </button>
      </div>

      {/* Account Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {accounts.map((acc) => (
          <div key={acc.id} className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-md flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 uppercase">
                  {acc.type}
                </span>
                <Landmark className="w-5 h-5 text-amber-400" />
              </div>
              <h3 className="text-base font-bold text-white mt-2">{acc.name}</h3>
              <p className="text-xs text-slate-400 font-mono">A/C: {acc.accountNumber}</p>
            </div>

            <div className="pt-3 border-t border-slate-800">
              <span className="text-[11px] text-slate-400 block font-semibold">Available Balance</span>
              <span className="text-2xl font-black text-emerald-400 font-mono">{formatINR(acc.balance)}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Transactions Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-md overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Cash & Bank Ledger Transactions</h3>
          <span className="text-xs text-slate-400 font-semibold">Live Audit Trail</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-[11px] uppercase tracking-wider text-slate-400 bg-slate-800/80 border-b border-slate-700">
              <tr>
                <th className="py-3.5 px-4 font-bold">Date</th>
                <th className="py-3.5 px-4 font-bold">Type</th>
                <th className="py-3.5 px-4 font-bold">Account Book</th>
                <th className="py-3.5 px-4 font-bold">Party / Description</th>
                <th className="py-3.5 px-4 font-bold">Site / Project</th>
                <th className="py-3.5 px-4 font-bold">Ref #</th>
                <th className="py-3.5 px-4 font-bold text-right">Debit (Out)</th>
                <th className="py-3.5 px-4 font-bold text-right">Credit (In)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 font-medium">
              {transactions.map((txn) => {
                const isIncome = txn.type === 'Income';
                const isExpense = txn.type === 'Expense';
                const isTransfer = txn.type === 'Transfer';

                return (
                  <tr key={txn.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 text-slate-300 whitespace-nowrap">{formatDate(txn.date)}</td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-1 ${
                        isIncome ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                        isExpense ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                        'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      }`}>
                        {isIncome && <ArrowUpRight className="w-3 h-3" />}
                        {isExpense && <ArrowDownRight className="w-3 h-3" />}
                        {isTransfer && <ArrowRightLeft className="w-3 h-3" />}
                        {txn.type}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-200">{txn.accountName}</td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-white">{txn.party}</div>
                      <div className="text-[11px] text-slate-400">{txn.category}</div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">{txn.project}</td>
                    <td className="py-3.5 px-4 font-mono text-slate-400 text-[11px]">{txn.reference || '-'}</td>
                    
                    {/* Debit Column */}
                    <td className="py-3.5 px-4 font-mono font-bold text-rose-400 text-right text-sm">
                      {isExpense ? formatINR(txn.amount) : isTransfer ? formatINR(txn.amount) : '-'}
                    </td>

                    {/* Credit Column */}
                    <td className="py-3.5 px-4 font-mono font-bold text-emerald-400 text-right text-sm">
                      {isIncome ? formatINR(txn.amount) : isTransfer ? formatINR(txn.amount) : '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Transfer Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white">Inter-Account Fund Transfer</h3>
            <form onSubmit={handleTransfer} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">From Account (Source) *</label>
                <select
                  value={transferData.fromAccId}
                  onChange={(e) => setTransferData({ ...transferData, fromAccId: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm"
                >
                  {accounts.map(a => (
                    <option key={a.id} value={a.id}>{a.name} ({formatINR(a.balance)})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">To Account (Destination) *</label>
                <select
                  value={transferData.toAccId}
                  onChange={(e) => setTransferData({ ...transferData, toAccId: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm"
                >
                  {accounts.map(a => (
                    <option key={a.id} value={a.id}>{a.name} ({formatINR(a.balance)})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Transfer Amount (₹) *</label>
                <input
                  type="number"
                  required
                  value={transferData.amount}
                  onChange={(e) => setTransferData({ ...transferData, amount: e.target.value })}
                  placeholder="Enter amount"
                  className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Transfer Note / Purpose</label>
                <input
                  type="text"
                  value={transferData.notes}
                  onChange={(e) => setTransferData({ ...transferData, notes: e.target.value })}
                  placeholder="e.g. Site Petty Cash Top-up"
                  className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowTransferModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold cursor-pointer"
                >
                  Execute Transfer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
