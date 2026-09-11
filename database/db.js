import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbDir = process.env.DATA_DIR || (fs.existsSync('/var/data') ? '/var/data' : path.join(__dirname));
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'gurubaran_builders.db');
const db = new Database(dbPath);

// Enable Write-Ahead Logging and performance pragmas for ultra-fast response
db.pragma('journal_mode = WAL');
db.pragma('synchronous = NORMAL');
db.pragma('cache_size = -64000');
db.pragma('foreign_keys = ON');

// Initialize schema
db.exec(`
  -- Company Profile
  CREATE TABLE IF NOT EXISTS company_profile (
    id INTEGER PRIMARY KEY DEFAULT 1,
    name TEXT NOT NULL,
    tagline TEXT,
    gstin TEXT,
    pan TEXT,
    phone TEXT,
    email TEXT,
    website TEXT,
    address TEXT,
    bank_name TEXT,
    account_name TEXT,
    account_number TEXT,
    ifsc_code TEXT,
    branch TEXT,
    terms TEXT
  );

  -- Construction Sites / Projects
  CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    client TEXT NOT NULL,
    client_phone TEXT,
    location TEXT NOT NULL,
    type TEXT DEFAULT 'Residential Apartment',
    total_area_sqft REAL DEFAULT 0,
    budget REAL NOT NULL DEFAULT 0,
    spent REAL NOT NULL DEFAULT 0,
    progress INTEGER DEFAULT 0,
    status TEXT DEFAULT 'In Progress',
    supervisor TEXT,
    start_date TEXT,
    estimated_completion TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Raw Materials & Site Purchases
  CREATE TABLE IF NOT EXISTS materials (
    id TEXT PRIMARY KEY,
    date TEXT NOT NULL,
    category TEXT NOT NULL,
    item TEXT NOT NULL,
    project_id TEXT,
    project_name TEXT,
    vendor TEXT,
    amount REAL NOT NULL,
    tax_amount REAL DEFAULT 0,
    payment_mode TEXT,
    bill_number TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE SET NULL
  );

  -- Labor Workforce & Muster Roll
  CREATE TABLE IF NOT EXISTS labor_roster (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    daily_rate REAL NOT NULL,
    phone TEXT,
    site_assigned TEXT,
    day_name TEXT DEFAULT 'Monday',
    duty TEXT DEFAULT '1 Duty',
    total_amount REAL DEFAULT 950,
    days_present INTEGER DEFAULT 0,
    advance_paid REAL DEFAULT 0,
    status TEXT DEFAULT 'Active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Vendors & Material Suppliers
  CREATE TABLE IF NOT EXISTS vendors (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    contact_person TEXT,
    phone TEXT,
    category TEXT,
    gstin TEXT,
    address TEXT,
    balance_due REAL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Cash & Bank Accounts
  CREATE TABLE IF NOT EXISTS accounts (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    account_number TEXT,
    bank TEXT,
    type TEXT,
    balance REAL DEFAULT 0
  );

  -- Transactions
  CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY,
    date TEXT NOT NULL,
    type TEXT NOT NULL,
    account_id TEXT,
    account_name TEXT,
    category TEXT,
    amount REAL NOT NULL,
    party TEXT,
    project TEXT,
    reference TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Admin User Authentication (Single Personal Account)
  CREATE TABLE IF NOT EXISTS admin_user (
    id INTEGER PRIMARY KEY DEFAULT 1,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    last_login DATETIME
  );

  -- Supplier Payments (Recorded payments to material suppliers per site)
  CREATE TABLE IF NOT EXISTS supplier_payments (
    id TEXT PRIMARY KEY,
    vendor TEXT NOT NULL,
    project_name TEXT NOT NULL,
    amount REAL NOT NULL,
    date TEXT NOT NULL,
    payment_mode TEXT DEFAULT 'Cash in Hand',
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Weekly Labour Attendance History & Site-Wise Archive
  CREATE TABLE IF NOT EXISTS labor_weekly_history (
    id TEXT PRIMARY KEY,
    week_label TEXT NOT NULL,
    week_ending TEXT NOT NULL,
    total_workers INTEGER DEFAULT 0,
    total_shifts REAL DEFAULT 0,
    total_wages REAL DEFAULT 0,
    masons_count INTEGER DEFAULT 0,
    helpers_count INTEGER DEFAULT 0,
    site_breakdown_json TEXT,
    workers_data_json TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Performance Query Indices
  CREATE INDEX IF NOT EXISTS idx_projects_created ON projects(created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_materials_proj_name ON materials(project_name);
  CREATE INDEX IF NOT EXISTS idx_labor_site ON labor_roster(site_assigned);
  CREATE INDEX IF NOT EXISTS idx_txn_proj ON transactions(project);
  CREATE INDEX IF NOT EXISTS idx_supp_pay_vend ON supplier_payments(vendor);
  CREATE INDEX IF NOT EXISTS idx_lab_hist_created ON labor_weekly_history(created_at DESC);
`);

