const db = require('../models/db');

const ALLOWED_ROLES = new Set(['USER', 'ADMIN', 'SUPER_ADMIN']);

const normalizeRole = (role) => {
  const normalizedRole = (role || 'USER').toUpperCase();
  return ALLOWED_ROLES.has(normalizedRole) ? normalizedRole : 'USER';
};

const getUserFromHeaders = (req) => {
  const userId = req.header('x-user-id') || 'demo-admin';
  const companyId = req.header('x-company-id') || 'demo-company';
  const role = normalizeRole(req.header('x-user-role') || 'ADMIN');
  const email = req.header('x-user-email') || 'demo@tracksuite.com';
  const name = req.header('x-user-name') || 'TrackSuite User';

  return {
    id: userId,
    companyId,
    role,
    email,
    name,
  };
};

const ensureTenantRecords = async (user) => {
  await db.runAsync('INSERT OR IGNORE INTO companies (id, name) VALUES (?, ?)', [
    user.companyId,
    `${user.companyId} Company`,
  ]);

  await db.runAsync(
    'INSERT OR IGNORE INTO users (id, name, email, role, company_id) VALUES (?, ?, ?, ?, ?)',
    [user.id, user.name, user.email, user.role, user.companyId]
  );

  await db.runAsync(
    `INSERT OR IGNORE INTO subscriptions (id, company_id, plan, status, mrr_cents) VALUES (?, ?, 'FREE', 'ACTIVE', 0)`,
    [`sub_${user.companyId}`, user.companyId]
  );
};

const requireAuth = async (req, res, next) => {
  try {
    const user = getUserFromHeaders(req);
    await ensureTenantRecords(user);
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Unauthorized' });
  }
};

const requireRoles = (roles = []) => {
  const allowedRoles = new Set(roles.map((role) => role.toUpperCase()));

  return (req, res, next) => {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    if (!allowedRoles.has(req.user.role)) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    next();
  };
};

module.exports = {
  requireAuth,
  requireRoles,
};
