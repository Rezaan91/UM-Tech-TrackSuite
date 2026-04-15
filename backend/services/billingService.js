const { randomUUID } = require('crypto');
const db = require('../models/db');
const stripe = require('../lib/stripe');

const PLAN_CONFIG = {
  FREE: { mrrCents: 0, envPriceKey: null },
  PRO: { mrrCents: 4900, envPriceKey: 'STRIPE_PRICE_PRO' },
  ENTERPRISE: { mrrCents: 19900, envPriceKey: 'STRIPE_PRICE_ENTERPRISE' },
};

const toIsoFromEpochSeconds = (seconds) => {
  if (!seconds) {
    return null;
  }

  return new Date(seconds * 1000).toISOString();
};

const getPlanFromPrice = (priceId) => {
  if (!priceId) {
    return 'FREE';
  }

  if (priceId === process.env.STRIPE_PRICE_PRO) {
    return 'PRO';
  }

  if (priceId === process.env.STRIPE_PRICE_ENTERPRISE) {
    return 'ENTERPRISE';
  }

  return 'FREE';
};

const getPlanFromMetadata = (plan) => {
  if (!plan) {
    return 'FREE';
  }

  const normalizedPlan = String(plan).toUpperCase();
  return PLAN_CONFIG[normalizedPlan] ? normalizedPlan : 'FREE';
};

const getStripePriceIdForPlan = (plan) => {
  const normalizedPlan = getPlanFromMetadata(plan);
  const envKey = PLAN_CONFIG[normalizedPlan].envPriceKey;

  if (!envKey) {
    return null;
  }

  return process.env[envKey] || null;
};

const resolveMRR = (plan, stripeAmount) => {
  if (typeof stripeAmount === 'number') {
    return stripeAmount;
  }

  const normalizedPlan = getPlanFromMetadata(plan);
  return PLAN_CONFIG[normalizedPlan].mrrCents;
};

const ensureStripeCustomerForCompany = async (companyId, emailHint) => {
  const company = await db.getAsync('SELECT * FROM companies WHERE id = ?', [companyId]);

  if (!company) {
    throw new Error('Company not found');
  }

  if (company.stripe_customer_id) {
    return company.stripe_customer_id;
  }

  const customer = await stripe.customers.create({
    email: emailHint || undefined,
    metadata: { companyId },
    name: company.name,
  });

  await db.runAsync('UPDATE companies SET stripe_customer_id = ? WHERE id = ?', [customer.id, companyId]);

  return customer.id;
};

const upsertSubscription = async ({
  companyId,
  plan,
  status,
  stripeSubscriptionId,
  stripePriceId,
  currentPeriodStart,
  currentPeriodEnd,
  mrrCents,
}) => {
  await db.runAsync(
    `INSERT INTO subscriptions (
      id,
      company_id,
      plan,
      status,
      mrr_cents,
      stripe_subscription_id,
      stripe_price_id,
      current_period_start,
      current_period_end,
      updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(company_id) DO UPDATE SET
      plan = excluded.plan,
      status = excluded.status,
      mrr_cents = excluded.mrr_cents,
      stripe_subscription_id = excluded.stripe_subscription_id,
      stripe_price_id = excluded.stripe_price_id,
      current_period_start = excluded.current_period_start,
      current_period_end = excluded.current_period_end,
      updated_at = CURRENT_TIMESTAMP`,
    [
      `sub_${companyId}`,
      companyId,
      plan,
      status,
      mrrCents,
      stripeSubscriptionId || null,
      stripePriceId || null,
      currentPeriodStart || new Date().toISOString(),
      currentPeriodEnd,
    ]
  );
};

const storeInvoice = async ({ companyId, amount, currency, status, stripeInvoiceId }) => {
  await db.runAsync(
    `INSERT INTO invoices (id, company_id, amount, currency, status, stripe_invoice_id)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(stripe_invoice_id) DO UPDATE SET
       amount = excluded.amount,
       currency = excluded.currency,
       status = excluded.status`,
    [randomUUID(), companyId, amount || 0, (currency || 'usd').toLowerCase(), status, stripeInvoiceId || null]
  );
};

const storePaymentEvent = async ({ companyId, eventType, amount, status, payload }) => {
  await db.runAsync(
    'INSERT INTO payment_events (id, company_id, event_type, amount, status, payload) VALUES (?, ?, ?, ?, ?, ?)',
    [randomUUID(), companyId, eventType, amount ?? null, status, JSON.stringify(payload || {})]
  );
};

const findCompanyByStripeCustomer = async (stripeCustomerId) => {
  return db.getAsync('SELECT * FROM companies WHERE stripe_customer_id = ?', [stripeCustomerId]);
};

const getBillingSummaryByCompany = async (companyId) => {
  const [subscription, invoices] = await Promise.all([
    db.getAsync('SELECT * FROM subscriptions WHERE company_id = ?', [companyId]),
    db.allAsync('SELECT * FROM invoices WHERE company_id = ? ORDER BY created_at DESC LIMIT 25', [companyId]),
  ]);

  return {
    subscription,
    invoices,
  };
};

const updateFromStripeSubscription = async ({
  companyId,
  stripeSubscription,
  fallbackPlan,
  overrideStatus,
}) => {
  const firstItem = stripeSubscription?.items?.data?.[0] || null;
  const stripePriceId = firstItem?.price?.id || null;
  const stripeAmount = firstItem?.price?.unit_amount;
  const plan = getPlanFromPrice(stripePriceId) || getPlanFromMetadata(fallbackPlan);
  const normalizedStatus = overrideStatus || (stripeSubscription?.status === 'active' ? 'ACTIVE' : 'PAST_DUE');

  await upsertSubscription({
    companyId,
    plan,
    status: normalizedStatus,
    stripeSubscriptionId: stripeSubscription?.id || null,
    stripePriceId,
    currentPeriodStart: toIsoFromEpochSeconds(stripeSubscription?.current_period_start),
    currentPeriodEnd: toIsoFromEpochSeconds(stripeSubscription?.current_period_end),
    mrrCents: resolveMRR(plan, stripeAmount),
  });
};

module.exports = {
  PLAN_CONFIG,
  ensureStripeCustomerForCompany,
  getBillingSummaryByCompany,
  getPlanFromMetadata,
  getPlanFromPrice,
  getStripePriceIdForPlan,
  findCompanyByStripeCustomer,
  storeInvoice,
  storePaymentEvent,
  upsertSubscription,
  updateFromStripeSubscription,
};