// Safe migrations for labor_roster columns
try { db.exec(`ALTER TABLE labor_roster ADD COLUMN day_name TEXT DEFAULT 'Monday'`); } catch(e) {}
try { db.exec(`ALTER TABLE labor_roster ADD COLUMN duty TEXT DEFAULT '1 Duty'`); } catch(e) {}
try { db.exec(`ALTER TABLE labor_roster ADD COLUMN total_amount REAL DEFAULT 950`); } catch(e) {}

try { db.exec(`ALTER TABLE labor_roster ADD COLUMN mon_duty TEXT DEFAULT '-'`); } catch(e) {}
try { db.exec(`ALTER TABLE labor_roster ADD COLUMN tue_duty TEXT DEFAULT '-'`); } catch(e) {}
try { db.exec(`ALTER TABLE labor_roster ADD COLUMN wed_duty TEXT DEFAULT '-'`); } catch(e) {}
try { db.exec(`ALTER TABLE labor_roster ADD COLUMN thu_duty TEXT DEFAULT '-'`); } catch(e) {}
try { db.exec(`ALTER TABLE labor_roster ADD COLUMN fri_duty TEXT DEFAULT '-'`); } catch(e) {}
try { db.exec(`ALTER TABLE labor_roster ADD COLUMN sat_duty TEXT DEFAULT '-'`); } catch(e) {}
try { db.exec(`ALTER TABLE labor_roster ADD COLUMN sun_duty TEXT DEFAULT '-'`); } catch(e) {}

try { db.exec(`ALTER TABLE labor_roster ADD COLUMN mon_amt REAL DEFAULT 0`); } catch(e) {}
try { db.exec(`ALTER TABLE labor_roster ADD COLUMN tue_amt REAL DEFAULT 0`); } catch(e) {}
try { db.exec(`ALTER TABLE labor_roster ADD COLUMN wed_amt REAL DEFAULT 0`); } catch(e) {}
try { db.exec(`ALTER TABLE labor_roster ADD COLUMN thu_amt REAL DEFAULT 0`); } catch(e) {}
try { db.exec(`ALTER TABLE labor_roster ADD COLUMN fri_amt REAL DEFAULT 0`); } catch(e) {}
try { db.exec(`ALTER TABLE labor_roster ADD COLUMN sat_amt REAL DEFAULT 0`); } catch(e) {}
try { db.exec(`ALTER TABLE labor_roster ADD COLUMN sun_amt REAL DEFAULT 0`); } catch(e) {}

try { db.exec(`ALTER TABLE labor_roster ADD COLUMN week_label TEXT DEFAULT ''`); } catch(e) {}

