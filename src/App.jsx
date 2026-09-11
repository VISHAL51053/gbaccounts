import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { DashboardHome } from './components/views/DashboardHome';
import { ProjectsView } from './components/views/ProjectsView';
import { InvoicesView } from './components/views/InvoicesView';
import { ExpensesView } from './components/views/ExpensesView';
import { LaborView } from './components/views/LaborView';
import { VendorsView } from './components/views/VendorsView';
import { BankingView } from './components/views/BankingView';
import { ReportsView } from './components/views/ReportsView';
import { SettingsView } from './components/views/SettingsView';

import { NewInvoiceModal } from './components/modals/NewInvoiceModal';
import { NewExpenseModal } from './components/modals/NewExpenseModal';
import { NewProjectModal } from './components/modals/NewProjectModal';
import { RecordPaymentModal } from './components/modals/RecordPaymentModal';
import { InvoicePrintModal } from './components/modals/InvoicePrintModal';

const MainLayout = () => {
  const { activeTab } = useApp();

  // Modals state
  const [isNewInvoiceOpen, setIsNewInvoiceOpen] = useState(false);
  const [isNewExpenseOpen, setIsNewExpenseOpen] = useState(false);
  const [isNewProjectOpen, setIsNewProjectOpen] = useState(false);
  const [paymentInvoice, setPaymentInvoice] = useState(null);

  const renderActiveView = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <DashboardHome 
            onOpenNewInvoice={() => setIsNewInvoiceOpen(true)}
            onOpenNewExpense={() => setIsNewExpenseOpen(true)}
            onOpenNewProject={() => setIsNewProjectOpen(true)}
          />
        );
      case 'projects':
        return (
          <ProjectsView 
            onOpenNewProject={() => setIsNewProjectOpen(true)}
          />
        );
      case 'invoices':
        return (
          <InvoicesView 
            onOpenNewInvoice={() => setIsNewInvoiceOpen(true)}
            onOpenRecordPayment={(inv) => setPaymentInvoice(inv)}
          />
        );
      case 'expenses':
        return (
          <ExpensesView 
            onOpenNewExpense={() => setIsNewExpenseOpen(true)}
          />
        );
      case 'labor':
        return <LaborView />;
      case 'vendors':
        return <VendorsView />;
      case 'banking':
        return <BankingView />;
      case 'reports':
        return <ReportsView />;
      case 'settings':
        return <SettingsView />;
      default:
        return (
          <DashboardHome 
            onOpenNewInvoice={() => setIsNewInvoiceOpen(true)}
            onOpenNewExpense={() => setIsNewExpenseOpen(true)}
            onOpenNewProject={() => setIsNewProjectOpen(true)}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar 
        onOpenNewInvoice={() => setIsNewInvoiceOpen(true)}
        onOpenNewExpense={() => setIsNewExpenseOpen(true)}
      />

      <div className="flex-1 flex flex-col md:flex-row max-w-7xl w-full mx-auto">
        <Sidebar />
        
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {renderActiveView()}
        </main>
      </div>

      {/* Global Modals */}
      <NewInvoiceModal 
        isOpen={isNewInvoiceOpen}
        onClose={() => setIsNewInvoiceOpen(false)}
      />

      <NewExpenseModal 
        isOpen={isNewExpenseOpen}
        onClose={() => setIsNewExpenseOpen(false)}
      />

      <NewProjectModal 
        isOpen={isNewProjectOpen}
        onClose={() => setIsNewProjectOpen(false)}
      />

      <RecordPaymentModal 
        isOpen={!!paymentInvoice}
        invoice={paymentInvoice}
        onClose={() => setPaymentInvoice(null)}
      />

      <InvoicePrintModal />
    </div>
  );
};

export function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}

export default App;
