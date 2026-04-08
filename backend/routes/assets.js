const express = require('express');
const router = express.Router();
const db = require('../models/db');

// GET /api/assets - View Asset List
router.get('/', (req, res) => {
  const sql = 'SELECT * FROM assets';
  db.all(sql, [], (err, rows) => {
    if (err) {
      res.status(400).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// POST /api/assets - Add Asset
router.post('/', (req, res) => {
  const { asset_name, asset_tag, category, location, status, purchase_date } = req.body;
  
  if (!asset_name || !asset_tag || !category || !location || !status || !purchase_date) {
    res.status(400).json({ error: 'Please provide all required fields' });
    return;
  }

  const sql = 'INSERT INTO assets (asset_name, asset_tag, category, location, status, purchase_date) VALUES (?, ?, ?, ?, ?, ?)';
  const params = [asset_name, asset_tag, category, location, status, purchase_date];
  
  db.run(sql, params, function (err) {
    if (err) {
      res.status(400).json({ error: err.message });
      return;
    }
    res.status(201).json({
      id: this.lastID,
      asset_name,
      asset_tag,
      category,
      location,
      status,
      purchase_date
    });
  });
});

module.exports = router;
