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

db.exec(`
  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
    UNIQUE(name, type)
  )
`);

const defaultCategories = [
  { type: 'income', name: 'Salary' },
  { type: 'income', name: 'Bonus' },
  { type: 'income', name: 'Freelance' },
  { type: 'income', name: 'Other income' },
  { type: 'expense', name: 'Housing & utilities' },
  { type: 'expense', name: 'Groceries' },
  { type: 'expense', name: 'Dining out' },
  { type: 'expense', name: 'Transportation' },
  { type: 'expense', name: 'Healthcare' },
  { type: 'expense', name: 'Personal & lifestyle' },
  { type: 'expense', name: 'Baby & family' },
  { type: 'expense', name: 'Subscriptions' },
  { type: 'expense', name: 'Miscellaneous' },
];

const insertCat = db.prepare('INSERT OR IGNORE INTO categories (name, type) VALUES (?, ?)');
db.transaction(() => {
  for (const { type, name } of defaultCategories) insertCat.run(name, type);
})();

module.exports = db;
