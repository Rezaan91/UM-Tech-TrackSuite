const express = require('express');
const router = express.Router();
const db = require('../models/db');
const { requireAuth } = require('../middleware/auth');

router.use(requireAuth);

// GET /api/assets - View Asset List
router.get('/', async (req, res) => {
  try {
    const sql = 'SELECT * FROM assets WHERE company_id = ? ORDER BY id DESC';
    const rows = await db.allAsync(sql, [req.user.companyId]);
    res.json(rows);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// POST /api/assets - Add Asset
router.post('/', async (req, res) => {
  const { asset_name, asset_tag, category, location, status, purchase_date } = req.body;
  
  if (!asset_name || !asset_tag || !category || !location || !status || !purchase_date) {
    res.status(400).json({ error: 'Please provide all required fields' });
    return;
  }

  try {
    const sql = 'INSERT INTO assets (asset_name, asset_tag, category, location, status, purchase_date, company_id) VALUES (?, ?, ?, ?, ?, ?, ?)';
    const params = [asset_name, asset_tag, category, location, status, purchase_date, req.user.companyId];
    const result = await db.runAsync(sql, params);

    res.status(201).json({
      id: result.lastID,
      asset_name,
      asset_tag,
      category,
      location,
      status,
      purchase_date,
      company_id: req.user.companyId,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE /api/assets/:id - Delete Asset
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  const sql = 'DELETE FROM assets WHERE id = ? AND company_id = ?';

  try {
    const result = await db.runAsync(sql, [id, req.user.companyId]);
    if (result.changes === 0) {
      res.status(404).json({ error: 'Asset not found' });
      return;
    }

    res.json({ message: 'Asset deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
