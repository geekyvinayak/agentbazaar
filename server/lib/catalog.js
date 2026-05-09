const path = require('path');
const catalog = require(path.join(__dirname, '..', 'catalog.json'));

const byId = new Map(catalog.map(shoe => [shoe.id, shoe]));

function findById(id) {
  return byId.get(id) || null;
}

function search({ q, brand, max_price, size }) {
  const needle = q.toLowerCase();
  return catalog
    .filter(shoe => {
      const haystack = [shoe.name, shoe.brand, shoe.type, shoe.description].join(' ').toLowerCase();
      if (!haystack.includes(needle)) return false;
      if (brand && shoe.brand.toLowerCase() !== brand.toLowerCase()) return false;
      if (max_price != null && shoe.price_inr > max_price) return false;
      if (size != null && !shoe.in_stock_sizes.includes(Number(size))) return false;
      return true;
    })
    .slice(0, 10)
    .map(shoe => ({
      id: shoe.id,
      name: shoe.name,
      brand: shoe.brand,
      type: shoe.type,
      price_inr: shoe.price_inr,
      mrp_inr: shoe.mrp_inr,
      rating: shoe.rating,
      image_url: shoe.image_url,
      in_stock_sizes: shoe.in_stock_sizes
    }));
}

module.exports = { findById, search };
