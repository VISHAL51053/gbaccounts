import React, { useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Printer, 
  Download, 
  X, 
  Building2, 
  CheckCircle, 
  ShieldCheck,
  Phone,
  Mail,
  Landmark
} from 'lucide-react';
import { formatINR, formatDate } from '../../utils/formatters';

export const InvoicePrintModal = () => {
  const { selectedInvoiceForPrint, setSelectedInvoiceForPrint, companyProfile } = useApp();
  const invoiceRef = useRef(null);

  if (!selectedInvoiceForPrint) return null;

  const inv = selectedInvoiceForPrint;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-sm p-4 overflow-y-auto">
      
      <div className="bg-slate-900 border border-slate-800 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[95vh]">
        
        {/* Modal Toolbar (hidden on print) */}
        <div className="p-4 bg-slate-850 border-b border-slate-800 flex items-center justify-between no-print shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-2.5 py-0.5 rounded bg-amber-500/20 text-amber-300">
              TAX INVOICE PREVIEW
            </span>
            <span className="text-sm font-bold text-white font-mono">{inv.invoiceNumber}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-all cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" /> Print / Save as PDF
            </button>
            <button
              onClick={() => setSelectedInvoiceForPrint(null)}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Invoice Body */}
        <div className="p-8 sm:p-12 overflow-y-auto bg-white text-slate-900 font-sans print:p-0 print:m-0" ref={invoiceRef}>
          
          {/* Header */}
          <div className="border-b-2 border-slate-900 pb-6 mb-6">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded bg-slate-900 flex items-center justify-center text-amber-400 font-black">
                    GB
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight uppercase m-0">
                    {companyProfile.name || "GURUBARAN BUILDERS"}
                  </h1>
                </div>
                <p className="text-xs font-bold text-amber-700 mt-1 uppercase tracking-wide">
                  {companyProfile.tagline || "Quality Construction & Civil Engineering Excellence"}
                </p>
                <p className="text-xs text-slate-600 mt-1 max-w-md leading-relaxed">
                  {companyProfile.address}
                </p>
                <div className="text-xs text-slate-700 font-medium mt-1.5 space-x-3">
                  <span><strong>GSTIN:</strong> {companyProfile.gstin}</span>
                  <span><strong>PAN:</strong> {companyProfile.pan}</span>
                </div>
              </div>

              <div className="text-right sm:text-right w-full sm:w-auto">
                <div className="inline-block bg-slate-900 text-white px-4 py-1 rounded text-sm font-black uppercase tracking-widest">
                  TAX INVOICE
                </div>
                <div className="mt-3 text-xs space-y-1">
                  <div><strong className="text-slate-500">Invoice No:</strong> <span className="font-bold text-slate-950 font-mono">{inv.invoiceNumber}</span></div>
                  <div><strong className="text-slate-500">Invoice Date:</strong> <span className="font-semibold text-slate-900">{formatDate(inv.date)}</span></div>
                  <div><strong className="text-slate-500">Payment Due:</strong> <span className="font-semibold text-slate-900">{formatDate(inv.dueDate)}</span></div>
                </div>
              </div>
            </div>
          </div>

          {/* Client & Project Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6 text-xs bg-slate-50 p-4 rounded-lg border border-slate-200">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Billed To (Client):</span>
              <div className="text-sm font-bold text-slate-950">{inv.clientName}</div>
              <div className="text-slate-600 mt-0.5">{inv.clientAddress || 'Chennai'}</div>
              <div className="text-slate-600 mt-0.5">Phone: {inv.clientPhone || '-'}</div>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Site / Construction Project:</span>
              <div className="text-sm font-bold text-slate-950">{inv.projectName}</div>
              <div className="text-slate-600 mt-0.5">Project Ref Code: {inv.projectId || 'GB-SITE'}</div>
              <div className="mt-1">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  inv.status === 'Paid' ? 'bg-emerald-100 text-emerald-800' :
                  inv.status === 'Partially Paid' ? 'bg-blue-100 text-blue-800' : 'bg-rose-100 text-rose-800'
                }`}>
                  Status: {inv.status.toUpperCase()}
                </span>
              </div>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="mb-6">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white uppercase text-[10px] tracking-wider">
                  <th className="p-3 font-bold w-12 text-center">#</th>
                  <th className="p-3 font-bold">Scope of Civil Work / Material Description</th>
                  <th className="p-3 font-bold text-center w-20">Qty</th>
                  <th className="p-3 font-bold text-center w-20">Unit</th>
                  <th className="p-3 font-bold text-right w-28">Rate (₹)</th>
                  <th className="p-3 font-bold text-right w-32">Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 border-b border-slate-300">
                {inv.items?.map((item, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                    <td className="p-3 text-center text-slate-500 font-bold">{idx + 1}</td>
                    <td className="p-3 font-semibold text-slate-900">{item.description}</td>
                    <td className="p-3 text-center font-mono">{item.qty}</td>
                    <td className="p-3 text-center text-slate-600">{item.unit}</td>
                    <td className="p-3 text-right font-mono">{item.rate?.toLocaleString('en-IN')}</td>
                    <td className="p-3 text-right font-mono font-bold text-slate-950">{item.amount?.toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals & Banking Details */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 text-xs">
            
            {/* Bank Info */}
            <div className="sm:col-span-7 bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">NEFT / RTGS Bank Details for Payment:</span>
              <div className="grid grid-cols-2 gap-2 text-slate-800">
                <div><strong>Bank Name:</strong> {companyProfile.bankDetails?.bankName}</div>
                <div><strong>Account Name:</strong> {companyProfile.bankDetails?.accountName}</div>
                <div><strong>Account No:</strong> <span className="font-mono font-bold">{companyProfile.bankDetails?.accountNumber}</span></div>
                <div><strong>IFSC Code:</strong> <span className="font-mono font-bold">{companyProfile.bankDetails?.ifscCode}</span></div>
                <div className="col-span-2"><strong>Branch:</strong> {companyProfile.bankDetails?.branch}</div>
              </div>
              <div className="pt-2 border-t border-slate-200 text-[11px] text-slate-500 italic">
                {companyProfile.terms}
              </div>
            </div>

            {/* Calculations Box */}
            <div className="sm:col-span-5 space-y-2">
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-600">Taxable Subtotal:</span>
                <span className="font-mono font-bold text-slate-900">{formatINR(inv.subtotal)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-600">GST (CGST 9% + SGST 9%):</span>
                <span className="font-mono font-semibold text-slate-800">{formatINR(inv.taxAmount)}</span>
              </div>
              <div className="flex justify-between py-2 border-b-2 border-slate-900 text-sm font-black">
                <span className="text-slate-950">Grand Total:</span>
                <span className="font-mono text-slate-950">{formatINR(inv.totalAmount)}</span>
              </div>
              <div className="flex justify-between py-1 text-slate-700">
                <span>Amount Paid:</span>
                <span className="font-mono font-semibold text-emerald-700">{formatINR(inv.paidAmount)}</span>
              </div>
              <div className="flex justify-between py-1.5 bg-amber-50 px-2 rounded font-bold text-amber-900">
                <span>Net Balance Due:</span>
                <span className="font-mono">{formatINR(inv.balance)}</span>
              </div>
            </div>

          </div>

          {/* Signatures */}
          <div className="mt-12 pt-8 border-t border-slate-300 flex justify-between items-end text-xs text-slate-600">
            <div>
              <p className="text-[11px]">Thank you for your business!</p>
              <p className="text-[10px] text-slate-400">Computer generated tax invoice • Valid without physical signature</p>
            </div>
            <div className="text-right">
              <div className="font-bold text-slate-900 uppercase">For {companyProfile.name}</div>
              <div className="h-12"></div>
              <div className="text-slate-700 font-semibold border-t border-slate-400 pt-1">Authorized Signatory</div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
