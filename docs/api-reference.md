# API Reference

Base URL: `http://localhost:3000` (local) or your Render URL in production.

All responses are JSON. All error responses follow `{ "error": { "code": "...", "message": "..." } }`.

---

## GET /

Redirects (302) to `/manifest`.

---

## GET /manifest

Returns the agent-friendly capabilities document. Agents should read this first.

**Response:**
```json
{
  "name": "AgentBazaar",
  "tagline": "Agent-friendly shoe store",
  "description": "...",
  "currency": "INR",
  "version": "0.2.0",
  "is_demo": true,
  "actions": [...],
  "policies": {
    "shipping": "Free above ₹2000, else ₹99 (mocked)",
    "returns": "7-day returns (mocked)",
    "disclaimer": "All transactions are simulated. No real payment is taken and no shoe ships."
  },
  "links": { "source": "https://github.com/geekyvinayak/agentbazaar", "license": "MIT" }
}
```

---

## GET /search

Search the catalog.

**Query params:**

| Param | Type | Required | Description |
|---|---|---|---|
| `q` | string | ✅ | Free-text query matched against name, brand, type, description |
| `brand` | string | ❌ | Exact brand match (case-insensitive) |
| `max_price` | number | ❌ | INR ceiling (inclusive) |
| `size` | number | ❌ | US shoe size — filters to shoes with that size in stock |

Returns up to 10 results.

**Example request:**
```
GET /search?q=running&max_price=4000&size=9
```

**Response:**
```json
{
  "query": "running",
  "filters": { "max_price": 4000, "size": 9 },
  "count": 2,
  "results": [
    {
      "id": "sh_004",
      "name": "SwiftStride 2",
      "brand": "Reebok",
      "type": "running",
      "price_inr": 2799,
      "mrp_inr": 2799,
      "rating": 4.1,
      "image_url": "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=600",
      "in_stock_sizes": [6, 7, 8, 9, 10]
    }
  ]
}
```

**Error (missing q):**
```json
{ "error": { "code": "missing_param", "message": "Query param 'q' is required" } }
```

---

## GET /product/:id

Returns the full product object.

**Example request:**
```
GET /product/sh_001
```

**Response:**
```json
{
  "id": "sh_001",
  "name": "Speedster X3",
  "brand": "Nike",
  "type": "running",
  "price_inr": 4499,
  "mrp_inr": 6999,
  "rating": 4.6,
  "review_count": 834,
  "description": "Lightweight runner with responsive EVA cushioning...",
  "image_url": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600",
  "colors": ["black", "white", "volt"],
  "in_stock_sizes": [7, 8, 9, 10, 11],
  "features": ["Lightweight EVA midsole", "Breathable mesh upper", "Durable rubber outsole", "Reflective heel tab"]
}
```

**Error (not found):**
```json
{ "error": { "code": "not_found", "message": "Product 'sh_999' not found. Use GET /search to discover products." } }
```

---

## POST /cart

Create a cart with one or more items.

**Request body:**
```json
{
  "items": [
    { "product_id": "sh_001", "size": 9, "quantity": 1 }
  ]
}
```

**Validation:**
- `items` must be a non-empty array
- Each `product_id` must exist in the catalog
- `size` must be in the product's `in_stock_sizes`
- `quantity` must be an integer ≥ 1

**Response (201):**
```json
{
  "cart_id": "cart_8f3a2b1c",
  "items": [
    {
      "product_id": "sh_001",
      "name": "Speedster X3",
      "brand": "Nike",
      "size": 9,
      "quantity": 1,
      "price_inr": 4499,
      "line_total_inr": 4499
    }
  ],
  "subtotal_inr": 4499,
  "shipping_inr": 0,
  "total_inr": 4499,
  "currency": "INR"
}
```

Shipping is ₹0 when subtotal ≥ ₹2000, else ₹99.

---

## GET /cart/:id

Retrieve an existing cart.

