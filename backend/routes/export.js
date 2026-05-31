const express = require('express');
const router = express.Router();
const XLSX = require('xlsx');
const db = require('../db');

// GET /api/export?from=YYYY-MM-DD&to=YYYY-MM-DD
router.get('/', (req, res) => {
  const { from, to } = req.query;

  let where = '1=1';
  const params = [];
  if (from) { where += ' AND date >= ?'; params.push(from); }
  if (to)   { where += ' AND date <= ?'; params.push(to); }

  const entries = db.prepare(
    `SELECT date, type, category, description, amount
     FROM entries WHERE ${where}
     ORDER BY date ASC, created_at ASC`
  ).all(...params);

  const categories = db.prepare(
    `SELECT name, type FROM categories ORDER BY type, id`
  ).all();
  const incomeCategories = categories.filter(c => c.type === 'income').map(c => c.name);
  const expenseCategories = categories.filter(c => c.type === 'expense').map(c => c.name);
  const setupRows = Math.max(incomeCategories.length, expenseCategories.length);
  const setupData = [
    ['Income', 'Expense'],
    ...Array.from({ length: setupRows }, (_, i) => [
      incomeCategories[i] || '',
      expenseCategories[i] || '',
    ]),
  ];
  const setupWs = XLSX.utils.aoa_to_sheet(setupData);
  setupWs['!cols'] = [{ wch: 24 }, { wch: 24 }];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, setupWs, 'Setup');

  const wsData = [
    ['Date', 'Type', 'Category', 'Description', 'Amount'],
    ...entries.map(e => [e.date, e.type, e.category, e.description || '', e.amount]),
  ];
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  ws['!cols'] = [
    { wch: 12 },
    { wch: 10 },
    { wch: 24 },
    { wch: 32 },
    { wch: 14 },
  ];
  XLSX.utils.book_append_sheet(wb, ws, 'Transactions');

  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  const filename = `fintrack_${from || 'all'}_to_${to || 'all'}.xlsx`;

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(buffer);
});

module.exports = router;
