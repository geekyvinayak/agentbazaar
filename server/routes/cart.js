const router = require('express').Router();
const { findById } = require('../lib/catalog');
const { carts, cartId } = require('../lib/store');

router.post('/', (req, res) => {
  const { items } = req.body || {};

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: { code: 'invalid_body', message: "'items' must be a non-empty array" } });
  }

  const lineItems = [];
  for (const item of items) {
    const { product_id, size, quantity } = item;

    if (!product_id || size == null || quantity == null) {
      return res.status(400).json({ error: { code: 'invalid_item', message: "Each item needs product_id, size, and quantity" } });
    }
    if (!Number.isInteger(quantity) || quantity < 1) {
      return res.status(400).json({ error: { code: 'invalid_quantity', message: "quantity must be an integer >= 1" } });
    }

    const shoe = findById(product_id);
    if (!shoe) {
      return res.status(404).json({ error: { code: 'product_not_found', message: `Product '${product_id}' not found` } });
    }

    const sizeNum = Number(size);
    if (!shoe.in_stock_sizes.includes(sizeNum)) {
      return res.status(400).json({
        error: {
          code: 'size_unavailable',
          message: `Size ${sizeNum} is not available for '${shoe.name}'. Available: ${shoe.in_stock_sizes.join(', ')}`
        }
      });
    }

    lineItems.push({
      product_id: shoe.id,
      name: shoe.name,
      brand: shoe.brand,
      size: sizeNum,
      quantity,
      price_inr: shoe.price_inr,
      line_total_inr: shoe.price_inr * quantity
    });
  }

  const subtotal = lineItems.reduce((s, i) => s + i.line_total_inr, 0);
  const shipping = subtotal >= 2000 ? 0 : 99;
  const total = subtotal + shipping;
  const id = cartId();

  const cart = {
    cart_id: id,
    items: lineItems,
    subtotal_inr: subtotal,
    shipping_inr: shipping,
    total_inr: total,
    currency: 'INR'
  };

  carts.set(id, cart);
  res.status(201).json(cart);
});

module.exports = router;
