const Database = require('better-sqlite3');
const path = require('path');

const dbPath = process.env.DB_PATH || path.join(__dirname, 'expense_tracker.db');
const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
    category TEXT NOT NULL,
    description TEXT DEFAULT '',
    amount REAL NOT NULL CHECK(amount > 0),
    created_at TEXT DEFAULT (datetime('now'))
  )
`);

module.exports = db;
