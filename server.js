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
    const { name, role, daily_rate, phone, site_assigned, advance_paid } = req.body;
    const id = `LAB-${Date.now().toString().slice(-3)}`;
    const rate = Number(daily_rate) || (role === 'Mm' ? 750 : 950);

    db.prepare(`
      INSERT INTO labor_roster (id, name, role, daily_rate, phone, site_assigned, day_name, duty, total_amount, days_present, advance_paid, status, mon_duty, tue_duty, wed_duty, thu_duty, fri_duty, sat_duty, sun_duty, mon_amt, tue_amt, wed_amt, thu_amt, fri_amt, sat_amt, sun_amt)
      VALUES (?, ?, ?, ?, ?, ?, '', '-', 0, 0, ?, 'Active', '-', '-', '-', '-', '-', '-', '-', 0, 0, 0, 0, 0, 0, 0)
    `).run(id, name, role || 'Ma', rate, phone || '', site_assigned || 'General Site', advance_paid || 0);

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

// 5.1 Google Sheet Live Web View for Labour Attendance & Wage Sheet
app.get(['/api/labor/sheet', '/api/labour/sheet'], (req, res) => {
  try {
    const workers = db.prepare('SELECT * FROM labor_roster ORDER BY name ASC').all();
    const company = db.prepare('SELECT * FROM company_profile WHERE id = 1').get() || { name: 'GURUBARAN BUILDERS' };
    const today = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

    function getDutyAmount(role, duty) {
      const isMm = role === 'Mm';
      if (duty === '1 Duty') return isMm ? 750 : 950;
      if (duty === '1.5 Duty' || duty === '1425' || duty === '1125') return isMm ? 1125 : 1425;
      if (duty === '1/2 Duty' || duty === '0.5 Duty') return isMm ? 375 : 475;
      return 0;
    }

    const daysKeys = [
      { key: 'mon', label: 'Mon' },
      { key: 'tue', label: 'Tue' },
      { key: 'wed', label: 'Wed' },
      { key: 'thu', label: 'Thu' },
      { key: 'fri', label: 'Fri' },
      { key: 'sat', label: 'Sat' },
      { key: 'sun', label: 'Sun' }
    ];

    let grandTotal = 0;
    let totalDaysAll = 0;

    const rowsHtml = workers.map((w, idx) => {
      const role = w.role || 'Ma';
      let wTotal = 0;
      let wDays = 0;

      const dayTds = daysKeys.map(d => {
        const duty = w[`${d.key}_duty`] || (w.day_name && w.day_name.toLowerCase().startsWith(d.key) ? (w.duty || '1 Duty') : '-');
        const amt = getDutyAmount(role, duty);
        wTotal += amt;
        const isActive = duty && duty !== '-' && duty !== 'Off';
        if (isActive) {
          wDays += (duty === '1/2 Duty' ? 0.5 : (duty === '1.5 Duty' ? 1.5 : 1));
        }
        return `
          <td class="cell day-cell ${isActive ? 'active-day' : ''}">
            <div class="duty-badge">${duty}</div>
            ${isActive ? `<div class="duty-amt">₹${amt}</div>` : `<div class="duty-amt text-muted">-</div>`}
          </td>
        `;
      }).join('');

      if (wTotal === 0 && Number(w.total_amount) > 0) {
        wTotal = Number(w.total_amount);
        wDays = Number(w.days_present) || 1;
      }

      grandTotal += wTotal;
      totalDaysAll += wDays;

      return `
        <tr>
          <td class="cell text-center font-bold text-muted">${idx + 1}</td>
          <td class="cell font-bold worker-name">${w.name}</td>
          <td class="cell text-center"><span class="role-badge ${role === 'Ma' ? 'role-ma' : 'role-mm'}">${role}</span></td>
          ${dayTds}
          <td class="cell text-center font-bold">${wDays} d</td>
          <td class="cell text-right font-black wage-col">₹${wTotal.toLocaleString('en-IN')}</td>
        </tr>
      `;
    }).join('');

    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${company.name} - Weekly Labour Wage Sheet</title>
        <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700;900&family=Roboto+Mono:wght@500;700&display=swap" rel="stylesheet">
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: 'Roboto', system-ui, sans-serif; background: #f8fafc; color: #1e293b; padding: 16px; }
          .container { max-width: 1100px; margin: 0 auto; background: #ffffff; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); overflow: hidden; border: 1px solid #e2e8f0; }
          
          /* Google Sheets Header Bar */
          .sheets-bar { background: #0f9d58; color: white; padding: 16px 20px; display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 12px; }
          .sheets-title { display: flex; align-items: center; gap: 10px; }
          .sheets-icon { width: 28px; height: 28px; background: white; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-weight: 900; color: #0f9d58; font-size: 16px; }
          .sheets-bar h1 { font-size: 18px; font-weight: 800; letter-spacing: -0.01em; }
          .sheets-bar p { font-size: 12px; opacity: 0.9; margin-top: 2px; }
          
          .actions { display: flex; gap: 8px; flex-wrap: wrap; }
          .btn { padding: 8px 14px; border-radius: 8px; font-size: 12px; font-weight: 700; text-decoration: none; display: inline-flex; align-items: center; gap: 6px; cursor: pointer; border: none; transition: 0.15s; }
          .btn-whatsapp { background: #25D366; color: white; }
          .btn-whatsapp:hover { background: #1ebc59; }
          .btn-download { background: rgba(255,255,255,0.2); color: white; border: 1px solid rgba(255,255,255,0.4); }
          .btn-download:hover { background: rgba(255,255,255,0.3); }
          .btn-print { background: #ffffff; color: #0f9d58; }
          .btn-print:hover { background: #f1f5f9; }

          /* Summary Cards */
          .kpi-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; padding: 16px 20px; background: #f1f5f9; border-bottom: 1px solid #e2e8f0; }
          .kpi-card { background: white; padding: 12px 16px; border-radius: 8px; border: 1px solid #e2e8f0; }
          .kpi-card .lbl { font-size: 11px; text-transform: uppercase; font-weight: 700; color: #64748b; }
          .kpi-card .val { font-size: 20px; font-weight: 900; font-family: 'Roboto Mono', monospace; margin-top: 4px; }
          .kpi-card .val.green { color: #0f9d58; }

          /* Spreadsheet Table */
          .table-wrapper { overflow-x: auto; }
          table { width: 100%; border-collapse: collapse; font-size: 12px; }
          th { background: #f8fafc; color: #475569; font-weight: 700; text-transform: uppercase; font-size: 11px; padding: 10px 8px; border: 1px solid #cbd5e1; text-align: center; }
          .cell { padding: 8px 10px; border: 1px solid #e2e8f0; vertical-align: middle; }
          .worker-name { color: #0f172a; font-size: 13px; }
          .role-badge { display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 800; }
          .role-ma { background: #fef3c7; color: #b45309; }
          .role-mm { background: #e0f2fe; color: #0369a1; }
          .day-cell { text-align: center; font-size: 11px; }
          .day-cell.active-day { background: #ecfdf5; }
          .duty-badge { font-weight: 700; color: #047857; }
          .duty-amt { font-size: 10px; font-family: 'Roboto Mono', monospace; color: #059669; font-weight: 600; margin-top: 1px; }
          .duty-amt.text-muted { color: #94a3b8; }
          .wage-col { font-family: 'Roboto Mono', monospace; font-size: 13px; color: #0f9d58; }
          .text-center { text-align: center; }
          .text-right { text-align: right; }
          .font-bold { font-weight: 700; }
          .font-black { font-weight: 900; }
          .text-muted { color: #64748b; }
          tr:hover td { background-color: #f8fafc; }

          tfoot td { background: #f1f5f9; font-weight: 800; border-top: 2px solid #cbd5e1; padding: 12px 10px; }
          .grand-total { font-size: 16px; color: #0f9d58; font-family: 'Roboto Mono', monospace; }

          .footer { padding: 14px 20px; font-size: 11px; color: #64748b; display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #e2e8f0; }

          @media print {
            body { padding: 0; background: white; }
            .container { box-shadow: none; border: none; }
            .actions { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="sheets-bar">
            <div class="sheets-title">
              <div class="sheets-icon">📊</div>
              <div>
                <h1>${company.name} - Labour Muster Roll</h1>
                <p>Date: ${today} • Live Cloud Synchronized Google Sheet</p>
              </div>
            </div>
            <div class="actions">
              <button onclick="window.print()" class="btn btn-print">🖨️ Print / PDF</button>
              <a href="/api/labor/csv" download="Labour_Attendance_${today}.csv" class="btn btn-download">📥 Download CSV</a>
              <a href="https://api.whatsapp.com/send?text=${encodeURIComponent(`🏗️ *${company.name.toUpperCase()} - Labour Attendance & Wage Sheet*\n📅 *Date:* ${today}\n👥 *Workers:* ${workers.length} | 💰 *Total Wages: ₹${grandTotal.toLocaleString('en-IN')}*\n\n👉 *View Full Live Google Sheet:* ` + req.protocol + '://' + req.get('host') + '/api/labor/sheet')}" target="_blank" class="btn btn-whatsapp">📱 Share on WhatsApp</a>
            </div>
          </div>

          <div class="kpi-row">
            <div class="kpi-card">
              <div class="lbl">Total Active Workers</div>
              <div class="val">${workers.length} Workers</div>
            </div>
            <div class="kpi-card">
              <div class="lbl">Total Days Worked</div>
              <div class="val">${totalDaysAll} Days</div>
            </div>
            <div class="kpi-card">
              <div class="lbl">Total Labour Charges</div>
              <div class="val green">₹${grandTotal.toLocaleString('en-IN')}</div>
            </div>
          </div>

          <div class="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th style="width: 40px;">#</th>
                  <th style="text-align: left; min-width: 140px;">Worker Name</th>
                  <th style="width: 60px;">Role</th>
                  <th style="min-width: 75px;">Mon</th>
                  <th style="min-width: 75px;">Tue</th>
                  <th style="min-width: 75px;">Wed</th>
                  <th style="min-width: 75px;">Thu</th>
                  <th style="min-width: 75px;">Fri</th>
                  <th style="min-width: 75px;">Sat</th>
                  <th style="min-width: 75px;">Sun</th>
                  <th style="width: 70px;">Total Days</th>
                  <th style="width: 110px; text-align: right;">Weekly Total</th>
                </tr>
              </thead>
              <tbody>
                ${rowsHtml.length > 0 ? rowsHtml : '<tr><td colspan="12" class="cell text-center text-muted" style="padding: 30px;">No labour attendance data recorded yet.</td></tr>'}
              </tbody>
              <tfoot>
                <tr>
                  <td colspan="3" class="text-right font-black uppercase">Grand Total Summary:</td>
                  <td colspan="7" class="text-center font-bold text-muted">${totalDaysAll} Total Worker Shifts Logged</td>
                  <td class="text-center font-black">${totalDaysAll} d</td>
                  <td class="text-right grand-total font-black">₹${grandTotal.toLocaleString('en-IN')}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div class="footer">
            <span>Generated from ${company.name} Cloud Accounts ERP</span>
            <span>Live Sync Active • 100% Verified SQLite Data</span>
          </div>
        </div>
      </body>
      </html>
    `;

    res.send(html);
  } catch (err) {
    res.status(500).send('Error generating sheet: ' + err.message);
  }
});

// 5.2 Google Sheet CSV Export for direct ImportData
app.get(['/api/labor/csv', '/api/labour/csv'], (req, res) => {
  try {
    const workers = db.prepare('SELECT * FROM labor_roster ORDER BY name ASC').all();
    const company = db.prepare('SELECT * FROM company_profile WHERE id = 1').get() || { name: 'GURUBARAN BUILDERS' };
    const today = new Date().toISOString().split('T')[0];

    function getDutyAmount(role, duty) {
      const isMm = role === 'Mm';
      if (duty === '1 Duty') return isMm ? 750 : 950;
      if (duty === '1.5 Duty' || duty === '1425' || duty === '1125') return isMm ? 1125 : 1425;
      if (duty === '1/2 Duty' || duty === '0.5 Duty') return isMm ? 375 : 475;
      return 0;
    }

    const daysKeys = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
    let grandTotal = 0;
    let totalDaysAll = 0;

    let csv = `"${company.name} - Weekly Labour Attendance & Wage Sheet (${today})"\n\n`;
    csv += `"S.No","Worker Name","Role","Mon","Tue","Wed","Thu","Fri","Sat","Sun","Total Days","Weekly Wage (INR)"\n`;

    workers.forEach((w, idx) => {
      const role = w.role || 'Ma';
      let wTotal = 0;
      let wDays = 0;
      const duties = {};

      daysKeys.forEach(d => {
        const duty = w[`${d}_duty`] || (w.day_name && w.day_name.toLowerCase().startsWith(d) ? (w.duty || '1 Duty') : '-');
        const amt = getDutyAmount(role, duty);
        wTotal += amt;
        duties[d] = duty;
        if (duty && duty !== '-' && duty !== 'Off') {
          wDays += (duty === '1/2 Duty' ? 0.5 : (duty === '1.5 Duty' ? 1.5 : 1));
        }
      });

      if (wTotal === 0 && Number(w.total_amount) > 0) {
        wTotal = Number(w.total_amount);
        wDays = Number(w.days_present) || 1;
      }

      grandTotal += wTotal;
      totalDaysAll += wDays;

      csv += `"${idx + 1}","${w.name}","${role}","${duties['mon']}","${duties['tue']}","${duties['wed']}","${duties['thu']}","${duties['fri']}","${duties['sat']}","${duties['sun']}","${wDays}","${wTotal}"\n`;
    });

    csv += `\n"","","","","","","","","","Total Labour Charges:","${totalDaysAll} Days","${grandTotal}"\n`;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=Labour_Attendance_${today}.csv`);
    res.send(csv);
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
