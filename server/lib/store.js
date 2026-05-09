const crypto = require('crypto');

const carts = new Map();
const orders = new Map();

function cartId() {
  return 'cart_' + crypto.randomBytes(4).toString('hex');
}

function orderId() {
  return 'ord_' + crypto.randomBytes(3).toString('hex').toUpperCase();
}

module.exports = { carts, orders, cartId, orderId };
