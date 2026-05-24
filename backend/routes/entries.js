const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/entries/summary?from=YYYY-MM-DD&to=YYYY-MM-DD
router.get('/summary', (req, res) => {
  const { from, to, date } = req.query;
  let where = '1=1';
  const params = [];

  if (date) {
    where += ' AND date = ?'; params.push(date);
  } else {
    if (from) { where += ' AND date >= ?'; params.push(from); }
    if (to)   { where += ' AND date <= ?'; params.push(to); }
  }

  const totals = db.prepare(`
    SELECT type, SUM(amount) as total, COUNT(*) as count
    FROM entries WHERE ${where} GROUP BY type
  `).all(...params);

  const categories = db.prepare(`
    SELECT type, category, SUM(amount) as total, COUNT(*) as count
    FROM entries WHERE ${where} GROUP BY type, category ORDER BY total DESC
  `).all(...params);

  const daily = db.prepare(`
    SELECT date, type, SUM(amount) as total
    FROM entries WHERE ${where} GROUP BY date, type ORDER BY date ASC
  `).all(...params);

  res.json({ totals, categories, daily });
});

// GET /api/entries?date=YYYY-MM-DD  OR  ?from=...&to=...&type=...
router.get('/', (req, res) => {
  const { from, to, type, date } = req.query;
  let query = 'SELECT * FROM entries WHERE 1=1';
  const params = [];

  if (date) {
    query += ' AND date = ?'; params.push(date);
  } else {
    if (from) { query += ' AND date >= ?'; params.push(from); }
    if (to)   { query += ' AND date <= ?'; params.push(to); }
  }
  if (type) { query += ' AND type = ?'; params.push(type); }
  query += ' ORDER BY date DESC, created_at DESC';

  res.json(db.prepare(query).all(...params));
});

// POST /api/entries
router.post('/', (req, res) => {
  const { date, type, category, description, amount } = req.body;
  if (!date || !type || !category || !amount) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  const result = db.prepare(
    'INSERT INTO entries (date, type, category, description, amount) VALUES (?, ?, ?, ?, ?)'
  ).run(date, type, category, description || '', amount);

  const entry = db.prepare('SELECT * FROM entries WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(entry);
});

// PUT /api/entries/:id
router.put('/:id', (req, res) => {
  const { date, type, category, description, amount } = req.body;
  const { id } = req.params;
  db.prepare(
    'UPDATE entries SET date=?, type=?, category=?, description=?, amount=? WHERE id=?'
  ).run(date, type, category, description || '', amount, id);
  const entry = db.prepare('SELECT * FROM entries WHERE id = ?').get(id);
  if (!entry) return res.status(404).json({ error: 'Entry not found' });
  res.json(entry);
});

// DELETE /api/entries/:id
router.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM entries WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Entry not found' });
  res.json({ success: true });
});

module.exports = router;
