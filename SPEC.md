# AgentBazaar — Project Specification

> Build target for Claude Code. Read this entire file, then generate every file described, in the exact paths described. Don't ask for clarification on minor decisions — make sensible choices and add a code comment when you do.

## What this is

A weekend demo of **agentic commerce**: a Claude skill that lets a user shop for shoes through chat, backed by an "agent-friendly" Node + Express storefront. Pure mock — no real payments, no real shipping. The point is to be a forkable open template anyone can use to make their own store agent-buyable.

## Quick facts

- **Name:** AgentBazaar
- **GitHub repo:** `github.com/geekyvinayak/agentbazaar`
- **Author:** Vinayak (geekyvinayak)
- **License:** MIT
- **Stack:** Node.js 20+, Express 4.x, no database (in-memory + JSON file)
- **Hosting:** Render free tier
- **Currency:** INR (₹)
- **Category:** Shoes only
- **Skill ID:** `agentbazaar-shop`
- **Marketplace name:** `agentbazaar`

## Folder structure (generate exactly this)

```
agentbazaar/
├── README.md
├── LICENSE
├── .gitignore
├── .claude-plugin/
│   └── marketplace.json
├── plugins/
│   └── agentbazaar-shop/
│       ├── .claude-plugin/
│       │   └── plugin.json
│       └── skills/
│           └── agentbazaar-shop/
│               └── SKILL.md
├── server/
│   ├── package.json
│   ├── index.js
│   ├── catalog.json
│   ├── routes/
│   │   ├── manifest.js
│   │   ├── search.js
│   │   ├── product.js
│   │   ├── cart.js
│   │   ├── checkout.js
│   │   └── order.js
│   ├── lib/
│   │   ├── catalog.js
│   │   └── store.js
│   ├── render.yaml
│   └── .env.example
└── docs/
    ├── architecture.md
    ├── api-reference.md
    └── demo-script.md
```

---

# Backend specification

## Tech setup

