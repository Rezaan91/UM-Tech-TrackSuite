const express = require('express');
const db = require('../models/db');
const { requireAuth, requireRoles } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth);
router.use(requireRoles(['ADMIN', 'SUPER_ADMIN']));

router.get('/revenue', async (req, res) => {
  try {
    const [mrrRow, activeSubsRow, planDistribution] = await Promise.all([
      db.getAsync(
        `SELECT COALESCE(SUM(mrr_cents), 0) AS mrrCents FROM subscriptions WHERE status = 'ACTIVE' AND plan != 'FREE'`
      ),
      db.getAsync(`SELECT COUNT(*) AS count FROM subscriptions WHERE status = 'ACTIVE' AND plan != 'FREE'`),
      db.allAsync(`SELECT plan, COUNT(*) AS count FROM subscriptions GROUP BY plan ORDER BY count DESC`),
    ]);

    res.json({
      mrrCents: mrrRow?.mrrCents || 0,
      currency: 'usd',
      activeSubscriptions: activeSubsRow?.count || 0,
      planDistribution,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to load revenue analytics' });
  }
});

module.exports = router;
