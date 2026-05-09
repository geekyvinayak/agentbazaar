# Demo Script

Use this script when recording the AgentBazaar demo video.

---

## Opening user prompt

Paste this into Claude (with the `agentbazaar-shop` skill installed):

> *"I need running shoes under ₹4000, size 9. Help me buy a pair."*

---

## Expected Claude response style

Claude reads `/manifest`, then calls `/search?q=running&max_price=4000&size=9`.

It should present the **top 3 results** like this:

> Here are three running shoes under ₹4000 in size 9:
>
> **1. SwiftStride 2 — Reebok** ₹2,799 · ★ 4.1
> Solid beginner trainer, fits your budget with ₹1200 to spare.
>
> **2. Tempo 5.0 — Campus** ₹1,899 · ★ 3.9
> Most affordable option — no frills but dependable for daily runs.
>
> **3. PaceRun Pro — Adidas** ₹3,799 · ★ 4.4
> Best-rated of the three, Cloudfoam midsole great for long runs.
>
> Which one would you like to go with, or shall I tell you more about any of them?

Claude then asks which to pick. Once the user picks, it calls `POST /cart`, confirms total + shipping, then moves to checkout.

---

## Checkout sequence

**Claude asks for address.** Paste this fake address:

```
Name: Priya Sharma
Address: 47 Shivaji Nagar, Near Bus Stand
City: Pune
Pincode: 411005
Phone: +919988776655
```

**Claude asks for payment method.** Say: `UPI`

**Claude discloses demo nature**, then asks for confirmation. Say: `Yes, place the order`

Claude calls `POST /checkout` and presents the order confirmation with order_id and estimated delivery date.

---

## Follow-up (optional, shows order tracking)

After the order is placed, ask:

> *"Where's my order?"*

Claude calls `GET /order/{id}` and shows the current status (`confirmed` right after ordering).

---

## Closing caption for the video

> *Built in a weekend. Skill + storefront both open source.*
> `github.com/geekyvinayak/agentbazaar`
