const router = require('express').Router();
const { findById } = require('../lib/catalog');
const { carts, cartId } = require('../lib/store');

function recompute(cart) {
  for (const item of cart.items) {
    item.line_total_inr = item.price_inr * item.quantity;
  }
  const subtotal = cart.items.reduce((s, i) => s + i.line_total_inr, 0);
  cart.subtotal_inr = subtotal;
  cart.shipping_inr = subtotal >= 2000 ? 0 : 99;
  cart.total_inr = subtotal + cart.shipping_inr;
}

// POST /cart — create a new cart
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
  const id = cartId();

  const cart = {
    cart_id: id,
    items: lineItems,
    subtotal_inr: subtotal,
    shipping_inr: shipping,
    total_inr: subtotal + shipping,
    currency: 'INR'
  };

  carts.set(id, cart);
  res.status(201).json(cart);
});

// GET /cart/:id — retrieve a cart
router.get('/:id', (req, res) => {
  const cart = carts.get(req.params.id);
  if (!cart) {
    return res.status(404).json({ error: { code: 'cart_not_found', message: `Cart '${req.params.id}' not found` } });
  }
  res.json(cart);
});

// PATCH /cart/:id — modify a cart (add_item, update_quantity, update_size, remove_item)
router.patch('/:id', (req, res) => {
  const cart = carts.get(req.params.id);
  if (!cart) {
    return res.status(404).json({ error: { code: 'cart_not_found', message: `Cart '${req.params.id}' not found` } });
  }

  const { action, item } = req.body || {};
  const VALID_ACTIONS = ['add_item', 'update_quantity', 'update_size', 'remove_item'];
  if (!action || !VALID_ACTIONS.includes(action)) {
    return res.status(400).json({
      error: { code: 'invalid_action', message: `'action' must be one of: ${VALID_ACTIONS.join(', ')}` }
    });
  }
  if (!item || typeof item !== 'object') {
    return res.status(400).json({ error: { code: 'missing_item', message: "'item' object is required" } });
  }

  if (action === 'add_item') {
    const { product_id, size, quantity } = item;
    if (!product_id || size == null || quantity == null) {
      return res.status(400).json({ error: { code: 'invalid_item', message: "add_item requires product_id, size, quantity" } });
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
        error: { code: 'size_unavailable', message: `Size ${sizeNum} not available for '${shoe.name}'. Available: ${shoe.in_stock_sizes.join(', ')}` }
      });
    }
    const existing = cart.items.find(i => i.product_id === shoe.id && i.size === sizeNum);
    if (existing) {
      existing.quantity += quantity;
    } else {
      cart.items.push({ product_id: shoe.id, name: shoe.name, brand: shoe.brand, size: sizeNum, quantity, price_inr: shoe.price_inr, line_total_inr: shoe.price_inr * quantity });
    }
  }

  else if (action === 'update_quantity') {
    const { product_id, size, quantity } = item;
    if (!product_id || size == null || quantity == null) {
      return res.status(400).json({ error: { code: 'invalid_item', message: "update_quantity requires product_id, size, quantity" } });
    }
    if (!Number.isInteger(quantity) || quantity < 0) {
      return res.status(400).json({ error: { code: 'invalid_quantity', message: "quantity must be an integer >= 0 (0 removes the item)" } });
    }
    const sizeNum = Number(size);
    const idx = cart.items.findIndex(i => i.product_id === product_id && i.size === sizeNum);
    if (idx === -1) {
      return res.status(404).json({ error: { code: 'item_not_found', message: `No line found for product '${product_id}' size ${sizeNum}` } });
    }
    if (quantity === 0) {
      cart.items.splice(idx, 1);
    } else {
      cart.items[idx].quantity = quantity;
    }
  }

  else if (action === 'update_size') {
    const { product_id, old_size, new_size } = item;
    if (!product_id || old_size == null || new_size == null) {
      return res.status(400).json({ error: { code: 'invalid_item', message: "update_size requires product_id, old_size, new_size" } });
    }
    const oldSizeNum = Number(old_size);
    const newSizeNum = Number(new_size);
    const line = cart.items.find(i => i.product_id === product_id && i.size === oldSizeNum);
    if (!line) {
      return res.status(404).json({ error: { code: 'item_not_found', message: `No line found for product '${product_id}' size ${oldSizeNum}` } });
    }
    const shoe = findById(product_id);
    if (!shoe.in_stock_sizes.includes(newSizeNum)) {
      return res.status(400).json({
        error: { code: 'size_unavailable', message: `Size ${newSizeNum} not available for '${shoe.name}'. Available: ${shoe.in_stock_sizes.join(', ')}` }
      });
    }
    // merge with any existing line at new_size rather than creating a duplicate
    const collision = cart.items.find(i => i.product_id === product_id && i.size === newSizeNum);
    if (collision) {
      collision.quantity += line.quantity;
      cart.items = cart.items.filter(i => !(i.product_id === product_id && i.size === oldSizeNum));
    } else {
      line.size = newSizeNum;
    }
  }

  else if (action === 'remove_item') {
    const { product_id, size } = item;
    if (!product_id || size == null) {
      return res.status(400).json({ error: { code: 'invalid_item', message: "remove_item requires product_id and size" } });
    }
    const sizeNum = Number(size);
    const before = cart.items.length;
    cart.items = cart.items.filter(i => !(i.product_id === product_id && i.size === sizeNum));
    if (cart.items.length === before) {
      return res.status(404).json({ error: { code: 'item_not_found', message: `No line found for product '${product_id}' size ${sizeNum}` } });
    }
  }

  recompute(cart);
  // An empty cart stays in the map — caller can still add items or delete it explicitly
  if (cart.items.length === 0) {
    cart.subtotal_inr = 0;
    cart.shipping_inr = 0;
    cart.total_inr = 0;
  }
  res.json(cart);
});

// DELETE /cart/:id — delete the whole cart
router.delete('/:id', (req, res) => {
  if (!carts.has(req.params.id)) {
    return res.status(404).json({ error: { code: 'cart_not_found', message: `Cart '${req.params.id}' not found` } });
  }
  carts.delete(req.params.id);
  res.json({ deleted: true, cart_id: req.params.id });
});

module.exports = router;
