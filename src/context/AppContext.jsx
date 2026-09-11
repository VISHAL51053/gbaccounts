import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  initialCompanyProfile,
  initialProjects,
  initialInvoices,
  initialExpenses,
  initialLaborRoster,
  initialVendors,
  initialAccounts,
  initialTransactions
} from '../data/initialData';

const AppContext = createContext();

// Updated storage keys for clean fresh start
const STORAGE_KEYS = {
  PROFILE: 'gb_v3_profile',
  PROJECTS: 'gb_v3_projects',
  INVOICES: 'gb_v3_invoices',
  EXPENSES: 'gb_v3_expenses',
  LABOR: 'gb_v3_labor',
  VENDORS: 'gb_v3_vendors',
  ACCOUNTS: 'gb_v3_accounts',
  TRANSACTIONS: 'gb_v3_transactions',
};

export const AppProvider = ({ children }) => {
  const [companyProfile, setCompanyProfile] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PROFILE);
    return saved ? JSON.parse(saved) : initialCompanyProfile;
  });

  const [projects, setProjects] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PROJECTS);
    return saved ? JSON.parse(saved) : initialProjects;
  });

  const [invoices, setInvoices] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.INVOICES);
    return saved ? JSON.parse(saved) : initialInvoices;
  });

  const [expenses, setExpenses] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.EXPENSES);
    return saved ? JSON.parse(saved) : initialExpenses;
  });

  const [laborRoster, setLaborRoster] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.LABOR);
    return saved ? JSON.parse(saved) : initialLaborRoster;
  });

  const [vendors, setVendors] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.VENDORS);
    return saved ? JSON.parse(saved) : initialVendors;
  });

  const [accounts, setAccounts] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ACCOUNTS);
    return saved ? JSON.parse(saved) : initialAccounts;
  });

  const [transactions, setTransactions] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    return saved ? JSON.parse(saved) : initialTransactions;
  });

  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedInvoiceForPrint, setSelectedInvoiceForPrint] = useState(null);

  // Fetch from SQLite database on initial load
  useEffect(() => {
    const fetchSQLiteData = async () => {
      try {
        const [projRes, expRes, labRes, compRes] = await Promise.all([
          fetch('http://localhost:5000/api/projects'),
          fetch('http://localhost:5000/api/materials'),
          fetch('http://localhost:5000/api/labor'),
          fetch('http://localhost:5000/api/company')
        ]);

        if (projRes.ok) {
          const projData = await projRes.json();
          if (Array.isArray(projData)) setProjects(projData);
        }
        if (expRes.ok) {
          const expData = await expRes.json();
          if (Array.isArray(expData) && expData.length > 0) {
            setExpenses(expData.map(m => ({
              id: m.id,
              date: m.date,
              category: m.category,
              item: m.item,
              projectName: m.project_name,
              projectId: m.project_id,
              vendor: m.vendor,
              amount: m.amount,
              billNumber: m.bill_number,
              status: 'Paid'
            })));
          }
        }
        if (compRes.ok) {
          const compData = await compRes.json();
          if (compData && compData.name) {
            setCompanyProfile(prev => ({
              ...prev,
              name: compData.name,
              tagline: compData.tagline || prev.tagline,
              address: compData.address || prev.address,
              phone: compData.phone || prev.phone
            }));
          }
        }
      } catch (err) {
        console.warn('SQLite API backend sync offline fallback:', err);
      }
    };

    fetchSQLiteData();
  }, []);

  // Sync with LocalStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(companyProfile));
  }, [companyProfile]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
  }, [projects]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(invoices));
  }, [invoices]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.LABOR, JSON.stringify(laborRoster));
  }, [laborRoster]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.VENDORS, JSON.stringify(vendors));
  }, [vendors]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(accounts));
  }, [accounts]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
  }, [transactions]);

  // Project Actions
  const addProject = async (projectData) => {
    const tempId = `PRJ-${Math.floor(100 + Math.random() * 900)}`;
    const newProject = {
      ...projectData,
      id: tempId,
      spent: 0,
      progress: projectData.progress || 10,
      status: projectData.status || 'In Progress'
    };
    
    // Instant optimistic update
    setProjects(prev => [newProject, ...prev]);

    // Persist to SQLite Database
    try {
      const res = await fetch('http://localhost:5000/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newProject.name,
          client: newProject.client,
          location: newProject.location,
          budget: newProject.budget || 0,
          supervisor: newProject.supervisor || ''
        })
      });
      if (res.ok) {
        const created = await res.json();
        if (created && created.id) {
          setProjects(prev => prev.map(p => p.id === tempId ? created : p));
        }
      }
    } catch (err) {
      console.warn('SQLite project sync error:', err);
    }

    return newProject;
  };

  const updateProject = (id, updatedData) => {
    setProjects(prev => prev.map(p => p.id === id ? { ...p, ...updatedData } : p));
  };

  const deleteProject = async (id) => {
    // Instant optimistic delete
    setProjects(prev => prev.filter(p => p.id !== id));

    try {
      await fetch(`http://localhost:5000/api/projects/${id}`, { method: 'DELETE' });
    } catch (err) {
      console.warn('SQLite project delete error:', err);
    }
  };

  // Invoice Actions
  const addInvoice = (invoiceData) => {
    const newInvoice = {
      ...invoiceData,
      id: `INV-${new Date().getFullYear()}-${String(invoices.length + 1).padStart(3, '0')}`,
      balance: invoiceData.totalAmount - (invoiceData.paidAmount || 0),
      status: (invoiceData.paidAmount >= invoiceData.totalAmount) ? 'Paid' : (invoiceData.paidAmount > 0 ? 'Partially Paid' : 'Unpaid')
    };

    setInvoices(prev => [newInvoice, ...prev]);

    if (newInvoice.paidAmount > 0) {
      const defaultAcc = accounts[0];
      const newTxn = {
        id: `TXN-${Math.floor(800 + Math.random() * 900)}`,
        date: newInvoice.date || new Date().toISOString().split('T')[0],
        type: 'Income',
        accountId: defaultAcc?.id || 'ACC-01',
        accountName: defaultAcc?.name || 'Primary Bank Current Account',
        category: 'Client Billing Milestone',
        amount: Number(newInvoice.paidAmount),
        party: `${newInvoice.clientName} (${newInvoice.invoiceNumber})`,
        project: newInvoice.projectName,
        reference: newInvoice.paymentMode || 'Online Payment',
        status: 'Completed'
      };
      setTransactions(prev => [newTxn, ...prev]);

      if (defaultAcc) {
        setAccounts(prev => prev.map(acc => 
          acc.id === defaultAcc.id 
            ? { ...acc, balance: acc.balance + Number(newInvoice.paidAmount) }
            : acc
        ));
      }
    }
    return newInvoice;
  };

  const updateInvoice = (id, updatedData) => {
    setInvoices(prev => prev.map(inv => {
      if (inv.id === id) {
        const total = updatedData.totalAmount !== undefined ? updatedData.totalAmount : inv.totalAmount;
        const paid = updatedData.paidAmount !== undefined ? updatedData.paidAmount : inv.paidAmount;
        const balance = total - paid;
        const status = paid >= total ? 'Paid' : (paid > 0 ? 'Partially Paid' : 'Unpaid');
        return { ...inv, ...updatedData, balance, status };
      }
      return inv;
    }));
  };

  const recordInvoicePayment = (invoiceId, amount, paymentMode, accountId) => {
    const inv = invoices.find(i => i.id === invoiceId);
    if (!inv) return;

    const numAmount = Number(amount);
    const newPaidAmount = Number(inv.paidAmount || 0) + numAmount;
    const newBalance = Math.max(0, Number(inv.totalAmount) - newPaidAmount);
    const newStatus = newBalance === 0 ? 'Paid' : 'Partially Paid';

    setInvoices(prev => prev.map(i => i.id === invoiceId ? {
      ...i,
      paidAmount: newPaidAmount,
      balance: newBalance,
      status: newStatus,
      paymentDate: new Date().toISOString().split('T')[0],
      paymentMode: paymentMode
    } : i));

    const selectedAcc = accounts.find(a => a.id === accountId) || accounts[0];
    const newTxn = {
      id: `TXN-${Math.floor(800 + Math.random() * 900)}`,
      date: new Date().toISOString().split('T')[0],
      type: 'Income',
      accountId: selectedAcc?.id,
      accountName: selectedAcc?.name,
      category: 'Client Billing Milestone',
      amount: numAmount,
      party: `${inv.clientName} (${inv.invoiceNumber})`,
      project: inv.projectName,
      reference: paymentMode,
      status: 'Completed'
    };
    setTransactions(prev => [newTxn, ...prev]);

    if (selectedAcc) {
      setAccounts(prev => prev.map(acc => 
        acc.id === selectedAcc.id 
          ? { ...acc, balance: acc.balance + numAmount }
          : acc
      ));
    }
  };

  const deleteInvoice = (id) => {
    setInvoices(prev => prev.filter(inv => inv.id !== id));
  };

  // Expense Actions
  const addExpense = (expenseData) => {
    const newExpense = {
      ...expenseData,
      id: `EXP-${Math.floor(300 + Math.random() * 900)}`,
      status: expenseData.status || 'Paid'
    };
    setExpenses(prev => [newExpense, ...prev]);

    // Update project spent
    if (newExpense.projectId) {
      setProjects(prev => prev.map(proj => 
        proj.id === newExpense.projectId 
          ? { ...proj, spent: Number(proj.spent || 0) + Number(newExpense.amount) }
          : proj
      ));
    }

    // Add transaction
    const targetAcc = accounts.find(a => a.name.toLowerCase().includes(expenseData.paymentMode?.toLowerCase())) || accounts[0];
    const newTxn = {
      id: `TXN-${Math.floor(800 + Math.random() * 900)}`,
      date: newExpense.date || new Date().toISOString().split('T')[0],
      type: 'Expense',
      accountId: targetAcc?.id || 'ACC-01',
      accountName: targetAcc?.name || 'Primary Bank Current Account',
      category: `${newExpense.category} - ${newExpense.item?.slice(0, 24)}...`,
      amount: Number(newExpense.amount),
      party: newExpense.vendor || 'Site Expense',
      project: newExpense.projectName || 'General',
      reference: newExpense.billNumber || newExpense.paymentMode,
      status: 'Completed'
    };
    setTransactions(prev => [newTxn, ...prev]);

    if (targetAcc) {
      setAccounts(prev => prev.map(acc => 
        acc.id === targetAcc.id 
          ? { ...acc, balance: Math.max(0, acc.balance - Number(newExpense.amount)) }
          : acc
      ));
    }
    return newExpense;
  };

  const deleteExpense = (id) => {
    const exp = expenses.find(e => e.id === id);
    if (exp && exp.projectId) {
      setProjects(prev => prev.map(proj => 
        proj.id === exp.projectId 
          ? { ...proj, spent: Math.max(0, Number(proj.spent || 0) - Number(exp.amount)) }
          : proj
      ));
    }
    setExpenses(prev => prev.filter(e => e.id !== id));
  };

  // Labor Actions
  const addLabor = (laborData) => {
    const newWorker = {
      ...laborData,
      id: `LAB-${String(laborRoster.length + 1).padStart(2, '0')}`,
      status: 'Active',
      daysPresentThisMonth: Number(laborData.daysPresentThisMonth || 0),
      advancePaid: Number(laborData.advancePaid || 0)
    };
    setLaborRoster(prev => [newWorker, ...prev]);
  };

  const updateLabor = (id, updatedData) => {
    setLaborRoster(prev => prev.map(w => w.id === id ? { ...w, ...updatedData } : w));
  };

  const deleteLabor = (id) => {
    setLaborRoster(prev => prev.filter(w => w.id !== id));
  };

  // Vendor Actions
  const addVendor = (vendorData) => {
    const newVendor = {
      ...vendorData,
      id: `VND-${String(vendors.length + 1).padStart(2, '0')}`,
      balanceDue: Number(vendorData.balanceDue || 0)
    };
    setVendors(prev => [newVendor, ...prev]);
  };

  const updateVendor = (id, updatedData) => {
    setVendors(prev => prev.map(v => v.id === id ? { ...v, ...updatedData } : v));
  };

  const deleteVendor = (id) => {
    setVendors(prev => prev.filter(v => v.id !== id));
  };

  // Account Transfer
  const transferFunds = (fromAccId, toAccId, amount, notes) => {
    const numAmount = Number(amount);
    setAccounts(prev => prev.map(acc => {
      if (acc.id === fromAccId) return { ...acc, balance: acc.balance - numAmount };
      if (acc.id === toAccId) return { ...acc, balance: acc.balance + numAmount };
      return acc;
    }));

    const fromAcc = accounts.find(a => a.id === fromAccId);
    const toAcc = accounts.find(a => a.id === toAccId);

    const newTxn = {
      id: `TXN-${Math.floor(800 + Math.random() * 900)}`,
      date: new Date().toISOString().split('T')[0],
      type: 'Transfer',
      accountId: fromAccId,
      accountName: `${fromAcc?.name} -> ${toAcc?.name}`,
      category: 'Internal Fund Transfer',
      amount: numAmount,
      party: 'Internal Transfer',
      project: 'HQ Accounts',
      reference: notes || 'Bank Transfer',
      status: 'Completed'
    };
    setTransactions(prev => [newTxn, ...prev]);
  };

  // Calculations
  const totalRevenue = invoices.reduce((acc, curr) => acc + Number(curr.paidAmount || 0), 0);
  const totalInvoiced = invoices.reduce((acc, curr) => acc + Number(curr.totalAmount || 0), 0);
  const totalExpenses = expenses.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
  const netProfit = totalRevenue - totalExpenses;
  const totalReceivables = invoices.reduce((acc, curr) => acc + Number(curr.balance || 0), 0);
  const totalPayables = vendors.reduce((acc, curr) => acc + Number(curr.balanceDue || 0), 0);
  const totalCashBankBalance = accounts.reduce((acc, curr) => acc + Number(curr.balance || 0), 0);

  // Backup and Restore
  const exportDataJSON = () => {
    const fullData = {
      companyProfile,
      projects,
      invoices,
      expenses,
      laborRoster,
      vendors,
      accounts,
      transactions,
      exportDate: new Date().toISOString()
    };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(fullData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `GURUBARAN_BUILDERS_ACCOUNTS_BACKUP_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const importDataJSON = (jsonData) => {
    if (jsonData.companyProfile) setCompanyProfile(jsonData.companyProfile);
    if (jsonData.projects) setProjects(jsonData.projects);
    if (jsonData.invoices) setInvoices(jsonData.invoices);
    if (jsonData.expenses) setExpenses(jsonData.expenses);
    if (jsonData.laborRoster) setLaborRoster(jsonData.laborRoster);
    if (jsonData.vendors) setVendors(jsonData.vendors);
    if (jsonData.accounts) setAccounts(jsonData.accounts);
    if (jsonData.transactions) setTransactions(jsonData.transactions);
  };

  const clearAllData = () => {
    setCompanyProfile(initialCompanyProfile);
    setProjects([]);
    setInvoices([]);
    setExpenses([]);
    setLaborRoster([]);
    setVendors([]);
    setAccounts(initialAccounts);
    setTransactions([]);
    localStorage.clear();
  };

  return (
    <AppContext.Provider
      value={{
        companyProfile,
        setCompanyProfile,
        projects,
        invoices,
        expenses,
        laborRoster,
        vendors,
        accounts,
        transactions,
        activeTab,
        setActiveTab,
        selectedInvoiceForPrint,
        setSelectedInvoiceForPrint,
        // Actions
        addProject,
        updateProject,
        deleteProject,
        addInvoice,
        updateInvoice,
        deleteInvoice,
        recordInvoicePayment,
        addExpense,
        deleteExpense,
        addLabor,
        updateLabor,
        deleteLabor,
        addVendor,
        updateVendor,
        deleteVendor,
        transferFunds,
        // Stats
        totalRevenue,
        totalInvoiced,
        totalExpenses,
        netProfit,
        totalReceivables,
        totalPayables,
        totalCashBankBalance,
        // Backup & Clear
        exportDataJSON,
        importDataJSON,
        clearAllData
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
