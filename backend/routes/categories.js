const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/categories?type=income|expense
router.get('/', (req, res) => {
  const { type } = req.query;
  let query = 'SELECT * FROM categories';
  const params = [];
  if (type) {
    query += ' WHERE type = ?';
    params.push(type);
  }
  query += ' ORDER BY type, id';
  res.json(db.prepare(query).all(...params));
});

// POST /api/categories
router.post('/', (req, res) => {
  const { name, type } = req.body;
  if (!name || !type) return res.status(400).json({ error: 'name and type are required' });
  if (!['income', 'expense'].includes(type)) return res.status(400).json({ error: 'type must be income or expense' });

  try {
    const result = db.prepare('INSERT INTO categories (name, type) VALUES (?, ?)').run(name.trim(), type);
    const category = db.prepare('SELECT * FROM categories WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(category);
  } catch (err) {
    if (err.message.includes('UNIQUE')) return res.status(409).json({ error: 'Category already exists' });
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/categories/:id
router.put('/:id', (req, res) => {
  const { name } = req.body;
  const { id } = req.params;
  if (!name) return res.status(400).json({ error: 'name is required' });

  const existing = db.prepare('SELECT * FROM categories WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'Category not found' });

  try {
    db.prepare('UPDATE categories SET name = ? WHERE id = ?').run(name.trim(), id);
    res.json(db.prepare('SELECT * FROM categories WHERE id = ?').get(id));
  } catch (err) {
    if (err.message.includes('UNIQUE')) return res.status(409).json({ error: 'Category already exists' });
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/categories/:id
router.delete('/:id', (req, res) => {
  const category = db.prepare('SELECT * FROM categories WHERE id = ?').get(req.params.id);
  if (!category) return res.status(404).json({ error: 'Category not found' });

  const { count } = db.prepare(
    'SELECT COUNT(*) as count FROM entries WHERE category = ? AND type = ?'
  ).get(category.name, category.type);

  if (count > 0) {
    return res.status(409).json({
      error: `Cannot delete: category is used by ${count} transaction${count !== 1 ? 's' : ''}`,
    });
  }

  db.prepare('DELETE FROM categories WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
