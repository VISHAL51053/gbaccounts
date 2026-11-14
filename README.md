# GURUBARAN BUILDERS - Civil & Construction ERP

Personal accounts, material management, site costing, and labor tracking software for **GURUBARAN BUILDERS**.

## Features
- **Standalone Single HTML**: Clean, editable `index.html` and `gurubaran_builders.html`.
- **Persistent SQLite Database**: `database/gurubaran_builders.db` (WAL mode enabled).
- **Personal Master Single-User Login**: Secure password protection for the owner (`gurubaran`).
- **Site Tracking**: Budgets, expenditures, and progress for civil projects.
- **Raw Materials**: Procurement ledger for cement, steel, sand, bricks, and equipment.
- **Muster Roll & Labor**: Worker attendance, daily wage rate calculation, and advance tracking.
- **Vendors & Suppliers**: Supplier directory and balance due tracking.
- **Banking & Cash**: Current account and site petty cash ledgers.

## Production data persistence

SQLite is stored in the `database` directory by default. In production, point
`DATA_DIR` to the hosting provider's persistent volume, or configure
`DATABASE_URL` with a managed PostgreSQL database. The application reports its
active persistence backend and storage warning at `/api/status`; verify this
endpoint and take regular backups before relying on a deployment.

The browser's local data is an offline cache, not the source of truth. If the
server reports no saved records, the app will not automatically upload a
device's cached data because it may be stale. Restore only from a verified
backup after confirming the server's storage configuration.

## Getting Started
1. Run `run_app.bat` or execute:
   ```bash
   node server.js
   ```
2. Open `http://localhost:5000` in your web browser.
3. Master Login Credentials:
   - **Username**: `gurubaran`
   - **Password**: `admin123`
