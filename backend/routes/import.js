const express = require('express');
const multer = require('multer');
const XLSX = require('xlsx');
const db = require('../db');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

const DEFAULT_CATEGORIES = {
  income: ['Salary', 'Bonus', 'Freelance', 'Other income'],
  expense: [
    'Housing & utilities', 'Groceries', 'Dining out', 'Transportation',
    'Healthcare', 'Personal & lifestyle', 'Baby & family', 'Subscriptions', 'Miscellaneous',
  ],
};

function normalizeDate(raw) {
  if (!raw) return null;
  // Excel serial date number
  if (typeof raw === 'number') {
    const date = XLSX.SSF.parse_date_code(raw);
    if (!date) return null;
    const mm = String(date.m).padStart(2, '0');
    const dd = String(date.d).padStart(2, '0');
    return `${date.y}-${mm}-${dd}`;
  }
  // Already a string — normalise separators
  const str = String(raw).trim();
  // Accept YYYY-MM-DD or MM/DD/YYYY or DD/MM/YYYY
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
  const parts = str.split('/');
  if (parts.length === 3) {
    // Assume MM/DD/YYYY
    const [mm, dd, yyyy] = parts;
    return `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
  }
  return null;
}

function findBestMatch(csvCategory, defaultList) {
  const lower = csvCategory.toLowerCase().trim();
  const exact = defaultList.find(c => c.toLowerCase() === lower);
  if (exact) return exact;
  const partial = defaultList.find(c => c.toLowerCase().includes(lower) || lower.includes(c.toLowerCase()));
  return partial || null;
}

// POST /api/import/parse  — multipart: field "file"
router.post('/parse', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  let workbook;
  try {
    workbook = XLSX.read(req.file.buffer, { type: 'buffer', cellDates: false });
  } catch {
    return res.status(400).json({ error: 'Could not parse file. Ensure it is a valid .xlsx file.' });
  }

  const sheetNames = workbook.SheetNames.map(s => s.toLowerCase());
  const setupIdx = sheetNames.findIndex(s => s === 'setup');
  const txIdx = sheetNames.findIndex(s => s === 'transactions');

  if (setupIdx === -1) return res.status(400).json({ error: 'Missing "Setup" sheet in workbook.' });
  if (txIdx === -1) return res.status(400).json({ error: 'Missing "Transactions" sheet in workbook.' });

  // --- Parse Setup sheet ---
  const setupSheet = workbook.Sheets[workbook.SheetNames[setupIdx]];
  const setupRows = XLSX.utils.sheet_to_json(setupSheet, { header: 1, defval: '' });

  const csvIncomeCategories = [];
  const csvExpenseCategories = [];

  // Row 0 = headers (Income / Expense), rows 1+ = values
  for (let i = 1; i < setupRows.length; i++) {
    const [incVal, expVal] = setupRows[i];
    if (incVal && String(incVal).trim()) csvIncomeCategories.push(String(incVal).trim());
    if (expVal && String(expVal).trim()) csvExpenseCategories.push(String(expVal).trim());
  }

  // --- Parse Transactions sheet ---
  const txSheet = workbook.Sheets[workbook.SheetNames[txIdx]];
  const txRows = XLSX.utils.sheet_to_json(txSheet, { header: 1, defval: '' });

  if (txRows.length < 2) return res.status(400).json({ error: 'Transactions sheet has no data rows.' });

  // Normalise header names
  const headers = txRows[0].map(h => String(h).toLowerCase().trim());
  const col = name => headers.findIndex(h => h.includes(name));

  const dateCol = col('date');
  const typeCol = col('type');
  const catCol = col('category') !== -1 ? col('category') : col('cat');
  const amtCol = col('amount') !== -1 ? col('amount') : col('amt');
  const descCol = col('description') !== -1 ? col('description') : col('desc');

  if (dateCol === -1 || typeCol === -1 || catCol === -1 || amtCol === -1) {
    return res.status(400).json({
      error: 'Transactions sheet must have columns: Date, Type, Category, Amount. Optional: Description.',
    });
  }

  const transactions = [];
  for (let i = 1; i < txRows.length; i++) {
    const row = txRows[i];
    const rawDate = row[dateCol];
    const rawType = String(row[typeCol] || '').toLowerCase().trim();
    const rawCat = String(row[catCol] || '').trim();
    const rawAmt = row[amtCol];
    const rawDesc = descCol !== -1 ? String(row[descCol] || '').trim() : '';

    if (!rawDate && !rawCat && !rawAmt) continue; // skip blank rows

    const date = normalizeDate(rawDate);
    const type = rawType === 'income' ? 'income' : rawType === 'expense' ? 'expense' : null;
    const amount = parseFloat(rawAmt);

    transactions.push({
      rowIndex: i + 1, // 1-based for user display
      date,
      type,
      category: rawCat,
      amount: isNaN(amount) ? null : amount,
      description: rawDesc,
      parseErrors: [
        !date && 'Invalid date',
        !type && 'Type must be "income" or "expense"',
        !rawCat && 'Missing category',
        (isNaN(amount) || amount <= 0) && 'Invalid amount',
      ].filter(Boolean),
    });
  }

  // --- Build category mapping suggestions ---
  const allCsvCategories = {
    income: [...new Set(csvIncomeCategories)],
    expense: [...new Set(csvExpenseCategories)],
  };

  const mappingSuggestions = {};
  ['income', 'expense'].forEach(t => {
    allCsvCategories[t].forEach(csvCat => {
      const key = `${t}::${csvCat}`;
      const match = findBestMatch(csvCat, DEFAULT_CATEGORIES[t]);
      mappingSuggestions[key] = {
        csvCategory: csvCat,
        type: t,
        suggestedMatch: match,
        isNew: !match,
      };
    });
  });

  // Also add any categories from transactions not listed in Setup
  transactions.forEach(tx => {
    if (!tx.type || !tx.category) return;
    const key = `${tx.type}::${tx.category}`;
    if (!mappingSuggestions[key]) {
      const match = findBestMatch(tx.category, DEFAULT_CATEGORIES[tx.type]);
      mappingSuggestions[key] = {
        csvCategory: tx.category,
        type: tx.type,
        suggestedMatch: match,
        isNew: !match,
      };
    }
  });

  res.json({
    csvCategories: allCsvCategories,
    defaultCategories: DEFAULT_CATEGORIES,
    mappingSuggestions,
    transactions,
    totalRows: transactions.length,
  });
});

// POST /api/import/confirm  — JSON body: { transactions: [...], mappings: { "income::Salary": "Salary", ... } }
router.post('/confirm', (req, res) => {
  const { transactions, mappings } = req.body;
  if (!Array.isArray(transactions) || !transactions.length) {
    return res.status(400).json({ error: 'No transactions provided.' });
  }

  // Check for duplicates against existing DB rows
  const inserted = [];
  const skipped = [];
  const errors = [];

  const insertStmt = db.prepare(
    'INSERT INTO entries (date, type, category, description, amount) VALUES (?, ?, ?, ?, ?)'
  );

  const dupCheck = db.prepare(
    'SELECT id FROM entries WHERE date=? AND type=? AND category=? AND amount=? LIMIT 1'
  );

  const bulkInsert = db.transaction((rows) => {
    for (const tx of rows) {
      const mappedCategory = mappings[`${tx.type}::${tx.category}`] || tx.category;
      try {
        const dup = dupCheck.get(tx.date, tx.type, mappedCategory, tx.amount);
        if (dup) {
          skipped.push({ ...tx, reason: 'duplicate' });
          continue;
        }
        const result = insertStmt.run(tx.date, tx.type, mappedCategory, tx.description || '', tx.amount);
        inserted.push({ ...tx, id: result.lastInsertRowid, category: mappedCategory });
      } catch (err) {
        errors.push({ ...tx, reason: err.message });
      }
    }
  });

  try {
    bulkInsert(transactions);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }

  res.json({ inserted: inserted.length, skipped: skipped.length, errors: errors.length, details: { inserted, skipped, errors } });
});

// POST /api/import/check-duplicates — preview which rows would be dupes before confirming
router.post('/check-duplicates', (req, res) => {
  const { transactions, mappings } = req.body;
  if (!Array.isArray(transactions)) return res.status(400).json({ error: 'transactions required' });

  const dupCheck = db.prepare(
    'SELECT id FROM entries WHERE date=? AND type=? AND category=? AND amount=? LIMIT 1'
  );

  const duplicateRowIndices = new Set();
  transactions.forEach(tx => {
    const mappedCategory = (mappings || {})[`${tx.type}::${tx.category}`] || tx.category;
    const dup = dupCheck.get(tx.date, tx.type, mappedCategory, tx.amount);
    if (dup) duplicateRowIndices.add(tx.rowIndex);
  });

  res.json({ duplicateRowIndices: [...duplicateRowIndices] });
});

module.exports = router;
