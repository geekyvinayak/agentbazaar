const router = require('express').Router();
const { carts, orders, orderId } = require('../lib/store');

const REQUIRED_SHIPPING_FIELDS = ['name', 'address', 'city', 'pincode', 'phone'];
const VALID_PAYMENT_METHODS = ['cod', 'upi', 'card'];

router.post('/', (req, res) => {
  const { cart_id, shipping, payment_method } = req.body || {};

  if (!cart_id) {
    return res.status(400).json({ error: { code: 'missing_param', message: "'cart_id' is required" } });
  }

  const cart = carts.get(cart_id);
  if (!cart) {
    return res.status(404).json({ error: { code: 'cart_not_found', message: `Cart '${cart_id}' not found or already checked out` } });
  }

  if (!shipping || typeof shipping !== 'object') {
    return res.status(400).json({ error: { code: 'missing_shipping', message: "'shipping' object is required" } });
  }
  for (const field of REQUIRED_SHIPPING_FIELDS) {
    if (!shipping[field] || !String(shipping[field]).trim()) {
      return res.status(400).json({ error: { code: 'missing_shipping_field', message: `shipping.${field} is required` } });
    }
  }

  if (!payment_method || !VALID_PAYMENT_METHODS.includes(payment_method)) {
    return res.status(400).json({
      error: { code: 'invalid_payment_method', message: `payment_method must be one of: ${VALID_PAYMENT_METHODS.join(', ')}` }
    });
  }

  const id = orderId();
  const createdAt = new Date();

  // Estimated delivery: 5 calendar days from order
  const delivery = new Date(createdAt);
  delivery.setDate(delivery.getDate() + 5);
  const estimatedDelivery = delivery.toISOString().split('T')[0];

  const host = req.get('host') || 'localhost:3000';
  const protocol = req.protocol || 'http';

  const order = {
    order_id: id,
    status: 'confirmed',
    created_at: createdAt.toISOString(),
    estimated_delivery: estimatedDelivery,
    items: cart.items,
    shipping,
    payment_method,
    total_paid_inr: cart.total_inr,
    currency: 'INR',
    tracking_url: `${protocol}://${host}/order/${id}`,
    message: "Order confirmed! 🎉 Reminder: AgentBazaar is a demo — no real charge was made and no shoe will ship."
  };

  orders.set(id, order);
  carts.delete(cart_id);

  res.status(201).json(order);
});

module.exports = router;
