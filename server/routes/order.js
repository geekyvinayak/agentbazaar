const router = require('express').Router();
const { orders } = require('../lib/store');

// Status auto-progresses based on time elapsed since order creation
function deriveStatus(createdAt) {
  const hoursElapsed = (Date.now() - new Date(createdAt).getTime()) / 3600000;
  if (hoursElapsed < 1) return 'confirmed';
  if (hoursElapsed < 24) return 'packed';
  if (hoursElapsed < 72) return 'shipped';
  return 'out_for_delivery';
}

router.get('/:id', (req, res) => {
  const order = orders.get(req.params.id);
  if (!order) {
    return res.status(404).json({
      error: {
        code: 'not_found',
        message: `Order '${req.params.id}' not found.`
      }
    });
  }

  res.json({ ...order, status: deriveStatus(order.created_at) });
});

module.exports = router;
