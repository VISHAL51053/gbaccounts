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

// Seed default projects if empty
const checkProjects = db.prepare('SELECT COUNT(*) as count FROM projects').get();
if (checkProjects.count === 0) {
  const pStmt = db.prepare('INSERT INTO projects (id, name, client, client_phone, location, type, total_area_sqft, budget, spent, progress, status, supervisor, start_date, estimated_completion, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
  const defaultProjects = [
    ['PRJ-907', 'Site RK6', 'Rangamma kovil', '', 'Sipcot', 'Residential', 0, 0, 0, 10, 'In Progress', 'Civil Engg', '', '', ''],
    ['PRJ-918', 'Site R1', 'Ravi', '', 'Perumapalayam', 'Residential', 0, 0, 0, 10, 'In Progress', 'Civil Engg', '', '', ''],
    ['PRJ-930', 'Site P1', 'Dharun Rani', '', 'Sullippalayam', 'Residential', 0, 0, 0, 10, 'In Progress', 'Civil Engg', '', '', ''],
    ['PRJ-563', 'Site RV', 'Ragupathy', '', 'Veeranampalayam', 'Residential', 0, 0, 0, 10, 'In Progress', 'Civil Engg', '', '', ''],
    ['PRJ-957', 'Site S1', 'Kannappan', '', 'Sullippalayam', 'Residential', 0, 0, 0, 10, 'In Progress', 'Civil Engg', '', '', ''],
    ['PRJ-635', 'Site AP', 'Ashok', '', 'Vijayamagalam', 'Residential', 0, 0, 0, 10, 'In Progress', 'Civil Engg', '', '', '']
  ];
  for (const p of defaultProjects) {
    pStmt.run(...p);
  }
}

// Seed default vendors if empty
const checkVendors = db.prepare('SELECT COUNT(*) as count FROM vendors').get();
if (checkVendors.count === 0) {
  const vStmt = db.prepare('INSERT INTO vendors (id, name, contact_person, phone, category, gstin, address, balance_due, role) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
  const defaultVendors = [
    ['VND-1', 'SRIDEVI STEELS', '', '', 'Materials Supplier', '', '', 0, 'Raw Materials'],
    ['VND-2', 'AMMAN PAINTS', '', '', 'Materials Supplier', '', '', 0, 'Raw Materials'],
    ['VND-3', 'AMMAN PRAKASH', '', '', 'Materials Supplier', '', '', 0, 'Raw Materials'],
    ['VND-4', 'PALLKARAR', '', '', 'Materials Supplier', '', '', 0, 'Raw Materials'],
    ['VND-5', 'SEKAR KAASI', '', '', 'Materials Supplier', '', '', 0, 'Raw Materials'],
    ['VND-6', 'GRIL MOHAN', '', '', 'Materials Supplier', '', '', 0, 'Raw Materials'],
    ['VND-7', 'BRICK MURUGESH', '', '', 'Materials Supplier', '', '', 0, 'Raw Materials'],
    ['VND-8', 'ELECT AATHI', '', '', 'Materials Supplier', '', '', 0, 'Raw Materials']
  ];
  for (const v of defaultVendors) {
    vStmt.run(...v);
  }
}

// Seed default materials if empty
const checkMats = db.prepare('SELECT COUNT(*) as count FROM materials').get();
if (checkMats.count === 0) {
  const mStmt = db.prepare('INSERT INTO materials (id, date, category, item, project_id, project_name, vendor, amount, tax_amount, payment_mode, bill_number, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
  const defaultMats = [
    ['MAT-64218', '2026-09-11', 'Raw Materials', 'Cement 40 Bags', 'PRJ-930', 'Site P1', 'SRIDEVI STEELS', 12800, 0, 'Cash in Hand', 'VCH-MAT-64218', ''],
    ['MAT-75392', '2026-09-11', 'Raw Materials', 'Cement 20 Bags', 'PRJ-563', 'Site RV', 'SRIDEVI STEELS', 6400, 0, 'Cash in Hand', 'VCH-MAT-75392', ''],
    ['MAT-10519', '2026-09-11', 'Raw Materials', 'Paint', 'PRJ-957', 'Site S1', 'AMMAN PAINTS', 15087, 0, 'Cash in Hand', 'VCH-MAT-10519', ''],
    ['MAT-13727', '2026-09-11', 'Raw Materials', 'Paint ', 'PRJ-907', 'Site RK6', 'AMMAN PAINTS', 6650, 0, 'Cash in Hand', 'VCH-MAT-13727', ''],
    ['MAT-95488', '2026-09-11', 'Raw Materials', 'Paint ', 'PRJ-918', 'Site R1', 'AMMAN PRAKASH', 26759, 0, 'Cash in Hand', 'VCH-MAT-95488', ''],
    ['MAT-44673', '2026-09-11', 'Raw Materials', 'M sand', 'PRJ-930', 'Site P1', 'PALLKARAR', 12000, 0, 'Cash in Hand', 'VCH-MAT-44673', ''],
    ['MAT-27817', '2026-09-11', 'Raw Materials', 'M sand', 'PRJ-563', 'Site RV', 'PALLKARAR', 13000, 0, 'Cash in Hand', 'VCH-MAT-27817', ''],
    ['MAT-94776', '2026-09-11', 'Raw Materials', 'M sand ', 'PRJ-918', 'Site R1', 'PALLKARAR', 14000, 0, 'Cash in Hand', 'VCH-MAT-94776', ''],
    ['MAT-77438', '2026-09-11', 'Raw Materials', 'M sand ', 'PRJ-957', 'Site S1', 'PALLKARAR', 5000, 0, 'Cash in Hand', 'VCH-MAT-77438', ''],
    ['MAT-55381', '2026-09-11', 'Raw Materials', 'M sand ', 'PRJ-907', 'Site RK6', 'PALLKARAR', 50500, 0, 'Cash in Hand', 'VCH-MAT-55381', ''],
    ['MAT-01891', '2026-09-11', 'Raw Materials', 'M sand', 'PRJ-907', 'Site RK6', 'SEKAR KAASI', 38000, 0, 'Cash in Hand', 'VCH-MAT-01891', ''],
    ['MAT-51198', '2026-09-11', 'Raw Materials', 'Gurder', 'PRJ-957', 'Site S1', 'GRIL MOHAN', 27924, 0, 'Cash in Hand', 'VCH-MAT-51198', ''],
    ['MAT-20824', '2026-09-11', 'Raw Materials', 'Gate work ', 'PRJ-635', 'Site AP', 'GRIL MOHAN', 57186, 0, 'Cash in Hand', 'VCH-MAT-20824', ''],
    ['MAT-94679', '2026-09-11', 'Raw Materials', 'Gril work ', 'PRJ-918', 'Site R1', 'GRIL MOHAN', 47071, 0, 'Cash in Hand', 'VCH-MAT-94679', ''],
    ['MAT-10058', '2026-09-11', 'Raw Materials', 'Brick ', 'PRJ-907', 'Site RK6', 'BRICK MURUGESH', 38000, 0, 'Cash in Hand', 'VCH-MAT-10058', ''],
    ['MAT-62462', '2026-09-11', 'Raw Materials', 'Elect Pipe ', 'PRJ-635', 'Site AP', 'ELECT AATHI', 5320, 0, 'Cash in Hand', 'VCH-MAT-62462', ''],
    ['MAT-41483', '2026-09-11', 'Raw Materials', 'Elect Pipe ', 'PRJ-907', 'Site RK6', 'ELECT AATHI', 85207, 0, 'Cash in Hand', 'VCH-MAT-41483', ''],
    ['MAT-20985', '2026-09-11', 'Raw Materials', 'Elect Pipe ', 'PRJ-563', 'Site RV', 'ELECT AATHI', 6760, 0, 'Cash in Hand', 'VCH-MAT-20985', ''],
    ['MAT-99981', '2026-09-11', 'Raw Materials', 'Elect Pipe ', 'PRJ-957', 'Site S1', 'ELECT AATHI', 6714, 0, 'Cash in Hand', 'VCH-MAT-99981', ''],
    ['MAT-62297', '2026-09-11', 'Raw Materials', 'Elect Pipe ', 'PRJ-918', 'Site R1', 'ELECT AATHI', 45113, 0, 'Cash in Hand', 'VCH-MAT-62297', ''],
    ['MAT-48005', '2026-09-11', 'Raw Materials', 'Steel cement ', 'PRJ-563', 'Site RV', 'SRIDEVI STEELS', 121400, 0, 'Cash in Hand', 'VCH-MAT-48005', ''],
    ['MAT-25487', '2026-09-11', 'Raw Materials', 'Steel cement ', 'PRJ-930', 'Site P1', 'SRIDEVI STEELS', 76800, 0, 'Cash in Hand', 'VCH-MAT-25487', ''],
    ['MAT-72424', '2026-09-11', 'Raw Materials', 'Steel cement ', 'PRJ-918', 'Site R1', 'SRIDEVI STEELS', 19200, 0, 'Cash in Hand', 'VCH-MAT-72424', ''],
    ['MAT-43058', '2026-09-11', 'Raw Materials', 'Steel cement ', 'PRJ-907', 'Site RK6', 'SRIDEVI STEELS', 239423, 0, 'Cash in Hand', 'VCH-MAT-43058', '']
  ];
  for (const m of defaultMats) {
    mStmt.run(...m);
  }
}

// Seed default labor if empty
const checkLabor = db.prepare('SELECT COUNT(*) as count FROM labor_roster').get();
if (checkLabor.count === 0) {
  const lStmt = db.prepare(`INSERT INTO labor_roster (
    id, name, role, daily_rate, phone, site_assigned, day_name, duty, total_amount, days_present, advance_paid, status,
    mon_duty, mon_amt, mon_site, tue_duty, tue_amt, tue_site, wed_duty, wed_amt, wed_site,
    thu_duty, thu_amt, thu_site, fri_duty, fri_amt, fri_site, sat_duty, sat_amt, sat_site,
    sun_duty, sun_amt, sun_site, week_label
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);

  const defaultLabor = [
    ['LAB-314', 'Alangeer', 'Ma', 950, '', 'Site RK6', 'Monday', '-', 1425, 1.5, 0, 'Active', '-', 0, 'Site RK6', '-', 0, 'Site RK6', '-', 0, 'Site RK6', '-', 0, 'Site RK6', '1.5 Duty', 1425, 'Site RK6', '-', 0, 'Site RK6', '-', 0, 'Site RK6', ''],
    ['LAB-498', 'Askar', 'Ma', 950, '', 'Site RK6', 'Monday', '-', 7125, 7.5, 0, 'Active', '1.5 Duty', 1425, 'Site RK6', '1.5 Duty', 1425, 'Site RK6', '1.5 Duty', 1425, 'Site RK6', '1.5 Duty', 1425, 'Site RK6', '1.5 Duty', 1425, 'Site AP', '-', 0, 'Site RK6', '-', 0, 'Site RK6', ''],
    ['LAB-854', 'Bappe', 'Ma', 950, '', 'Site RK6', 'Monday', '-', 5700, 6, 0, 'Active', '1 Duty', 950, 'Site RK6', '1 Duty', 950, 'Site RK6', '1 Duty', 950, 'Site RK6', '1 Duty', 950, 'Site RK6', '1 Duty', 950, 'Site RK6', '1 Duty', 950, 'Site RK6', '-', 0, 'Site RK6', ''],
    ['LAB-286', 'Bisunath', 'Ma', 950, '', 'Site RK6', 'Monday', '-', 7125, 7.5, 0, 'Active', '1.5 Duty', 1425, 'Site RK6', '1.5 Duty', 1425, 'Site RK6', '1.5 Duty', 1425, 'Site RK6', '1.5 Duty', 1425, 'Site RK6', '1.5 Duty', 1425, 'Site RK6', '-', 0, 'Site RK6', '-', 0, 'Site RK6', ''],
    ['LAB-505', 'Deepu', 'Ma', 950, '', 'Site RK6', 'Monday', '-', 5700, 6, 0, 'Active', '1 Duty', 950, 'Site RK6', '1 Duty', 950, 'Site RK6', '1 Duty', 950, 'Site RK6', '1 Duty', 950, 'Site RK6', '1 Duty', 950, 'Site RK6', '1 Duty', 950, 'Site RK6', '-', 0, 'Site RK6', ''],
    ['LAB-334', 'Hussain', 'Ma', 950, '', 'Site RK6', 'Monday', '-', 6650, 7, 0, 'Active', '1 Duty', 950, 'Site RK6', '1.5 Duty', 1425, 'Site RK6', '1 Duty', 950, 'Site RK6', '1 Duty', 950, 'Site RK6', '1.5 Duty', 1425, 'Site RK6', '1 Duty', 950, 'Site RK6', '-', 0, 'Site RK6', ''],
    ['LAB-041', 'Najimul', 'Ma', 950, '', 'Site RK6', 'Monday', '-', 7125, 7.5, 0, 'Active', '1.5 Duty', 1425, 'Site RK6', '1.5 Duty', 1425, 'Site RK6', '1.5 Duty', 1425, 'Site RK6', '1.5 Duty', 1425, 'Site RK6', '1.5 Duty', 1425, 'Site RK6', '-', 0, 'Site RK6', '-', 0, 'Site RK6', ''],
    ['LAB-028', 'Ranjith', 'Ma', 950, '', 'Site RK6', 'Monday', '-', 7125, 7.5, 0, 'Active', '1.5 Duty', 1425, 'Site RK6', '1.5 Duty', 1425, 'Site RK6', '1.5 Duty', 1425, 'Site RK6', '1.5 Duty', 1425, 'Site RK6', '1.5 Duty', 1425, 'Site RK6', '-', 0, 'Site RK6', '-', 0, 'Site RK6', ''],
    ['LAB-546', 'Aijul', 'Mm', 750, '', 'Site RK6', 'Monday', '-', 1125, 1.5, 0, 'Active', '-', 0, 'Site RK6', '-', 0, 'Site RK6', '-', 0, 'Site RK6', '-', 0, 'Site RK6', '1.5 Duty', 1125, 'Site RK6', '-', 0, 'Site RK6', '-', 0, 'Site RK6', ''],
    ['LAB-543', 'Ali Hussain', 'Mm', 750, '', 'Site RK6', 'Monday', '-', 5625, 7.5, 0, 'Active', '1.5 Duty', 1125, 'Site RK6', '1.5 Duty', 1125, 'Site RK6', '1.5 Duty', 1125, 'Site RK6', '1.5 Duty', 1125, 'Site RK6', '1.5 Duty', 1125, 'Site RK6', '-', 0, 'Site RK6', '-', 0, 'Site RK6', ''],
    ['LAB-191', 'Chanthu', 'Mm', 750, '', 'Site RK6', 'Monday', '-', 5625, 7.5, 0, 'Active', '1.5 Duty', 1125, 'Site RK6', '1.5 Duty', 1125, 'Site RK6', '1.5 Duty', 1125, 'Site RK6', '1.5 Duty', 1125, 'Site RK6', '1.5 Duty', 1125, 'Site RK6', '-', 0, 'Site RK6', '-', 0, 'Site RK6', ''],
    ['LAB-723', 'Hussain son', 'Mm', 750, '', 'Site RK6', 'Monday', '-', 1875, 2.5, 0, 'Active', '1 Duty', 750, 'Site RK6', '-', 0, 'Site RK6', '-', 0, 'Site RK6', '-', 0, 'Site RK6', '1.5 Duty', 1125, 'Site RK6', '-', 0, 'Site RK6', '-', 0, 'Site RK6', ''],
    ['LAB-794', 'Laddu', 'Mm', 750, '', 'Site RK6', 'Monday', '-', 5625, 7.5, 0, 'Active', '1.5 Duty', 1125, 'Site RK6', '1.5 Duty', 1125, 'Site RK6', '1.5 Duty', 1125, 'Site RK6', '1.5 Duty', 1125, 'Site RK6', '1.5 Duty', 1125, 'Site RK6', '-', 0, 'Site RK6', '-', 0, 'Site RK6', ''],
    ['LAB-200', 'Manirul', 'Mm', 750, '', 'Site RK6', 'Monday', '-', 5625, 7.5, 0, 'Active', '1.5 Duty', 1125, 'Site RK6', '1.5 Duty', 1125, 'Site RK6', '1.5 Duty', 1125, 'Site RK6', '1.5 Duty', 1125, 'Site RK6', '1.5 Duty', 1125, 'Site RK6', '-', 0, 'Site RK6', '-', 0, 'Site RK6', ''],
    ['LAB-779', 'Nittai', 'Mm', 750, '', 'Site RK6', 'Monday', '-', 5625, 7.5, 0, 'Active', '1.5 Duty', 1125, 'Site RK6', '1.5 Duty', 1125, 'Site RK6', '1.5 Duty', 1125, 'Site RK6', '1.5 Duty', 1125, 'Site RK6', '1.5 Duty', 1125, 'Site RK6', '-', 0, 'Site RK6', '-', 0, 'Site RK6', ''],
    ['LAB-716', 'Raana', 'Mm', 750, '', 'Site RK6', 'Monday', '-', 5625, 7.5, 0, 'Active', '1.5 Duty', 1125, 'Site RK6', '1.5 Duty', 1125, 'Site RK6', '1.5 Duty', 1125, 'Site RK6', '1.5 Duty', 1125, 'Site RK6', '1.5 Duty', 1125, 'Site RK6', '-', 0, 'Site RK6', '-', 0, 'Site RK6', ''],
    ['LAB-001', 'Sanjith', 'Mm', 750, '', 'Site RK6', 'Monday', '-', 4125, 5.5, 0, 'Active', '1 Duty', 750, 'Site RK6', '1 Duty', 750, 'Site RK6', '1 Duty', 750, 'Site RK6', '1 Duty', 750, 'Site RK6', '1.5 Duty', 1125, 'Site RK6', '-', 0, 'Site RK6', '-', 0, 'Site RK6', ''],
    ['LAB-003', 'Thourn', 'Mm', 750, '', 'Site RK6', 'Monday', '-', 3375, 4.5, 0, 'Active', '1 Duty', 750, 'Site RK6', '1 Duty', 750, 'Site RK6', '1 Duty', 750, 'Site RK6', '-', 0, 'Site RK6', '1.5 Duty', 1125, 'Site RK6', '-', 0, 'Site RK6', '-', 0, 'Site RK6', '']
  ];
  for (const l of defaultLabor) {
    lStmt.run(...l);
  }
}

export default db;
export { dbPath };
