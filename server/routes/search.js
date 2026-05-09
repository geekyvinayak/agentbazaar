const router = require('express').Router();
const { search } = require('../lib/catalog');

router.get('/', (req, res) => {
  const { q, brand, max_price, size } = req.query;

  if (!q || !q.trim()) {
    return res.status(400).json({ error: { code: 'missing_param', message: "Query param 'q' is required" } });
  }

  const maxPrice = max_price != null ? Number(max_price) : null;
  const sizeNum = size != null ? Number(size) : null;

  const results = search({ q: q.trim(), brand, max_price: maxPrice, size: sizeNum });

  res.json({
    query: q.trim(),
    filters: {
      ...(brand && { brand }),
      ...(maxPrice != null && { max_price: maxPrice }),
      ...(sizeNum != null && { size: sizeNum })
    },
    count: results.length,
    results
  });
});

module.exports = router;
