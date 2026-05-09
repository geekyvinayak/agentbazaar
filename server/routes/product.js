const router = require('express').Router();
const { findById } = require('../lib/catalog');

router.get('/:id', (req, res) => {
  const shoe = findById(req.params.id);
  if (!shoe) {
    return res.status(404).json({
      error: {
        code: 'not_found',
        message: `Product '${req.params.id}' not found. Use GET /search to discover products.`
      }
    });
  }
  res.json(shoe);
});

module.exports = router;
