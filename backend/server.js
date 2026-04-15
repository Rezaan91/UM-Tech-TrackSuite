const express = require('express');
const cors = require('cors');
const assetsRouter = require('./routes/assets');
const adminRouter = require('./routes/admin');
const { billingRouter, handleStripeWebhook } = require('./routes/billing');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());

// Stripe requires the exact raw body for signature verification.
app.post('/api/billing/webhook', express.raw({ type: 'application/json' }), handleStripeWebhook);
app.use(express.json());

// Routes
app.use('/api/assets', assetsRouter);
app.use('/api/billing', billingRouter);
app.use('/api/admin', adminRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Root route
app.get('/', (req, res) => {
  res.send('UM-Tech-TrackSuite API is running');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
