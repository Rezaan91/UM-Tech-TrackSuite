const Stripe = require('stripe');

const apiKey = process.env.STRIPE_SECRET_KEY;

const stripe = apiKey
  ? new Stripe(apiKey)
  : {
      checkout: { sessions: { create: async () => { throw new Error('Stripe is not configured. Set STRIPE_SECRET_KEY.'); } } },
      billingPortal: { sessions: { create: async () => { throw new Error('Stripe is not configured. Set STRIPE_SECRET_KEY.'); } } },
      customers: {
        create: async () => {
          throw new Error('Stripe is not configured. Set STRIPE_SECRET_KEY.');
        },
      },
      subscriptions: {
        retrieve: async () => {
          throw new Error('Stripe is not configured. Set STRIPE_SECRET_KEY.');
        },
      },
      webhooks: {
        constructEvent: () => {
          throw new Error('Stripe is not configured. Set STRIPE_SECRET_KEY.');
        },
      },
    };

module.exports = stripe;