- Node.js 20+, Express 4.x
- Dependencies: `express`, `cors`, `morgan` — that's it. No DB, no auth, no TS.
- CORS enabled for all origins (it's a public agent endpoint)
- `morgan('tiny')` for request logging
- `express.json()` middleware
- Reads `catalog.json` once at startup into memory
- Carts and orders stored in JS `Map`s (reset on restart — fine for demo)
- Listens on `process.env.PORT || 3000`
- All IDs generated with `crypto.randomBytes(4).toString('hex')` (cart_id like `cart_8f3a2b1c`, order_id like `ord_K9XZ2P` uppercase)
- Global error handler returns `{ error: { code, message } }` with proper HTTP codes
- 404 handler for unknown routes returns helpful JSON pointing to `/manifest`

## Endpoints

### `GET /`
Redirect (302) to `/manifest`. Visiting the bare URL should be useful for an agent.

### `GET /manifest`
Returns the agent-friendly capabilities document. **This is the most important endpoint** — it's the "homepage" agents read first.

```json
{
  "name": "AgentBazaar",
  "tagline": "Agent-friendly shoe store",
  "description": "An open-source mock storefront designed for AI agents. All purchases are simulated — no real payment is processed and nothing ships.",
  "currency": "INR",
  "version": "0.1.0",
  "is_demo": true,
  "actions": [
    {
      "name": "search",
      "method": "GET",
      "path": "/search",
      "description": "Search shoes by keyword and optional filters. Returns up to 10 results.",
      "params": {
        "q": "string, required, free-text query like 'running shoes' or 'formal black'",
        "brand": "string, optional, e.g. Nike, Adidas, Puma, Bata, Liberty, Reebok, Sparx, Woodland",
        "max_price": "number, optional, INR ceiling",
        "size": "number, optional, US size 6-13"
      },
      "example": "/search?q=running&max_price=5000&size=9"
    },
    {
      "name": "get_product",
      "method": "GET",
      "path": "/product/{id}",
      "description": "Full details for one product, including all sizes, colors, features."
    },
    {
      "name": "create_cart",
      "method": "POST",
      "path": "/cart",
      "description": "Create a new cart with one or more items. Returns cart_id, line items, totals.",
      "body_schema": {
        "items": [
          { "product_id": "string", "size": "number", "quantity": "number" }
        ]
      }
    },
    {
      "name": "checkout",
      "method": "POST",
      "path": "/checkout",
      "description": "Place order. Mock — no real payment processed. Returns order_id and confirmation.",
      "body_schema": {
        "cart_id": "string",
        "shipping": {
          "name": "string",
          "address": "string",
          "city": "string",
          "pincode": "string",
          "phone": "string"
        },
        "payment_method": "cod | upi | card (all simulated)"
      }
    },
    {
      "name": "get_order",
      "method": "GET",
      "path": "/order/{id}",
      "description": "Check status of a placed order. Status auto-progresses based on time since order."
    }
  ],
  "policies": {
    "shipping": "Free above ₹2000, else ₹99 (mocked)",
    "returns": "7-day returns (mocked)",
    "disclaimer": "All transactions are simulated. No real payment is taken and no shoe ships."
  },
  "links": {
    "source": "https://github.com/geekyvinayak/agentbazaar",
    "license": "MIT"
  }
}
```

### `GET /search`
Query params: `q` (required), `brand`, `max_price`, `size`.
- Match `q` (case-insensitive) against `name + brand + type + description` joined.
- `brand` exact match (case-insensitive)
- `max_price` filters `price_inr <= max_price`
- `size` filters shoes whose `in_stock_sizes` includes that number
- Return up to 10 results
- Missing `q` → 400 with `{ error: { code: "missing_param", message: "Query param 'q' is required" } }`
- Response shape:
```json
{
  "query": "running",
  "filters": { "max_price": 5000, "size": 9 },
  "count": 3,
  "results": [
    {
      "id": "sh_001",
      "name": "Speedster X3",
      "brand": "Nike",
      "type": "running",
      "price_inr": 4499,
      "mrp_inr": 6999,
      "rating": 4.6,
      "image_url": "...",
      "in_stock_sizes": [7, 8, 9, 10, 11]
    }
  ]
}
```

### `GET /product/:id`
Returns full product object (everything from catalog.json for that id). 404 with helpful message if not found.

### `POST /cart`
Body: `{ items: [{ product_id, size, quantity }] }`
- Validate: `items` is non-empty array; each product exists; size is in `in_stock_sizes`; quantity >= 1
- Generate `cart_id = "cart_" + crypto.randomBytes(4).toString('hex')`
- Compute `subtotal = sum(price_inr * quantity)`, `shipping = subtotal >= 2000 ? 0 : 99`, `total = subtotal + shipping`
- Store full cart object in `carts` Map
- Return:
```json
{
  "cart_id": "cart_8f3a2b1c",
  "items": [
    { "product_id": "sh_001", "name": "Speedster X3", "brand": "Nike", "size": 9, "quantity": 1, "price_inr": 4499, "line_total_inr": 4499 }
  ],
  "subtotal_inr": 4499,
  "shipping_inr": 0,
  "total_inr": 4499,
  "currency": "INR"
}
```

### `POST /checkout`
Body: `{ cart_id, shipping, payment_method }`
- Validate cart exists; shipping has all 5 fields; payment_method ∈ ["cod", "upi", "card"]
- Generate `order_id = "ord_" + crypto.randomBytes(3).toString('hex').toUpperCase()`
- Set `status = "confirmed"`, `created_at = new Date().toISOString()`, `estimated_delivery` = 5 days from now (YYYY-MM-DD)
- Store order in `orders` Map (include cart contents so cart deletion is safe)
- Delete cart from `carts` Map
- Return:
```json
{
  "order_id": "ord_K9XZ2P",
  "status": "confirmed",
  "created_at": "2026-05-09T14:23:00.000Z",
  "estimated_delivery": "2026-05-14",
  "items": [...],
  "shipping": {...},
  "payment_method": "cod",
  "total_paid_inr": 4499,
  "currency": "INR",
  "tracking_url": "https://<host>/order/ord_K9XZ2P",
  "message": "Order confirmed! 🎉 Reminder: AgentBazaar is a demo — no real charge was made and no shoe will ship."
}
```

### `GET /order/:id`
Returns the order with status that auto-progresses by time elapsed since `created_at`:
- 0–1 hour: "confirmed"
- 1–24 hours: "packed"
- 1–3 days: "shipped"
- 3+ days: "out_for_delivery"

404 if not found.

---

# Catalog requirements (`server/catalog.json`)

Generate exactly **25 shoes**.

**Type distribution:**
- 8 running
- 6 casual
- 4 formal
- 3 sandals (one labeled "chappal" for Indian flavor)
- 2 sports/basketball
- 2 boots

**Brand mix:** Nike, Adidas, Puma, Bata, Liberty, Reebok, Sparx, Woodland, Skechers, Campus.

**Price distribution (INR):**
- 8 shoes under ₹3000
- 12 shoes ₹3000–7000
- 5 shoes above ₹7000 (max ₹12,999)

**Each shoe has:**

```json
{
  "id": "sh_001",
  "name": "Speedster X3",
  "brand": "Nike",
  "type": "running",
  "price_inr": 4499,
  "mrp_inr": 6999,
  "rating": 4.6,
  "review_count": 234,
  "description": "Lightweight runners with responsive cushioning and breathable mesh. Designed for daily runs up to 10K.",
  "image_url": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600",
  "colors": ["black", "white"],
  "in_stock_sizes": [7, 8, 9, 10, 11],
  "features": [
    "Lightweight EVA midsole",
    "Breathable mesh upper",
    "Rubber outsole",
    "Reflective accents"
  ]
}
```

Rules:
- IDs sequential `sh_001` through `sh_025`
- Names creative but realistic
- ~30% of shoes have a discount (mrp_inr > price_inr); rest have mrp_inr === price_inr
- Ratings between 3.8 and 4.9
- review_count between 12 and 1500
- 4–7 sizes in stock per shoe
- 1–3 colors
- 3–5 features
- Description: 1–2 sentences, specific to the shoe type
- For images: use clean Unsplash photo URLs of shoes — variety welcome. Format `https://images.unsplash.com/photo-<id>?w=600`. If unsure, use these known-working ones and rotate:
  - `1542291026-7eec264c27ff`, `1606107557195-0e29a4b5b4aa`, `1595950653106-6c9ebd614d3a`, `1600185365483-26d7a4cc7519`, `1551107696-a4b0c5a0d9a2`, `1608231387042-66d1773070a5`

---

# Skill specification

## marketplace.json (at `.claude-plugin/marketplace.json`)

```json
{
  "name": "agentbazaar",
  "owner": {
    "name": "Vinayak",
    "url": "https://github.com/geekyvinayak"
  },
  "metadata": {
    "description": "AgentBazaar — agent-friendly shoe store + Claude skill. Open template for agentic commerce.",
    "version": "0.1.0"
  },
  "plugins": [
    {
      "name": "agentbazaar-shop",
      "source": "./plugins/agentbazaar-shop",
      "description": "Shop for shoes via Claude. Connects to AgentBazaar's agent-friendly storefront API.",
      "category": "shopping",
      "tags": ["commerce", "shopping", "agentic-commerce", "shoes", "demo"]
    }
  ]
}
```

## plugin.json (at `plugins/agentbazaar-shop/.claude-plugin/plugin.json`)

```json
{
  "name": "agentbazaar-shop",
  "version": "0.1.0",
  "description": "Browse and 'buy' shoes via Claude. Connects to AgentBazaar — an open-source agent-friendly mock storefront.",
  "author": {
    "name": "Vinayak",
    "url": "https://github.com/geekyvinayak"
  }
}
```

## SKILL.md (at `plugins/agentbazaar-shop/skills/agentbazaar-shop/SKILL.md`)

Generate this file with this exact frontmatter and body. Note: the base URL has a `<RENDER_URL>` placeholder — leave it as-is for now; the user updates it after deploying.

```markdown
---
name: agentbazaar-shop
description: Use whenever the user wants to shop for, browse, or buy shoes — sneakers, running shoes, formal shoes, sandals, chappals, boots. Triggers on phrases like "buy shoes", "find me sneakers", "I need running shoes", "shop for footwear", or any shoe-shopping intent. AgentBazaar is a mock store designed for AI agents; orders are simulated for demo purposes.
---

# AgentBazaar — agent-friendly shoe store

You're helping the user shop for shoes through AgentBazaar, an open-source mock storefront designed specifically for AI agents to interact with. **All orders are simulated. No real payment is processed and nothing ships.** Disclose this clearly to the user before placing any order.

## Store endpoint
Base URL: `<RENDER_URL>`

Use `web_fetch` (or your code-execution environment's HTTP client) to call these endpoints. Always start by reading the manifest.

## Workflow

### Step 1 — discover
Fetch `GET /manifest`. It tells you what actions exist, their parameters, currency (INR), policies, and the demo disclaimer. Trust the manifest — don't hardcode endpoint shapes.

### Step 2 — understand the user
If their ask is specific ("running shoes under ₹5000 size 9"), skip questions and search. Otherwise ask briefly — one short question at a time:
- What kind? (running / casual / formal / sports / sandals / boots)
- Budget in INR?
- Preferred brand?
- Shoe size (US 6–13)?

Don't interrogate. Two questions max before searching.

### Step 3 — search
Call `GET /search` with the relevant params. Show the **top 3** results, not all 10. For each, present:
- Name + brand
- Price (₹X), with MRP and "Save ₹Y" if discounted
- Rating with one ★
- One personalized line on why it might fit them

### Step 4 — drill down on request
If the user asks for more about a specific shoe, call `GET /product/{id}` and surface the features that match what they said they wanted.

### Step 5 — cart
When the user picks one, call `POST /cart` with product_id, size, quantity. Confirm the total back, including shipping (free above ₹2000).

### Step 6 — checkout
Before placing the order:
- Get shipping address: name, address line, city, pincode, phone (collect any missing fields)
- Confirm payment method: COD / UPI / card (all mocked)
- **Disclose**: "AgentBazaar is a demo — no real payment will be charged and no shoe will actually ship."
- Get explicit user confirmation ("yes, place the order")

Then `POST /checkout`. Present the order_id, estimated delivery, and total.

### Step 7 — status
For "where's my order?", call `GET /order/{id}`.

## Tone
Helpful concierge. Concise. Not pushy. If a size is unavailable, say so plainly and offer alternatives. If nothing matches budget, be honest and offer the closest above-budget option as a stretch.

## Safety and integrity
- Never ask for real card numbers, CVV, or OTPs — payment is mocked.
- If user seems confused about whether the store is real, clarify it's a demo.
- If any endpoint fails or returns an unexpected response, tell the user honestly and don't fake success.
- Never invent product IDs, prices, or order numbers — only use what the API returns.
```

---

# Render deployment

## render.yaml (in `server/`)

```yaml
services:
  - type: web
    name: agentbazaar
    runtime: node
    plan: free
    buildCommand: npm install
    startCommand: node index.js
    envVars:
      - key: NODE_ENV
        value: production
```

## .env.example (in `server/`)

```
PORT=3000
NODE_ENV=development
```

---

# Other files

## .gitignore (root)

```
node_modules/
.env
.DS_Store
*.log
.idea/
.vscode/
```

## LICENSE (root)

Standard MIT license, copyright 2026 Vinayak.

## server/package.json

```json
{
  "name": "agentbazaar-server",
  "version": "0.1.0",
  "description": "AgentBazaar storefront — agent-friendly shoe store API",
  "main": "index.js",
  "scripts": {
    "start": "node index.js",
    "dev": "node --watch index.js"
  },
  "dependencies": {
    "express": "^4.19.2",
    "cors": "^2.8.5",
    "morgan": "^1.10.0"
  },
  "engines": {
    "node": ">=20"
  },
  "license": "MIT",
  "author": "Vinayak <https://github.com/geekyvinayak>"
}
```

---

# README.md (root) — required content

Write a polished README with these sections:

1. **Title + tagline**
   ```
   # AgentBazaar
   > Shop for shoes by chatting with Claude. An open template for making any storefront agent-friendly.
   ```
2. **Demo GIF placeholder**: `![Demo](docs/demo.gif)` — user adds GIF after recording.
3. **Quick facts** (a small table): mock store, INR, Node + Express, MIT, deployed on Render.
4. **Try it in 30 seconds** — three commands:
   ```
   /plugin marketplace add geekyvinayak/agentbazaar
   /plugin install agentbazaar-shop@agentbazaar
   ```
   Then in Claude: *"Buy me running shoes under ₹4000."*
5. **How it works** — 4-line summary of the flow with a link to `docs/architecture.md`. Mention the `/manifest` "agent-friendly homepage" as the key concept.
6. **Run your own storefront** — clone, `cd server && npm install && node index.js`, deploy to Render with one click.
7. **Why this exists** — short paragraph: 2025–2026 saw OpenAI + Stripe ship ACP, Google + Shopify ship UCP, and Anthropic ship plugins. AgentBazaar is a tiny educational template showing how one store + one skill can make Claude shop. Fork it, swap shoes for whatever you sell.
8. **License**: MIT.

Keep tone matter-of-fact, not hype. Include 1-2 emoji max in headings, none in body.

## docs/architecture.md

A short doc with an ASCII or mermaid diagram of: User → Claude (with skill) → Express API → catalog.json. Explain the role of `/manifest` as the discovery endpoint that makes the whole thing extensible.

## docs/api-reference.md

Auto-generated reference of all 6 endpoints with example req/resp. (CC: just dump the contracts from this spec into pretty markdown.)

## docs/demo-script.md

The exact script the user will follow when recording the demo. Include:
- The opening user prompt: *"I need running shoes under ₹4000, size 9. Help me buy a pair."*
- Expected Claude response style (ranked list of 3, then ask to pick)
- The address to paste (use a fake one)
- The closing caption for the video: *"Built in a weekend. Skill + storefront both open source."*

---

# Implementation notes for Claude Code

- Use clean idiomatic Node/Express. No TypeScript, no build step, no fancy framework.
- Validation: write small inline validators or a tiny `validate()` helper. Don't add Joi/Zod.
- Error responses always JSON, always `{ error: { code, message } }`.
- Logging middleware: `morgan('tiny')` — that's enough.
- Add a top-of-file comment in `index.js` and `routes/manifest.js` explaining the agent-friendly design.
- The catalog.json must be valid JSON (no trailing commas, no comments).
- After generating everything, run `cd server && npm install` and verify the server boots without errors. Then `curl localhost:3000/manifest` and verify it returns valid JSON.
- Don't initialize git yet — the user will do `git init` and push after reviewing.

# Testing checklist

After scaffolding, run these and confirm they pass:

```
cd server && npm install && node index.js &

curl localhost:3000/manifest | head -c 500
curl "localhost:3000/search?q=running" | head -c 500
curl "localhost:3000/search?q=running&max_price=4000&size=9" | head -c 500
curl localhost:3000/product/sh_001 | head -c 500
curl -X POST localhost:3000/cart -H "Content-Type: application/json" -d '{"items":[{"product_id":"sh_001","size":9,"quantity":1}]}'
# Take the cart_id from the response and use it below:
curl -X POST localhost:3000/checkout -H "Content-Type: application/json" -d '{"cart_id":"<CART_ID>","shipping":{"name":"Vinayak","address":"12 Vastrapur","city":"Ahmedabad","pincode":"380015","phone":"+919876543210"},"payment_method":"upi"}'
# Take the order_id and check:
curl localhost:3000/order/<ORDER_ID>
```

If every call returns valid JSON with the shapes documented above, you're done. Report any failures.