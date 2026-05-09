// index.js — AgentBazaar Express server
//
// Agent-friendly design: every endpoint returns JSON. The root redirects to
// /manifest, which is the self-describing capabilities document agents should
// read first. No HTML, no sessions, no auth — this is a public agent endpoint.

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(morgan('tiny'));
app.use(express.json());

// Root → redirect to manifest so visiting bare URL is useful for an agent
app.get('/', (_req, res) => res.redirect(302, '/manifest'));

app.use('/manifest', require('./routes/manifest'));
app.use('/search', require('./routes/search'));
app.use('/product', require('./routes/product'));
app.use('/cart', require('./routes/cart'));
app.use('/checkout', require('./routes/checkout'));
app.use('/order', require('./routes/order'));

// 404 handler — point agents at /manifest
app.use((_req, res) => {
  res.status(404).json({
    error: {
      code: 'not_found',
      message: 'Unknown route. Read GET /manifest to discover available actions.'
    }
  });
});

// Global error handler
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: { code: 'internal_error', message: 'An unexpected error occurred.' } });
});

app.listen(PORT, () => {
  console.log(`AgentBazaar running on http://localhost:${PORT}`);
  console.log(`Agent entry point: http://localhost:${PORT}/manifest`);
});
