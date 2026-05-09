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
  version: '0.2.0',
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
      name: 'get_cart',
      method: 'GET',
      path: '/cart/{cart_id}',
      description: 'Retrieve an existing cart by its cart_id. Returns the full cart object with line items and totals. 404 if not found or already checked out.'
    },
    {
      name: 'update_cart',
      method: 'PATCH',
      path: '/cart/{cart_id}',
      description: 'Modify a cart: add, update, resize, or remove items. Totals are recomputed automatically after every change.',
      body_schema: {
        action: 'add_item | update_quantity | update_size | remove_item',
        item: {
          add_item: { product_id: 'string', size: 'number', quantity: 'number (merges with existing line if same product+size)' },
          update_quantity: { product_id: 'string', size: 'number', quantity: 'number (0 removes the line)' },
          update_size: { product_id: 'string', old_size: 'number', new_size: 'number (must be in stock)' },
          remove_item: { product_id: 'string', size: 'number' }
        }
      }
    },
    {
      name: 'delete_cart',
      method: 'DELETE',
      path: '/cart/{cart_id}',
      description: 'Delete an entire cart. Returns { deleted: true, cart_id }. Use before checkout if the user abandons the session.'
    },
    {
      name: 'checkout',
      method: 'POST',
      path: '/checkout',
      description: 'Place order. Mock — no real payment processed. Sends a confirmation email to the customer after placing the order. Returns order_id and confirmation.',
      body_schema: {
        cart_id: 'string',
        shipping: {
          name: 'string',
          email: 'string, required, customer email for order confirmation',
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
