const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const assetsRouter = require('./routes/assets');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Routes
app.use('/api/assets', assetsRouter);

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
