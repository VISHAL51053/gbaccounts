export const initialCompanyProfile = {
  name: "GURUBARAN BUILDERS",
  tagline: "Quality Construction & Civil Engineering Excellence",
  owner: "Gurubaran",
  gstin: "",
  pan: "",
  phone: "+91 ",
  email: "info@gurubaranbuilders.com",
  website: "www.gurubaranbuilders.com",
  address: "Chennai, Tamil Nadu",
  bankDetails: {
    bankName: "State Bank of India",
    accountName: "GURUBARAN BUILDERS",
    accountNumber: "",
    ifscCode: "",
    branch: ""
  },
  terms: "1. Advance payment with work order. 2. Stage-wise payment as per engineering measurement sheet. 3. All disputes subject to local jurisdiction."
};

export const initialProjects = [];

export const initialInvoices = [];

export const initialExpenses = [];

export const initialLaborRoster = [];

export const initialVendors = [];

export const initialAccounts = [
  {
    id: "ACC-01",
    name: "Primary Bank Current Account",
    accountNumber: "XXXXXXXXXXXX",
    bank: "State Bank of India",
    type: "Current Account",
    balance: 0,
    isDefault: true
  },
  {
    id: "ACC-02",
    name: "Cash in Hand (HQ)",
    accountNumber: "N/A",
    bank: "Cash Vault",
    type: "Cash",
    balance: 0,
    isDefault: false
  },
  {
    id: "ACC-03",
    name: "Site Petty Cash",
    accountNumber: "N/A",
    bank: "Site Cash",
    type: "Petty Cash",
    balance: 0,
    isDefault: false
  }
];

export const initialTransactions = [];
