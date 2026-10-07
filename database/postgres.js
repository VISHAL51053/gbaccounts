import pg from 'pg';
const { Pool } = pg;

let pool = null;
let isInitialized = false;

export function getPgPool() {
  const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!dbUrl) return null;
  if (!pool) {
    try {
      pool = new Pool({
        connectionString: dbUrl,
        ssl: dbUrl.includes('localhost') ? false : { rejectUnauthorized: false },
        connectionTimeoutMillis: 8000
      });
      pool.on('error', (err) => {
        console.warn('PostgreSQL pool error:', err.message);
      });
    } catch (e) {
      console.warn('PostgreSQL pool initialization failed:', e.message);
    }
  }
  return pool;
}

export async function initPostgresSchema() {
  const p = getPgPool();
  if (!p) return false;
  if (isInitialized) return true;

  try {
    const client = await p.connect();
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS gb_system_meta (
          key VARCHAR(100) PRIMARY KEY,
          value TEXT
        );

        CREATE TABLE IF NOT EXISTS gb_deleted_items (
          id VARCHAR(255) PRIMARY KEY,
          type VARCHAR(50),
          deleted_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS gb_company_profile (
          id INT PRIMARY KEY DEFAULT 1,
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

        CREATE TABLE IF NOT EXISTS gb_projects (
          id VARCHAR(255) PRIMARY KEY,
          name TEXT NOT NULL,
          client TEXT,
          client_phone TEXT,
          location TEXT,
          type TEXT DEFAULT 'Residential Apartment',
          total_area_sqft NUMERIC DEFAULT 0,
          budget NUMERIC DEFAULT 0,
          spent NUMERIC DEFAULT 0,
          progress INT DEFAULT 0,
          status TEXT DEFAULT 'In Progress',
          supervisor TEXT,
          start_date TEXT,
          estimated_completion TEXT,
          notes TEXT,
          created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS gb_materials (
          id VARCHAR(255) PRIMARY KEY,
          date TEXT NOT NULL,
          category TEXT NOT NULL,
          item TEXT NOT NULL,
          project_id VARCHAR(255),
          project_name TEXT,
          vendor TEXT,
          amount NUMERIC NOT NULL,
          tax_amount NUMERIC DEFAULT 0,
          payment_mode TEXT,
          bill_number TEXT,
          notes TEXT,
          created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS gb_labor_roster (
          id VARCHAR(255) PRIMARY KEY,
          name TEXT NOT NULL,
          role TEXT NOT NULL,
          daily_rate NUMERIC NOT NULL,
          phone TEXT,
          site_assigned TEXT,
          day_name TEXT DEFAULT 'Monday',
          duty TEXT DEFAULT '1 Duty',
          total_amount NUMERIC DEFAULT 950,
          days_present NUMERIC DEFAULT 0,
          advance_paid NUMERIC DEFAULT 0,
          status TEXT DEFAULT 'Active',
          mon_duty TEXT DEFAULT '-', mon_amt NUMERIC DEFAULT 0, mon_site TEXT DEFAULT '',
          tue_duty TEXT DEFAULT '-', tue_amt NUMERIC DEFAULT 0, tue_site TEXT DEFAULT '',
          wed_duty TEXT DEFAULT '-', wed_amt NUMERIC DEFAULT 0, wed_site TEXT DEFAULT '',
          thu_duty TEXT DEFAULT '-', thu_amt NUMERIC DEFAULT 0, thu_site TEXT DEFAULT '',
          fri_duty TEXT DEFAULT '-', fri_amt NUMERIC DEFAULT 0, fri_site TEXT DEFAULT '',
          sat_duty TEXT DEFAULT '-', sat_amt NUMERIC DEFAULT 0, sat_site TEXT DEFAULT '',
          sun_duty TEXT DEFAULT '-', sun_amt NUMERIC DEFAULT 0, sun_site TEXT DEFAULT '',
          week_label TEXT DEFAULT '',
          created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS gb_vendors (
          id VARCHAR(255) PRIMARY KEY,
          name TEXT NOT NULL,
          contact_person TEXT,
          phone TEXT,
          category TEXT,
          gstin TEXT,
          address TEXT,
          balance_due NUMERIC DEFAULT 0,
          role TEXT DEFAULT 'Raw Materials',
          created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS gb_accounts (
          id VARCHAR(255) PRIMARY KEY,
          name TEXT NOT NULL,
          account_number TEXT,
          bank TEXT,
          type TEXT,
          balance NUMERIC DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS gb_transactions (
          id VARCHAR(255) PRIMARY KEY,
          date TEXT NOT NULL,
          type TEXT NOT NULL,
          account_id VARCHAR(255),
          account_name TEXT,
          category TEXT,
          amount NUMERIC NOT NULL,
          party TEXT,
          project TEXT,
          reference TEXT,
          created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS gb_supplier_payments (
          id VARCHAR(255) PRIMARY KEY,
          vendor TEXT NOT NULL,
          project_name TEXT NOT NULL,
          amount NUMERIC NOT NULL,
          date TEXT NOT NULL,
          payment_mode TEXT DEFAULT 'Cash in Hand',
          notes TEXT,
          created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS gb_labor_weekly_history (
          id VARCHAR(255) PRIMARY KEY,
          week_label TEXT NOT NULL,
          week_ending TEXT NOT NULL,
          total_workers INT DEFAULT 0,
          total_shifts NUMERIC DEFAULT 0,
          total_wages NUMERIC DEFAULT 0,
          masons_count INT DEFAULT 0,
          helpers_count INT DEFAULT 0,
          site_breakdown_json TEXT,
          workers_data_json TEXT,
          created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        );
      `);
      isInitialized = true;
      console.log('✅ PostgreSQL cloud schema verified and ready.');
      return true;
    } finally {
      client.release();
    }
  } catch (err) {
    console.warn('PostgreSQL schema verification skipped:', err.message);
    return false;
  }
}

export async function loadSnapshotFromPostgres() {
  const p = getPgPool();
  if (!p) return null;

  try {
    await initPostgresSchema();
    const client = await p.connect();
    try {
      const companyRes = await client.query('SELECT * FROM gb_company_profile WHERE id = 1');
      const projectsRes = await client.query('SELECT * FROM gb_projects ORDER BY created_at DESC');
      const materialsRes = await client.query('SELECT * FROM gb_materials ORDER BY date DESC, created_at DESC');
      const laborRes = await client.query("SELECT * FROM gb_labor_roster ORDER BY CASE WHEN role = 'Ma' THEN 1 WHEN role = 'Mm' THEN 2 ELSE 3 END, name ASC");
      const vendorsRes = await client.query('SELECT * FROM gb_vendors ORDER BY name ASC');
      const accountsRes = await client.query('SELECT * FROM gb_accounts');
      const txnsRes = await client.query('SELECT * FROM gb_transactions ORDER BY date DESC, created_at DESC');
      const suppPayRes = await client.query('SELECT * FROM gb_supplier_payments ORDER BY date DESC, created_at DESC');
      const laborHistRes = await client.query('SELECT * FROM gb_labor_weekly_history ORDER BY created_at DESC');
      const metaRes = await client.query('SELECT * FROM gb_system_meta');
      const deletedRes = await client.query('SELECT id FROM gb_deleted_items');

      const meta = {};
      metaRes.rows.forEach(r => { meta[r.key] = r.value; });

      const totalCount = projectsRes.rows.length + materialsRes.rows.length + laborRes.rows.length + txnsRes.rows.length + suppPayRes.rows.length;
      if (totalCount === 0 && !companyRes.rows[0]) {
        return null;
      }

      return {
        company: companyRes.rows[0] || null,
        projects: projectsRes.rows,
        materials: materialsRes.rows,
        labor: laborRes.rows,
        vendors: vendorsRes.rows,
        accounts: accountsRes.rows,
        transactions: txnsRes.rows,
        supplierPayments: suppPayRes.rows,
        laborWeeklyHistory: laborHistRes.rows,
        deletedIds: deletedRes.rows.map(r => r.id),
        meta
      };
    } finally {
      client.release();
    }
  } catch (err) {
    console.warn('Failed to load snapshot from PostgreSQL:', err.message);
    return null;
  }
}

export async function saveSnapshotToPostgres(snapshot) {
  const p = getPgPool();
  if (!p || !snapshot) return false;

  try {
    await initPostgresSchema();
    const client = await p.connect();
    try {
      await client.query('BEGIN');

      if (snapshot.company && snapshot.company.name) {
        const c = snapshot.company;
        await client.query(`
          INSERT INTO gb_company_profile (id, name, tagline, gstin, pan, phone, email, website, address, bank_name, account_name, account_number, ifsc_code, branch, terms)
          VALUES (1, $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
          ON CONFLICT(id) DO UPDATE SET
            name = EXCLUDED.name, tagline = EXCLUDED.tagline, gstin = EXCLUDED.gstin, pan = EXCLUDED.pan,
            phone = EXCLUDED.phone, email = EXCLUDED.email, website = EXCLUDED.website, address = EXCLUDED.address,
            bank_name = EXCLUDED.bank_name, account_name = EXCLUDED.account_name, account_number = EXCLUDED.account_number,
            ifsc_code = EXCLUDED.ifsc_code, branch = EXCLUDED.branch, terms = EXCLUDED.terms
        `, [c.name, c.tagline || '', c.gstin || '', c.pan || '', c.phone || '', c.email || '', c.website || '', c.address || '', c.bank_name || '', c.account_name || '', c.account_number || '', c.ifsc_code || '', c.branch || '', c.terms || '']);
      }

      if (Array.isArray(snapshot.deletedIds)) {
        for (const delId of snapshot.deletedIds) {
          if (!delId) continue;
          await client.query('INSERT INTO gb_deleted_items (id) VALUES ($1) ON CONFLICT (id) DO NOTHING', [delId]);
          await client.query('DELETE FROM gb_projects WHERE id = $1', [delId]);
          await client.query('DELETE FROM gb_materials WHERE id = $1', [delId]);
          await client.query('DELETE FROM gb_labor_roster WHERE id = $1', [delId]);
          await client.query('DELETE FROM gb_vendors WHERE id = $1', [delId]);
          await client.query('DELETE FROM gb_transactions WHERE id = $1', [delId]);
          await client.query('DELETE FROM gb_supplier_payments WHERE id = $1', [delId]);
        }
      }

      if (Array.isArray(snapshot.projects)) {
        for (const pr of snapshot.projects) {
          if (!pr.id || !pr.name) continue;
          await client.query(`
            INSERT INTO gb_projects (id, name, client, client_phone, location, type, total_area_sqft, budget, spent, progress, status, supervisor, start_date, estimated_completion, notes)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
            ON CONFLICT (id) DO UPDATE SET
              name = EXCLUDED.name, client = EXCLUDED.client, client_phone = EXCLUDED.client_phone, location = EXCLUDED.location,
              type = EXCLUDED.type, total_area_sqft = EXCLUDED.total_area_sqft, budget = EXCLUDED.budget, spent = EXCLUDED.spent,
              progress = EXCLUDED.progress, status = EXCLUDED.status, supervisor = EXCLUDED.supervisor, notes = EXCLUDED.notes
          `, [pr.id, pr.name, pr.client || '', pr.client_phone || '', pr.location || '', pr.type || 'Residential', Number(pr.total_area_sqft) || 0, Number(pr.budget) || 0, Number(pr.spent) || 0, Number(pr.progress) || 10, pr.status || 'In Progress', pr.supervisor || 'Civil Engg', pr.start_date || '', pr.estimated_completion || '', pr.notes || '']);
        }
      }

      if (Array.isArray(snapshot.materials)) {
        for (const m of snapshot.materials) {
          if (!m.id || !m.item) continue;
          await client.query(`
            INSERT INTO gb_materials (id, date, category, item, project_id, project_name, vendor, amount, tax_amount, payment_mode, bill_number, notes)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            ON CONFLICT (id) DO UPDATE SET
              date = EXCLUDED.date, category = EXCLUDED.category, item = EXCLUDED.item, project_id = EXCLUDED.project_id,
              project_name = EXCLUDED.project_name, vendor = EXCLUDED.vendor, amount = EXCLUDED.amount, tax_amount = EXCLUDED.tax_amount,
              payment_mode = EXCLUDED.payment_mode, bill_number = EXCLUDED.bill_number, notes = EXCLUDED.notes
          `, [m.id, m.date, m.category || 'Raw Materials', m.item, m.project_id || null, m.project_name || 'General Site', m.vendor || 'Supplier', Number(m.amount) || 0, Number(m.tax_amount) || 0, m.payment_mode || 'Cash in Hand', m.bill_number || `VCH-${m.id}`, m.notes || '']);
        }
      }

      if (Array.isArray(snapshot.labor)) {
        for (const l of snapshot.labor) {
          if (!l.id || !l.name) continue;
          await client.query(`
            INSERT INTO gb_labor_roster (
              id, name, role, daily_rate, phone, site_assigned, day_name, duty, total_amount, days_present, advance_paid, status,
              mon_duty, mon_amt, mon_site, tue_duty, tue_amt, tue_site, wed_duty, wed_amt, wed_site,
              thu_duty, thu_amt, thu_site, fri_duty, fri_amt, fri_site, sat_duty, sat_amt, sat_site,
              sun_duty, sun_amt, sun_site, week_label
            ) VALUES (
              $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12,
              $13, $14, $15, $16, $17, $18, $19, $20, $21,
              $22, $23, $24, $25, $26, $27, $28, $29, $30,
              $31, $32, $33, $34
            ) ON CONFLICT (id) DO UPDATE SET
              name = EXCLUDED.name, role = EXCLUDED.role, daily_rate = EXCLUDED.daily_rate, phone = EXCLUDED.phone,
              site_assigned = EXCLUDED.site_assigned, day_name = EXCLUDED.day_name, duty = EXCLUDED.duty,
              total_amount = EXCLUDED.total_amount, days_present = EXCLUDED.days_present, advance_paid = EXCLUDED.advance_paid,
              status = EXCLUDED.status,
              mon_duty = EXCLUDED.mon_duty, mon_amt = EXCLUDED.mon_amt, mon_site = EXCLUDED.mon_site,
              tue_duty = EXCLUDED.tue_duty, tue_amt = EXCLUDED.tue_amt, tue_site = EXCLUDED.tue_site,
              wed_duty = EXCLUDED.wed_duty, wed_amt = EXCLUDED.wed_amt, wed_site = EXCLUDED.wed_site,
              thu_duty = EXCLUDED.thu_duty, thu_amt = EXCLUDED.thu_amt, thu_site = EXCLUDED.thu_site,
              fri_duty = EXCLUDED.fri_duty, fri_amt = EXCLUDED.fri_amt, fri_site = EXCLUDED.fri_site,
              sat_duty = EXCLUDED.sat_duty, sat_amt = EXCLUDED.sat_amt, sat_site = EXCLUDED.sat_site,
              sun_duty = EXCLUDED.sun_duty, sun_amt = EXCLUDED.sun_amt, sun_site = EXCLUDED.sun_site,
              week_label = EXCLUDED.week_label
          `, [
            l.id, l.name, l.role || 'Ma', Number(l.daily_rate) || 950, l.phone || '', l.site_assigned || 'General Site', l.day_name || 'Monday', l.duty || '-', Number(l.total_amount) || 0, Number(l.days_present) || 0, Number(l.advance_paid) || 0, l.status || 'Active',
            l.mon_duty || '-', Number(l.mon_amt) || 0, l.mon_site || '',
            l.tue_duty || '-', Number(l.tue_amt) || 0, l.tue_site || '',
            l.wed_duty || '-', Number(l.wed_amt) || 0, l.wed_site || '',
            l.thu_duty || '-', Number(l.thu_amt) || 0, l.thu_site || '',
            l.fri_duty || '-', Number(l.fri_amt) || 0, l.fri_site || '',
            l.sat_duty || '-', Number(l.sat_amt) || 0, l.sat_site || '',
            l.sun_duty || '-', Number(l.sun_amt) || 0, l.sun_site || '',
            l.week_label || ''
          ]);
        }
      }

      if (Array.isArray(snapshot.vendors)) {
        for (const v of snapshot.vendors) {
          if (!v.id || !v.name) continue;
          await client.query(`
            INSERT INTO gb_vendors (id, name, contact_person, phone, category, gstin, address, balance_due, role)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            ON CONFLICT (id) DO UPDATE SET
              name = EXCLUDED.name, contact_person = EXCLUDED.contact_person, phone = EXCLUDED.phone,
              category = EXCLUDED.category, gstin = EXCLUDED.gstin, address = EXCLUDED.address,
              balance_due = EXCLUDED.balance_due, role = EXCLUDED.role
          `, [v.id, v.name, v.contact_person || '', v.phone || '', v.category || 'Raw Materials', v.gstin || '', v.address || '', Number(v.balance_due) || 0, v.role || 'Raw Materials']);
        }
      }

      if (Array.isArray(snapshot.transactions)) {
        for (const t of snapshot.transactions) {
          if (!t.id || !t.amount) continue;
          await client.query(`
            INSERT INTO gb_transactions (id, date, type, account_id, account_name, category, amount, party, project, reference)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            ON CONFLICT (id) DO UPDATE SET
              date = EXCLUDED.date, type = EXCLUDED.type, account_id = EXCLUDED.account_id,
              account_name = EXCLUDED.account_name, category = EXCLUDED.category, amount = EXCLUDED.amount,
              party = EXCLUDED.party, project = EXCLUDED.project, reference = EXCLUDED.reference
          `, [t.id, t.date, t.type || 'Expense', t.account_id || 'ACC-01', t.account_name || 'Primary Bank Current Account', t.category || 'General', Number(t.amount) || 0, t.party || 'Self', t.project || 'General / HQ', t.reference || 'Cash']);
        }
      }

      if (Array.isArray(snapshot.supplierPayments)) {
        for (const sp of snapshot.supplierPayments) {
          if (!sp.id || !sp.amount) continue;
          await client.query(`
            INSERT INTO gb_supplier_payments (id, vendor, project_name, amount, date, payment_mode, notes)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            ON CONFLICT (id) DO UPDATE SET
              vendor = EXCLUDED.vendor, project_name = EXCLUDED.project_name, amount = EXCLUDED.amount,
              date = EXCLUDED.date, payment_mode = EXCLUDED.payment_mode, notes = EXCLUDED.notes
          `, [sp.id, sp.vendor || 'Supplier', sp.project_name || 'General Site', Number(sp.amount) || 0, sp.date, sp.payment_mode || 'Cash in Hand', sp.notes || '']);
        }
      }

      if (Array.isArray(snapshot.laborWeeklyHistory)) {
        for (const h of snapshot.laborWeeklyHistory) {
          if (!h.id || !h.week_ending) continue;
          await client.query(`
            INSERT INTO gb_labor_weekly_history (id, week_label, week_ending, total_workers, total_shifts, total_wages, masons_count, helpers_count, site_breakdown_json, workers_data_json)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            ON CONFLICT (id) DO UPDATE SET
              week_label = EXCLUDED.week_label, week_ending = EXCLUDED.week_ending, total_workers = EXCLUDED.total_workers,
              total_shifts = EXCLUDED.total_shifts, total_wages = EXCLUDED.total_wages, masons_count = EXCLUDED.masons_count,
              helpers_count = EXCLUDED.helpers_count, site_breakdown_json = EXCLUDED.site_breakdown_json, workers_data_json = EXCLUDED.workers_data_json
          `, [h.id, h.week_label || `Week ending ${h.week_ending}`, h.week_ending, Number(h.total_workers) || 0, Number(h.total_shifts) || 0, Number(h.total_wages) || 0, Number(h.masons_count) || 0, Number(h.helpers_count) || 0, typeof h.site_breakdown_json === 'string' ? h.site_breakdown_json : JSON.stringify(h.site_breakdown_json || []), typeof h.workers_data_json === 'string' ? h.workers_data_json : JSON.stringify(h.workers_data_json || [])]);
        }
      }

      if (snapshot.meta) {
        for (const [k, v] of Object.entries(snapshot.meta)) {
          await client.query(`INSERT INTO gb_system_meta (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`, [k, String(v)]);
        }
      }

      await client.query('COMMIT');
      return true;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.warn('PostgreSQL cloud save skipped:', err.message);
    return false;
  }
}
