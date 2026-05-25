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

  const wb = XLSX.utils.book_new();

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
