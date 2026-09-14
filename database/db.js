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

// Auto-rehydrate from backup snapshot if database is fresh/empty
function rehydrateFromSnapshot() {
  try {
    const totalRecords = db.prepare('SELECT (SELECT COUNT(*) FROM projects) + (SELECT COUNT(*) FROM materials) + (SELECT COUNT(*) FROM labor_roster) + (SELECT COUNT(*) FROM transactions) + (SELECT COUNT(*) FROM supplier_payments) + (SELECT COUNT(*) FROM labor_weekly_history) AS total').get().total;

    if (totalRecords === 0) {
      const possibleSnapshotPaths = [
        path.join(dbDir, 'backup_snapshot.json'),
        path.join(__dirname, 'backup_snapshot.json'),
        path.join(process.cwd(), 'database', 'backup_snapshot.json')
      ];

      for (const p of possibleSnapshotPaths) {
        if (fs.existsSync(p)) {
          const content = fs.readFileSync(p, 'utf-8');
          const data = JSON.parse(content);
          if (data && typeof data === 'object') {
            const hasData = (data.projects && data.projects.length > 0) ||
                            (data.materials && data.materials.length > 0) ||
                            (data.labor && data.labor.length > 0) ||
                            (data.transactions && data.transactions.length > 0) ||
                            (data.supplierPayments && data.supplierPayments.length > 0) ||
                            (data.laborWeeklyHistory && data.laborWeeklyHistory.length > 0);
            if (hasData) {
              console.log(`🔄 Auto-restoring database from snapshot: ${p}`);
              const restoreTxn = db.transaction(() => {
                if (Array.isArray(data.projects)) {
                  const stmt = db.prepare(`INSERT OR REPLACE INTO projects (id, name, client, client_phone, location, type, total_area_sqft, budget, spent, progress, status, supervisor, start_date, estimated_completion, notes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
                  data.projects.forEach(x => { if (x.id && x.name) stmt.run(x.id, x.name, x.client || 'Direct Client', x.client_phone || '', x.location || 'Site Location', x.type || 'Residential', Number(x.total_area_sqft) || 0, Number(x.budget) || 0, Number(x.spent) || 0, Number(x.progress) || 10, x.status || 'In Progress', x.supervisor || 'Civil Engg', x.start_date || '', x.estimated_completion || '', x.notes || '', x.created_at || new Date().toISOString()); });
                }
                if (Array.isArray(data.materials)) {
                  const stmt = db.prepare(`INSERT OR REPLACE INTO materials (id, date, category, item, project_id, project_name, vendor, amount, tax_amount, payment_mode, bill_number, notes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
                  data.materials.forEach(x => { if (x.id && x.item) stmt.run(x.id, x.date, x.category || 'Raw Materials', x.item, x.project_id || null, x.project_name || 'General Site', x.vendor || 'Supplier', Number(x.amount) || 0, Number(x.tax_amount) || 0, x.payment_mode || 'Cash in Hand', x.bill_number || `VCH-${x.id}`, x.notes || '', x.created_at || new Date().toISOString()); });
                }
                if (Array.isArray(data.labor)) {
                  const stmt = db.prepare(`INSERT OR REPLACE INTO labor_roster (id, name, role, daily_rate, phone, site_assigned, day_name, duty, total_amount, days_present, advance_paid, status, mon_duty, mon_amt, mon_site, tue_duty, tue_amt, tue_site, wed_duty, wed_amt, wed_site, thu_duty, thu_amt, thu_site, fri_duty, fri_amt, fri_site, sat_duty, sat_amt, sat_site, sun_duty, sun_amt, sun_site, week_label, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
                  data.labor.forEach(x => { if (x.id && x.name) stmt.run(x.id, x.name, x.role || 'Ma', Number(x.daily_rate) || 950, x.phone || '', x.site_assigned || 'General Site', x.day_name || 'Monday', x.duty || '-', Number(x.total_amount) || 0, Number(x.days_present) || 0, Number(x.advance_paid) || 0, x.status || 'Active', x.mon_duty || '-', Number(x.mon_amt) || 0, x.mon_site || '', x.tue_duty || '-', Number(x.tue_amt) || 0, x.tue_site || '', x.wed_duty || '-', Number(x.wed_amt) || 0, x.wed_site || '', x.thu_duty || '-', Number(x.thu_amt) || 0, x.thu_site || '', x.fri_duty || '-', Number(x.fri_amt) || 0, x.fri_site || '', x.sat_duty || '-', Number(x.sat_amt) || 0, x.sat_site || '', x.sun_duty || '-', Number(x.sun_amt) || 0, x.sun_site || '', x.week_label || '', x.created_at || new Date().toISOString()); });
                }
                if (Array.isArray(data.vendors)) {
                  const stmt = db.prepare(`INSERT OR REPLACE INTO vendors (id, name, contact_person, phone, category, gstin, address, balance_due, role, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
                  data.vendors.forEach(x => { if (x.id && x.name) stmt.run(x.id, x.name, x.contact_person || '', x.phone || '', x.category || 'Raw Materials', x.gstin || '', x.address || '', Number(x.balance_due) || 0, x.role || 'Raw Materials', x.created_at || new Date().toISOString()); });
                }
                if (Array.isArray(data.transactions)) {
                  const stmt = db.prepare(`INSERT OR REPLACE INTO transactions (id, date, type, account_id, account_name, category, amount, party, project, reference, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
                  data.transactions.forEach(x => { if (x.id && x.amount) stmt.run(x.id, x.date, x.type || 'Expense', x.account_id || 'ACC-01', x.account_name || 'Primary Bank Current Account', x.category || 'General', Number(x.amount) || 0, x.party || 'Self', x.project || 'General / HQ', x.reference || 'Cash', x.created_at || new Date().toISOString()); });
                }
                if (Array.isArray(data.supplierPayments)) {
                  const stmt = db.prepare(`INSERT OR REPLACE INTO supplier_payments (id, vendor, project_name, amount, date, payment_mode, notes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
                  data.supplierPayments.forEach(x => { if (x.id && x.amount) stmt.run(x.id, x.vendor || 'Supplier', x.project_name || 'General Site', Number(x.amount) || 0, x.date, x.payment_mode || 'Cash in Hand', x.notes || '', x.created_at || new Date().toISOString()); });
                }
                if (Array.isArray(data.laborWeeklyHistory)) {
                  const stmt = db.prepare(`INSERT OR REPLACE INTO labor_weekly_history (id, week_label, week_ending, total_workers, total_shifts, total_wages, masons_count, helpers_count, site_breakdown_json, workers_data_json, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
                  data.laborWeeklyHistory.forEach(x => { if (x.id && x.week_ending) stmt.run(x.id, x.week_label || `Week ending ${x.week_ending}`, x.week_ending, Number(x.total_workers) || 0, Number(x.total_shifts) || 0, Number(x.total_wages) || 0, Number(x.masons_count) || 0, Number(x.helpers_count) || 0, typeof x.site_breakdown_json === 'string' ? x.site_breakdown_json : JSON.stringify(x.site_breakdown_json || []), typeof x.workers_data_json === 'string' ? x.workers_data_json : JSON.stringify(x.workers_data_json || []), x.created_at || new Date().toISOString()); });
                }
              });
              restoreTxn();
              console.log('✅ SQLite database successfully auto-restored from snapshot.');
              break;
            }
          }
        }
      }
    }
  } catch (err) {
    console.warn('Auto-rehydrate from snapshot skipped:', err.message);
  }
}

export function saveSnapshot() {
  try {
    const company = db.prepare('SELECT * FROM company_profile WHERE id = 1').get() || {};
    const projects = db.prepare('SELECT * FROM projects ORDER BY created_at DESC').all();
    const materials = db.prepare('SELECT * FROM materials ORDER BY date DESC, created_at DESC').all();
    const labor = db.prepare("SELECT * FROM labor_roster ORDER BY CASE WHEN role = 'Ma' THEN 1 WHEN role = 'Mm' THEN 2 ELSE 3 END, name ASC").all();
    const vendors = db.prepare('SELECT * FROM vendors ORDER BY name ASC').all();
    const accounts = db.prepare('SELECT * FROM accounts').all();
    const transactions = db.prepare('SELECT * FROM transactions ORDER BY date DESC, created_at DESC').all();
    const supplierPayments = db.prepare('SELECT * FROM supplier_payments ORDER BY date DESC, created_at DESC').all();
    const laborWeeklyHistory = db.prepare('SELECT * FROM labor_weekly_history ORDER BY created_at DESC').all();

    const snapshot = {
      version: '3.0.0',
      saved_at: new Date().toISOString(),
      company,
      projects,
      materials,
      labor,
      vendors,
      accounts,
      transactions,
      supplierPayments,
      laborWeeklyHistory
    };

    const snapshotFile = path.join(dbDir, 'backup_snapshot.json');
    fs.writeFileSync(snapshotFile, JSON.stringify(snapshot, null, 2), 'utf-8');

    const localSnapshot = path.join(__dirname, 'backup_snapshot.json');
    if (snapshotFile !== localSnapshot) {
      try { fs.writeFileSync(localSnapshot, JSON.stringify(snapshot, null, 2), 'utf-8'); } catch(e) {}
    }
  } catch (err) {
    console.warn('Failed to save auto-snapshot:', err);
  }
}

rehydrateFromSnapshot();

// Ensure all changes are flushed to the database file on disk
db.pragma('wal_checkpoint(TRUNCATE)');

export default db;
export { dbPath };
