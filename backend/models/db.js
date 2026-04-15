const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, '../assets.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to the SQLite database.');
  }
});

const DEMO_COMPANY_ID = 'demo-company';
const DEMO_USER_ID = 'demo-admin';

db.runAsync = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.run(sql, params, function runCallback(err) {
      if (err) {
        reject(err);
        return;
      }

      resolve({ lastID: this.lastID, changes: this.changes });
    });
  });

db.getAsync = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) {
        reject(err);
        return;
      }

      resolve(row);
    });
  });

db.allAsync = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        reject(err);
        return;
      }

      resolve(rows);
    });
  });

const tableInfoAsync = async (tableName) => {
  return db.allAsync(`PRAGMA table_info(${tableName})`);
};

const addColumnIfMissing = async (tableName, columnName, definition) => {
  const columns = await tableInfoAsync(tableName);
  const hasColumn = columns.some((column) => column.name === columnName);

  if (!hasColumn) {
    await db.runAsync(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`);
  }
};

const initializeSchema = async () => {
  await db.runAsync(`
    CREATE TABLE IF NOT EXISTS companies (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      stripe_customer_id TEXT UNIQUE,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await db.runAsync(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      role TEXT NOT NULL DEFAULT 'USER',
      company_id TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (company_id) REFERENCES companies (id)
    )
  `);

  await db.runAsync(`
    CREATE TABLE IF NOT EXISTS assets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      asset_name TEXT NOT NULL,
      asset_tag TEXT NOT NULL,
      category TEXT NOT NULL,
      location TEXT NOT NULL,
      status TEXT NOT NULL,
      purchase_date TEXT NOT NULL,
      company_id TEXT NOT NULL DEFAULT '${DEMO_COMPANY_ID}',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (company_id) REFERENCES companies (id)
    )
  `);

  await addColumnIfMissing('assets', 'company_id', `TEXT NOT NULL DEFAULT '${DEMO_COMPANY_ID}'`);
  await addColumnIfMissing('assets', 'created_at', `TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP`);

  await db.runAsync(`
    CREATE TABLE IF NOT EXISTS subscriptions (
      id TEXT PRIMARY KEY,
      company_id TEXT NOT NULL UNIQUE,
      plan TEXT NOT NULL DEFAULT 'FREE' CHECK(plan IN ('FREE', 'PRO', 'ENTERPRISE')),
      status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK(status IN ('ACTIVE', 'PAST_DUE', 'CANCELED')),
      mrr_cents INTEGER NOT NULL DEFAULT 0,
      stripe_subscription_id TEXT UNIQUE,
      stripe_price_id TEXT,
      current_period_start TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      current_period_end TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (company_id) REFERENCES companies (id)
    )
  `);

  await db.runAsync(`
    CREATE TABLE IF NOT EXISTS invoices (
      id TEXT PRIMARY KEY,
      company_id TEXT NOT NULL,
      amount INTEGER NOT NULL,
      currency TEXT NOT NULL DEFAULT 'usd',
      status TEXT NOT NULL CHECK(status IN ('PENDING', 'PAID', 'FAILED', 'VOID')),
      stripe_invoice_id TEXT UNIQUE,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (company_id) REFERENCES companies (id)
    )
  `);

  await db.runAsync(`
    CREATE TABLE IF NOT EXISTS payment_events (
      id TEXT PRIMARY KEY,
      company_id TEXT NOT NULL,
      event_type TEXT NOT NULL,
      amount INTEGER,
      status TEXT NOT NULL,
      payload TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (company_id) REFERENCES companies (id)
    )
  `);

  await db.runAsync('CREATE INDEX IF NOT EXISTS idx_assets_company_id ON assets(company_id)');
  await db.runAsync('CREATE INDEX IF NOT EXISTS idx_users_company_id ON users(company_id)');
  await db.runAsync('CREATE INDEX IF NOT EXISTS idx_subscriptions_plan_status ON subscriptions(plan, status)');
  await db.runAsync('CREATE INDEX IF NOT EXISTS idx_invoices_company_id ON invoices(company_id)');
  await db.runAsync('CREATE INDEX IF NOT EXISTS idx_payment_events_company_id ON payment_events(company_id)');

  await db.runAsync(
    `INSERT OR IGNORE INTO companies (id, name) VALUES (?, ?)`,
    [DEMO_COMPANY_ID, 'TrackSuite Demo Company']
  );

  await db.runAsync(
    `INSERT OR IGNORE INTO users (id, name, email, role, company_id) VALUES (?, ?, ?, ?, ?)`,
    [DEMO_USER_ID, 'Demo Admin', 'demo@tracksuite.com', 'ADMIN', DEMO_COMPANY_ID]
  );

  await db.runAsync(
    `INSERT OR IGNORE INTO subscriptions (id, company_id, plan, status, mrr_cents) VALUES (?, ?, 'FREE', 'ACTIVE', 0)`,
    ['sub_demo_company', DEMO_COMPANY_ID]
  );

  await db.runAsync(
    `UPDATE assets SET company_id = ? WHERE company_id IS NULL OR company_id = ''`,
    [DEMO_COMPANY_ID]
  );
};

initializeSchema().catch((error) => {
  console.error('Database initialization failed:', error.message);
});

module.exports = db;