try { db.exec(`ALTER TABLE labor_roster ADD COLUMN mon_site TEXT DEFAULT ''`); } catch(e) {}
try { db.exec(`ALTER TABLE labor_roster ADD COLUMN tue_site TEXT DEFAULT ''`); } catch(e) {}
try { db.exec(`ALTER TABLE labor_roster ADD COLUMN wed_site TEXT DEFAULT ''`); } catch(e) {}
try { db.exec(`ALTER TABLE labor_roster ADD COLUMN thu_site TEXT DEFAULT ''`); } catch(e) {}
try { db.exec(`ALTER TABLE labor_roster ADD COLUMN fri_site TEXT DEFAULT ''`); } catch(e) {}
try { db.exec(`ALTER TABLE labor_roster ADD COLUMN sat_site TEXT DEFAULT ''`); } catch(e) {}
try { db.exec(`ALTER TABLE labor_roster ADD COLUMN sun_site TEXT DEFAULT ''`); } catch(e) {}

// Safe migrations for vendors table
try { db.exec(`ALTER TABLE vendors ADD COLUMN role TEXT DEFAULT 'Raw Materials'`); } catch(e) {}

// Automatic cleanup for test / demo supplier payments
try { db.prepare("DELETE FROM supplier_payments WHERE LOWER(vendor) LIKE '%palk%' OR id = 'SPAY-09000' OR (amount = 9000 AND vendor = 'AMMAN PRAKASH')").run(); } catch(e) {}

// Seed default personal owner credentials
const checkAdmin = db.prepare('SELECT id, username FROM admin_user WHERE id = 1').get();
if (!checkAdmin) {
  db.prepare(`
    INSERT INTO admin_user (id, username, password)
    VALUES (1, 'gurubaran', 'admin123')
  `).run();
} else if (checkAdmin.username === 'guruburan') {
  db.prepare(`UPDATE admin_user SET username = 'gurubaran' WHERE id = 1`).run();
}

// Seed default company profile and accounts if empty
const checkProfile = db.prepare('SELECT id, name FROM company_profile WHERE id = 1').get();
if (!checkProfile) {
  db.prepare(`
    INSERT INTO company_profile (
      id, name, tagline, gstin, pan, phone, email, website, address, bank_name, account_name, account_number, ifsc_code, branch, terms
    ) VALUES (
      1, 
      'GURUBARAN BUILDERS', 
      'Quality Construction & Civil Engineering Excellence', 
      '', 
      '', 
      '+91 98401 23456', 
      'info@gurubaranbuilders.com', 
      'www.gurubaranbuilders.com', 
      'Chennai, Tamil Nadu', 
      'State Bank of India', 
      'GURUBARAN BUILDERS', 
      '', 
      '', 
      'Chennai Branch', 
      '1. Advance payment with work order. 2. Stage-wise payment as per engineering measurement sheet.'
    )
  `).run();
} else if (checkProfile.name.includes('GURUBURAN')) {
  db.prepare(`
    UPDATE company_profile 
    SET name = 'GURUBARAN BUILDERS', 
        email = 'info@gurubaranbuilders.com', 
        website = 'www.gurubaranbuilders.com',
        account_name = 'GURUBARAN BUILDERS'
    WHERE id = 1
  `).run();
}

const checkAccounts = db.prepare('SELECT COUNT(*) as count FROM accounts').get();
if (checkAccounts.count === 0) {
  const insertAcc = db.prepare('INSERT INTO accounts (id, name, account_number, bank, type, balance) VALUES (?, ?, ?, ?, ?, ?)');
  insertAcc.run('ACC-01', 'Primary Bank Current Account', 'XXXXXXXXXXXX', 'State Bank of India', 'Current Account', 0);
  insertAcc.run('ACC-02', 'Cash in Hand (HQ)', 'N/A', 'Cash Vault', 'Cash', 0);
  insertAcc.run('ACC-03', 'Site Petty Cash', 'N/A', 'Site Cash', 'Petty Cash', 0);
}

export default db;
export { dbPath };
