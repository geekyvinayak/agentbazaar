// manifest.js — the "homepage" for agents. Every agent that interacts with
// AgentBazaar should read this first. It describes all available actions,
// params, policies, and the demo disclaimer in machine-readable JSON so agents
// don't need out-of-band documentation.
const router = require('express').Router();

const MANIFEST = {
  name: 'AgentBazaar',
  tagline: 'Agent-friendly shoe store',
  description: 'An open-source mock storefront designed for AI agents. All purchases are simulated — no real payment is processed and nothing ships.',
  currency: 'INR',
  version: '0.1.0',
  is_demo: true,
  actions: [
    {
      name: 'search',
      method: 'GET',
      path: '/search',
      description: 'Search shoes by keyword and optional filters. Returns up to 10 results.',
      params: {
        q: 'string, required, free-text query like \'running shoes\' or \'formal black\'',
        brand: 'string, optional, e.g. Nike, Adidas, Puma, Bata, Liberty, Reebok, Sparx, Woodland',
        max_price: 'number, optional, INR ceiling',
        size: 'number, optional, US size 6-13'
      },
      example: '/search?q=running&max_price=5000&size=9'
    },
    {
      name: 'get_product',
      method: 'GET',
      path: '/product/{id}',
      description: 'Full details for one product, including all sizes, colors, features.'
    },
    {
      name: 'create_cart',
      method: 'POST',
      path: '/cart',
      description: 'Create a new cart with one or more items. Returns cart_id, line items, totals.',
      body_schema: {
        items: [{ product_id: 'string', size: 'number', quantity: 'number' }]
      }
    },
    {
      name: 'checkout',
      method: 'POST',
      path: '/checkout',
      description: 'Place order. Mock — no real payment processed. Returns order_id and confirmation.',
      body_schema: {
        cart_id: 'string',
        shipping: {
          name: 'string',
          address: 'string',
          city: 'string',
          pincode: 'string',
          phone: 'string'
        },
        payment_method: 'cod | upi | card (all simulated)'
      }
    },
    {
      name: 'get_order',
      method: 'GET',
      path: '/order/{id}',
      description: 'Check status of a placed order. Status auto-progresses based on time since order.'
    }
  ],
  policies: {
    shipping: 'Free above ₹2000, else ₹99 (mocked)',
    returns: '7-day returns (mocked)',
    disclaimer: 'All transactions are simulated. No real payment is taken and no shoe ships.'
  },
  links: {
    source: 'https://github.com/geekyvinayak/agentbazaar',
    license: 'MIT'
  }
};

router.get('/', (_req, res) => res.json(MANIFEST));

module.exports = router;
