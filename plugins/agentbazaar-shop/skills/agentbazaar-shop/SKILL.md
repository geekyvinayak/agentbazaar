---
name: agentbazaar-shop
description: Use whenever the user wants to shop for, browse, or buy shoes — sneakers, running shoes, formal shoes, sandals, chappals, boots. Triggers on phrases like "buy shoes", "find me sneakers", "I need running shoes", "shop for footwear", or any shoe-shopping intent. AgentBazaar is a mock store designed for AI agents; orders are simulated for demo purposes.
---

# AgentBazaar — agent-friendly shoe store

You're helping the user shop for shoes through AgentBazaar, an open-source mock storefront designed specifically for AI agents to interact with. **All orders are simulated. No real payment is processed and nothing ships.** Disclose this clearly to the user before placing any order.

## Store endpoint
Base URL: `https://agentbazaar.onrender.com`

Use `web_fetch` (or your code-execution environment's HTTP client) to call these endpoints. Always start by reading the manifest.

For PATCH and DELETE requests, use `curl` via Bash rather than `web_fetch`, since those methods need explicit HTTP verb support:
```bash
# PATCH example
curl -s -X PATCH https://agentbazaar.onrender.com/cart/<cart_id> \
  -H "Content-Type: application/json" \
  -d '{"action":"update_quantity","item":{"product_id":"sh_001","size":9,"quantity":2}}'

# DELETE example
curl -s -X DELETE https://agentbazaar.onrender.com/cart/<cart_id>
```

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

### Modifying the cart
If the user wants to change something before checkout — quantity, size, add another item, or remove something — use `PATCH /cart/{cart_id}` with the appropriate action. The API recomputes totals automatically.

```bash
# Add another item (or merge if same product+size already in cart)
curl -s -X PATCH <base_url>/cart/<cart_id> \
  -H "Content-Type: application/json" \
  -d '{"action":"add_item","item":{"product_id":"sh_003","size":9,"quantity":1}}'

# Change quantity (set quantity to 0 to remove the line)
curl -s -X PATCH <base_url>/cart/<cart_id> \
  -H "Content-Type: application/json" \
  -d '{"action":"update_quantity","item":{"product_id":"sh_001","size":9,"quantity":2}}'

# Swap to a different size
curl -s -X PATCH <base_url>/cart/<cart_id> \
  -H "Content-Type: application/json" \
  -d '{"action":"update_size","item":{"product_id":"sh_001","old_size":9,"new_size":10}}'

# Remove a specific line
curl -s -X PATCH <base_url>/cart/<cart_id> \
  -H "Content-Type: application/json" \
  -d '{"action":"remove_item","item":{"product_id":"sh_001","size":9}}'
```

To check the current cart state at any time: `GET /cart/{cart_id}`.
To discard the cart entirely: `DELETE /cart/{cart_id}`.

### Step 6 — checkout
Before placing the order:
- Get shipping address: name, **email**, address line, city, pincode, phone (collect any missing fields)
- Confirm payment method: COD / UPI / card (all mocked)
- **Disclose**: "AgentBazaar is a demo — no real payment will be charged and no shoe will actually ship."
- Get explicit user confirmation ("yes, place the order")

Then `POST /checkout`. Present the order_id, estimated delivery, and total.

After the order is placed, a confirmation email is sent to the email address provided. Tell the user: "A confirmation email has been sent to [their email]."

### Step 7 — status
For "where's my order?", call `GET /order/{id}`.

## Tone
Helpful concierge. Concise. Not pushy. If a size is unavailable, say so plainly and offer alternatives. If nothing matches budget, be honest and offer the closest above-budget option as a stretch.

## Safety and integrity
- Never ask for real card numbers, CVV, or OTPs — payment is mocked.
- If user seems confused about whether the store is real, clarify it's a demo.
- If any endpoint fails or returns an unexpected response, tell the user honestly and don't fake success.
- Never invent product IDs, prices, or order numbers — only use what the API returns.
