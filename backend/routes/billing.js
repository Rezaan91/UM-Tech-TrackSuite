const express = require('express');
const stripe = require('../lib/stripe');
const { requireAuth } = require('../middleware/auth');
const {
  ensureStripeCustomerForCompany,
  findCompanyByStripeCustomer,
  getBillingSummaryByCompany,
  getPlanFromMetadata,
  getStripePriceIdForPlan,
  storeInvoice,
  storePaymentEvent,
  updateFromStripeSubscription,
  upsertSubscription,
} = require('../services/billingService');

const router = express.Router();

const APP_URL = process.env.APP_URL || 'http://localhost:3000';

const handleStripeWebhook = async (req, res) => {
  const signature = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    res.status(500).json({ error: 'Missing STRIPE_WEBHOOK_SECRET' });
    return;
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, signature, webhookSecret);
  } catch (error) {
    res.status(400).json({ error: `Webhook Error: ${error.message}` });
    return;
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const companyId = session.metadata?.companyId || session.client_reference_id;
      const plan = getPlanFromMetadata(session.metadata?.plan);

      if (companyId && session.subscription) {
        const subscription = await stripe.subscriptions.retrieve(session.subscription);
        await updateFromStripeSubscription({
          companyId,
          stripeSubscription: subscription,
          fallbackPlan: plan,
          overrideStatus: 'ACTIVE',
        });

        await storePaymentEvent({
          companyId,
          eventType: event.type,
          amount: session.amount_total || 0,
          status: 'ACTIVE',
          payload: session,
        });
      }
    }

    if (event.type === 'invoice.paid') {
      const invoice = event.data.object;
      const company = await findCompanyByStripeCustomer(invoice.customer);

      if (company) {
        if (invoice.subscription) {
          const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
          await updateFromStripeSubscription({
            companyId: company.id,
            stripeSubscription: subscription,
            overrideStatus: 'ACTIVE',
          });
        } else {
          await upsertSubscription({
            companyId: company.id,
            plan: 'FREE',
            status: 'ACTIVE',
            mrrCents: 0,
          });
        }

        await storeInvoice({
          companyId: company.id,
          amount: invoice.amount_paid,
          currency: invoice.currency,
          status: 'PAID',
          stripeInvoiceId: invoice.id,
        });

        await storePaymentEvent({
          companyId: company.id,
          eventType: event.type,
          amount: invoice.amount_paid,
          status: 'PAID',
          payload: invoice,
        });
      }
    }

    if (event.type === 'invoice.payment_failed') {
      const invoice = event.data.object;
      const company = await findCompanyByStripeCustomer(invoice.customer);

      if (company) {
        const subscription = invoice.subscription
          ? await stripe.subscriptions.retrieve(invoice.subscription)
          : null;

        if (subscription) {
          await updateFromStripeSubscription({
            companyId: company.id,
            stripeSubscription: subscription,
            overrideStatus: 'PAST_DUE',
          });
        } else {
          await upsertSubscription({
            companyId: company.id,
            plan: 'FREE',
            status: 'PAST_DUE',
            mrrCents: 0,
          });
        }

        await storeInvoice({
          companyId: company.id,
          amount: invoice.amount_due,
          currency: invoice.currency,
          status: 'FAILED',
          stripeInvoiceId: invoice.id,
        });

        await storePaymentEvent({
          companyId: company.id,
          eventType: event.type,
          amount: invoice.amount_due,
          status: 'FAILED',
          payload: invoice,
        });
      }
    }

    res.json({ received: true });
  } catch (error) {
    res.status(500).json({ error: 'Webhook processing failed' });
  }
};

router.use(requireAuth);

router.get('/summary', async (req, res) => {
  try {
    const summary = await getBillingSummaryByCompany(req.user.companyId);
    res.json(summary);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load billing summary' });
  }
});

router.post('/create-checkout-session', async (req, res) => {
  const requestedPlan = getPlanFromMetadata(req.body.plan);

  if (requestedPlan === 'FREE') {
    res.status(400).json({ error: 'Use a paid plan for checkout' });
    return;
  }

  const stripePriceId = getStripePriceIdForPlan(requestedPlan);

  if (!stripePriceId) {
    res.status(400).json({ error: `Missing Stripe price id for ${requestedPlan}` });
    return;
  }

  try {
    const customerId = await ensureStripeCustomerForCompany(req.user.companyId, req.user.email);

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [{ price: stripePriceId, quantity: 1 }],
      metadata: {
        companyId: req.user.companyId,
        plan: requestedPlan,
      },
      client_reference_id: req.user.companyId,
      success_url: `${APP_URL}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${APP_URL}/billing/cancel`,
    });

    res.json({ url: session.url, sessionId: session.id });
  } catch (error) {
    res.status(500).json({ error: 'Unable to create checkout session' });
  }
});

router.post('/customer-portal', async (req, res) => {
  try {
    const customerId = await ensureStripeCustomerForCompany(req.user.companyId, req.user.email);
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${APP_URL}/billing`,
    });

    res.json({ url: session.url });
  } catch (error) {
    res.status(500).json({ error: 'Unable to create customer portal session' });
  }
});

module.exports = {
  billingRouter: router,
  handleStripeWebhook,
};