**Response:** same shape as POST /cart response.

**Error (not found):**
```json
{ "error": { "code": "cart_not_found", "message": "Cart 'cart_abc' not found" } }
```

---

## PATCH /cart/:id

Modify a cart's contents. Totals are recomputed after every change.

**Request body:**
```json
{
  "action": "add_item | update_quantity | update_size | remove_item",
  "item": { ... }
}
```

### action: add_item
```json
{ "action": "add_item", "item": { "product_id": "sh_003", "size": 9, "quantity": 1 } }
```
Appends a new line. If the same `product_id` + `size` already exists, the quantity is merged (summed).

### action: update_quantity
```json
{ "action": "update_quantity", "item": { "product_id": "sh_001", "size": 9, "quantity": 2 } }
```
Sets the quantity on that line. Passing `quantity: 0` removes the line. Cart stays open even if all items are removed.

### action: update_size
```json
{ "action": "update_size", "item": { "product_id": "sh_001", "old_size": 9, "new_size": 10 } }
```
Changes the size of a line. `new_size` must be in the product's `in_stock_sizes`. If `new_size` already has a line, quantities are merged.

### action: remove_item
```json
{ "action": "remove_item", "item": { "product_id": "sh_001", "size": 9 } }
```
Removes that specific line entirely.

**Response:** updated cart object (same shape as POST /cart).

---

## DELETE /cart/:id

Delete an entire cart (e.g. if the user abandons the session).

**Response:**
```json
{ "deleted": true, "cart_id": "cart_8f3a2b1c" }
```

---

## POST /checkout

Place an order. Mock — no real payment. Sends a confirmation email to `shipping.email`.

**Request body:**
```json
{
  "cart_id": "cart_8f3a2b1c",
  "shipping": {
    "name": "Vinayak",
    "email": "vinayak@example.com",
    "address": "12 Vastrapur",
    "city": "Ahmedabad",
    "pincode": "380015",
    "phone": "+919876543210"
  },
  "payment_method": "upi"
}
```

`payment_method` must be one of: `cod`, `upi`, `card`.

**Response (201):**
```json
{
  "order_id": "ord_K9XZ2P",
  "status": "confirmed",
  "created_at": "2026-05-09T14:23:00.000Z",
  "estimated_delivery": "2026-05-14",
  "items": [...],
  "shipping": { "name": "Vinayak", "email": "vinayak@example.com", "address": "12 Vastrapur", "city": "Ahmedabad", "pincode": "380015", "phone": "+919876543210" },
  "payment_method": "upi",
  "total_paid_inr": 4499,
  "currency": "INR",
  "tracking_url": "http://localhost:3000/order/ord_K9XZ2P",
  "message": "Order confirmed! 🎉 Reminder: AgentBazaar is a demo — no real charge was made and no shoe will ship.",
  "email_sent": true
}
```

When `GMAIL_USER`/`GMAIL_APP_PASSWORD` env vars are absent, `email_skipped: true` appears instead of `email_sent`.

The cart is deleted after checkout. Checking out with the same `cart_id` twice returns a 404.

---

## GET /order/:id

Get order status. Status auto-progresses based on time since placement.

| Time since order | Status |
|---|---|
| 0–1 hour | `confirmed` |
| 1–24 hours | `packed` |
| 1–3 days | `shipped` |
| 3+ days | `out_for_delivery` |

**Example request:**
```
GET /order/ord_K9XZ2P
```

**Response:**
```json
{
  "order_id": "ord_K9XZ2P",
  "status": "confirmed",
  "created_at": "2026-05-09T14:23:00.000Z",
  "estimated_delivery": "2026-05-14",
  "items": [...],
  "shipping": {...},
  "payment_method": "upi",
  "total_paid_inr": 4499,
  "currency": "INR",
  "tracking_url": "http://localhost:3000/order/ord_K9XZ2P",
  "message": "Order confirmed! 🎉 ..."
}
```
