import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import db, { dbPath } from './database/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// ================= API ENDPOINTS =================

// 1. Health & Status
app.get('/api/status', (req, res) => {
  res.json({
    status: 'online',
    database: 'SQLite 3 (WAL Mode)',
    databaseFile: dbPath,
    timestamp: new Date().toISOString()
  });
});

// 1.1 Personal Admin Authentication
app.post('/api/login', (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const admin = db.prepare('SELECT * FROM admin_user WHERE id = 1').get();
    if (!admin) {
      return res.status(401).json({ error: 'No admin user configured in database' });
    }

    if (admin.username === username.trim() && admin.password === password) {
      const now = new Date().toISOString();
      db.prepare('UPDATE admin_user SET last_login = ? WHERE id = 1').run(now);
      return res.json({
        success: true,
        username: admin.username,
        last_login: now,
        token: `gb_session_${Date.now()}`
      });
    } else {
      return res.status(401).json({ error: 'Invalid username or password' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/auth-user', (req, res) => {
  try {
    const admin = db.prepare('SELECT id, username, last_login FROM admin_user WHERE id = 1').get();
    res.json(admin || { username: 'gurubaran' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/change-password', (req, res) => {
  try {
    const { currentPassword, newUsername, newPassword } = req.body;
    const admin = db.prepare('SELECT * FROM admin_user WHERE id = 1').get();
    
    if (!admin) {
      return res.status(404).json({ error: 'Admin record not found' });
    }

    if (admin.password !== currentPassword) {
      return res.status(400).json({ error: 'Current password does not match' });
    }

    const updatedUsername = (newUsername && newUsername.trim()) ? newUsername.trim() : admin.username;
    const updatedPassword = (newPassword && newPassword.trim()) ? newPassword.trim() : admin.password;

    db.prepare('UPDATE admin_user SET username = ?, password = ? WHERE id = 1').run(updatedUsername, updatedPassword);

    res.json({
      success: true,
      message: 'Master credentials updated successfully in SQLite database.',
      username: updatedUsername
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Company Profile
app.get('/api/company', (req, res) => {
  try {
    const profile = db.prepare('SELECT * FROM company_profile WHERE id = 1').get();
    res.json(profile || {});
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/company', (req, res) => {
  try {
    const { name, tagline, gstin, pan, phone, email, website, address, bank_name, account_name, account_number, ifsc_code, branch, terms } = req.body;
    db.prepare(`
      INSERT INTO company_profile (id, name, tagline, gstin, pan, phone, email, website, address, bank_name, account_name, account_number, ifsc_code, branch, terms)
      VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        tagline = excluded.tagline,
        gstin = excluded.gstin,
        pan = excluded.pan,
        phone = excluded.phone,
        email = excluded.email,
        website = excluded.website,
        address = excluded.address,
        bank_name = excluded.bank_name,
        account_name = excluded.account_name,
        account_number = excluded.account_number,
        ifsc_code = excluded.ifsc_code,
        branch = excluded.branch,
        terms = excluded.terms
    `).run(name, tagline, gstin, pan, phone, email, website, address, bank_name, account_name, account_number, ifsc_code, branch, terms);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Projects / Construction Sites
app.get('/api/projects', (req, res) => {
  try {
    const projects = db.prepare(`
      SELECT p.*,
        (COALESCE((SELECT SUM(amount) FROM materials WHERE project_name = p.name OR project_id = p.id), 0) +
         COALESCE((SELECT SUM(amount) FROM transactions WHERE type = 'Expense' AND project = p.name), 0)) AS calculated_spent
      FROM projects p
      ORDER BY p.created_at DESC
    `).all();

    const result = projects.map(p => ({
      ...p,
      spent: (p.calculated_spent !== null && p.calculated_spent !== undefined && p.calculated_spent > 0) ? p.calculated_spent : (p.spent || 0)
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/projects', (req, res) => {
  try {
    const { name, client, client_phone, location, type, total_area_sqft, budget, supervisor, notes } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Project / Site name is required' });
    }

    const id = `PRJ-${Math.floor(100 + Math.random() * 900)}`;
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

    db.prepare(`
      INSERT INTO projects (id, name, client, client_phone, location, type, total_area_sqft, budget, spent, progress, status, supervisor, notes, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 10, 'In Progress', ?, ?, ?)
    `).run(
      id,
      name.trim(),
      client ? client.trim() : 'Direct Client',
      client_phone || '',
      location ? location.trim() : 'Site Location',
      type || 'Residential',
      total_area_sqft || 0,
      budget || 0,
      supervisor || 'Civil Engg',
      notes || '',
      now
    );

    const created = db.prepare('SELECT * FROM projects WHERE id = ?').get(id);
    res.json({ ...created, spent: 0 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/projects/:id', (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM projects WHERE id = ?').run(id);
    res.json({ success: true, message: `Site ${id} removed successfully` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Raw Materials & Purchases
app.get('/api/materials', (req, res) => {
  try {
    const materials = db.prepare('SELECT * FROM materials ORDER BY date DESC, created_at DESC').all();
    res.json(materials);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/materials', (req, res) => {
  try {
    const { date, category, item, project_id, project_name, vendor, amount, tax_amount, payment_mode, bill_number, notes } = req.body;
    const id = `MAT-${Date.now().toString().slice(-5)}`;
    
    const insertMat = db.transaction(() => {
      db.prepare(`
        INSERT INTO materials (id, date, category, item, project_id, project_name, vendor, amount, tax_amount, payment_mode, bill_number, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        id, 
        date || new Date().toISOString().split('T')[0], 
        category || 'Raw Materials', 
        item, 
        project_id || null, 
        project_name || 'General Site', 
        vendor || 'Supplier', 
        amount || 0, 
        tax_amount || 0, 
        payment_mode || 'Cash in Hand', 
        bill_number || `VCH-${id}`, 
        notes || ''
      );

      // Automatically update project spent
      if (project_id) {
        db.prepare('UPDATE projects SET spent = spent + ? WHERE id = ?').run(amount || 0, project_id);
      } else if (project_name) {
        db.prepare('UPDATE projects SET spent = spent + ? WHERE name = ?').run(amount || 0, project_name);
      }
    });

    insertMat();

    const created = db.prepare('SELECT * FROM materials WHERE id = ?').get(id);
    res.json(created);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/materials/:id', (req, res) => {
  try {
    const mat = db.prepare('SELECT * FROM materials WHERE id = ?').get(req.params.id);
    if (mat) {
      if (mat.project_id) {
        db.prepare('UPDATE projects SET spent = MAX(0, spent - ?) WHERE id = ?').run(mat.amount, mat.project_id);
      } else if (mat.project_name) {
        db.prepare('UPDATE projects SET spent = MAX(0, spent - ?) WHERE name = ?').run(mat.amount, mat.project_name);
      }
      db.prepare('DELETE FROM materials WHERE id = ?').run(req.params.id);
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4.1 Supplier Payments
app.get('/api/supplier-payments', (req, res) => {
  try {
    const payments = db.prepare('SELECT * FROM supplier_payments ORDER BY date DESC, created_at DESC').all();
    res.json(payments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/supplier-payments', (req, res) => {
  try {
    const { vendor, project_name, amount, date, payment_mode, notes } = req.body;
    const id = `SPAY-${Date.now().toString().slice(-5)}`;
    const amt = Number(amount) || 0;
    const payDate = date || new Date().toISOString().split('T')[0];
    const mode = payment_mode || 'Cash in Hand';
    const vendName = vendor || 'Supplier';
    const siteName = project_name || 'General Site';

    const insertPay = db.transaction(() => {
      db.prepare(`
        INSERT INTO supplier_payments (id, vendor, project_name, amount, date, payment_mode, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(id, vendName, siteName, amt, payDate, mode, notes || '');

      // Also record in transactions for financial accounting integration
      const txnId = `TXN-SPAY-${Date.now().toString().slice(-4)}`;
      db.prepare(`
        INSERT INTO transactions (id, date, type, category, amount, party, project, reference)
        VALUES (?, ?, 'Expense', 'Supplier Payment', ?, ?, ?, ?)
      `).run(txnId, payDate, amt, vendName, siteName, `${mode} - Payment to ${vendName} (${siteName})`);
    });

    insertPay();

    const created = db.prepare('SELECT * FROM supplier_payments WHERE id = ?').get(id);
    res.json(created);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/supplier-payments/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM supplier_payments WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Labor Workforce (Muster Roll)
app.get('/api/labor', (req, res) => {
  try {
    const labor = db.prepare('SELECT * FROM labor_roster ORDER BY name ASC').all();
    res.json(labor);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/labor', (req, res) => {
  try {
    const { name, role, daily_rate, phone, site_assigned, day_name, duty, total_amount, days_present, advance_paid } = req.body;
    const id = `LAB-${Date.now().toString().slice(-3)}`;
    const rate = Number(daily_rate) || 950;
    const dutyVal = duty || '1 Duty';
    const total = total_amount !== undefined ? Number(total_amount) : rate;

    db.prepare(`
      INSERT INTO labor_roster (id, name, role, daily_rate, phone, site_assigned, day_name, duty, total_amount, days_present, advance_paid, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Active')
    `).run(id, name, role || 'Ma', rate, phone || '', site_assigned || 'General Site', day_name || 'Monday', dutyVal, total, days_present || 1, advance_paid || 0);

    const created = db.prepare('SELECT * FROM labor_roster WHERE id = ?').get(id);
    res.json(created);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/labor/:id', (req, res) => {
  try {
    const current = db.prepare('SELECT * FROM labor_roster WHERE id = ?').get(req.params.id);
    if (!current) {
      return res.status(404).json({ error: 'Worker not found' });
    }

    const updates = { ...current, ...req.body };
    db.prepare(`
      UPDATE labor_roster 
      SET name = ?,
          role = ?,
          daily_rate = ?,
          phone = ?,
          site_assigned = ?,
          day_name = ?,
          duty = ?,
          total_amount = ?,
          days_present = ?,
          advance_paid = ?,
          mon_duty = ?, mon_amt = ?, mon_site = ?,
          tue_duty = ?, tue_amt = ?, tue_site = ?,
          wed_duty = ?, wed_amt = ?, wed_site = ?,
          thu_duty = ?, thu_amt = ?, thu_site = ?,
          fri_duty = ?, fri_amt = ?, fri_site = ?,
          sat_duty = ?, sat_amt = ?, sat_site = ?,
          sun_duty = ?, sun_amt = ?, sun_site = ?,
          week_label = ?
      WHERE id = ?
    `).run(
      updates.name,
      updates.role,
      Number(updates.daily_rate) || 950,
      updates.phone || '',
      updates.site_assigned || 'General Site',
      updates.day_name || 'Monday',
      updates.duty || '1 Duty',
      Number(updates.total_amount) || 0,
      Number(updates.days_present) || 1,
      Number(updates.advance_paid) || 0,
      updates.mon_duty || '-', Number(updates.mon_amt) || 0, updates.mon_site || updates.site_assigned || '',
      updates.tue_duty || '-', Number(updates.tue_amt) || 0, updates.tue_site || updates.site_assigned || '',
      updates.wed_duty || '-', Number(updates.wed_amt) || 0, updates.wed_site || updates.site_assigned || '',
      updates.thu_duty || '-', Number(updates.thu_amt) || 0, updates.thu_site || updates.site_assigned || '',
      updates.fri_duty || '-', Number(updates.fri_amt) || 0, updates.fri_site || updates.site_assigned || '',
      updates.sat_duty || '-', Number(updates.sat_amt) || 0, updates.sat_site || updates.site_assigned || '',
      updates.sun_duty || '-', Number(updates.sun_amt) || 0, updates.sun_site || updates.site_assigned || '',
      updates.week_label || '',
      req.params.id
    );

    const updated = db.prepare('SELECT * FROM labor_roster WHERE id = ?').get(req.params.id);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/labor/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM labor_roster WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 6. Vendors & Suppliers
app.get('/api/vendors', (req, res) => {
  try {
    const vendors = db.prepare('SELECT * FROM vendors ORDER BY name ASC').all();
    res.json(vendors);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/vendors', (req, res) => {
  try {
    const { name, role, contact_person, phone, category, gstin, address, balance_due } = req.body;
    const id = `VND-${Date.now().toString().slice(-4)}`;
    db.prepare(`
      INSERT INTO vendors (id, name, role, contact_person, phone, category, gstin, address, balance_due)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, name, role || category || 'Raw Materials', contact_person || '', phone || '', category || role || 'Raw Materials', gstin || '', address || '', balance_due || 0);

    const created = db.prepare('SELECT * FROM vendors WHERE id = ?').get(id);
    res.json(created);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/vendors/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM vendors WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Vendor deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 7. Accounts & Banking
app.get('/api/accounts', (req, res) => {
  try {
    const accounts = db.prepare('SELECT * FROM accounts').all();
    res.json(accounts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/transactions', (req, res) => {
  try {
    const txns = db.prepare('SELECT * FROM transactions ORDER BY date DESC, created_at DESC').all();
    res.json(txns);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/transactions', (req, res) => {
  try {
    const { type, category, amount, party, project, reference, date } = req.body;
    const id = `TXN-${Date.now().toString().slice(-5)}`;
    
    db.prepare(`
      INSERT INTO transactions (id, date, type, category, amount, party, project, reference)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      date || new Date().toISOString().split('T')[0],
      type || 'Expense',
      category || 'General',
      amount || 0,
      party || 'Self',
      project || 'General / HQ',
      reference || 'Cash'
    );

    const created = db.prepare('SELECT * FROM transactions WHERE id = ?').get(id);
    res.json(created);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/transactions/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM transactions WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 8. Database Backup Snapshot
app.get('/api/backup', (req, res) => {
  try {
    const backupDir = path.join(__dirname, 'database', 'backups');
    if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
    
    const backupFileName = `gurubaran_builders_backup_${new Date().toISOString().split('T')[0]}_${Date.now()}.db`;
    const backupPath = path.join(backupDir, backupFileName);
    
    db.backup(backupPath)
      .then(() => {
        res.download(backupPath, backupFileName);
      })
      .catch(err => {
        res.status(500).json({ error: err.message });
      });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 9. Reset All Database Records (Fresh Start)
app.post('/api/reset', (req, res) => {
  try {
    db.exec(`
      DELETE FROM projects;
      DELETE FROM materials;
      DELETE FROM labor_roster;
      DELETE FROM vendors;
      DELETE FROM transactions;
      UPDATE accounts SET balance = 0;
    `);
    res.json({ success: true, message: 'All site and accounts data reset.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start Server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`====================================================`);
  console.log(`🏢 GURUBARAN BUILDERS - SQLite Database Server Ready`);
  console.log(`📡 API Server running on http://0.0.0.0:${PORT}`);
  console.log(`💾 SQLite Database File: ${dbPath}`);
  console.log(`====================================================`);
});
