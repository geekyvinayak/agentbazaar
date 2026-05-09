# AgentBazaar
> Shop for shoes by chatting with Claude. An open template for making any storefront agent-friendly.

![Demo](docs/demo.gif)

## Quick facts

| | |
|---|---|
| Store type | Mock (simulated orders only) |
| Currency | INR (₹) |
| Stack | Node.js 20+ + Express 4.x |
| License | MIT |
| Hosting | Render free tier |
| ✉️ Emails | Sends real confirmation emails via Gmail SMTP |

## Try it in 30 seconds

Install the plugin:

```
/plugin marketplace add geekyvinayak/agentbazaar
/plugin install agentbazaar-shop@agentbazaar
```

Then in Claude:

> *"Buy me running shoes under ₹4000."*

## 🗺️ How it works

1. Claude loads the `agentbazaar-shop` skill, which points it at the store's base URL.
2. Claude reads `GET /manifest` — the "agent-friendly homepage" that describes every action, parameter, and policy in plain JSON.
3. Claude calls `/search`, `/product`, `/cart`, and `/checkout` to guide you through a full purchase.
4. The whole flow is simulated — no payment, no shipping — but a real confirmation email is sent via Gmail SMTP.

The key concept is `/manifest`: a self-describing capabilities document that any agent can read without out-of-band documentation. See [docs/architecture.md](docs/architecture.md) for the full diagram.

## Run your own storefront

```bash
git clone https://github.com/geekyvinayak/agentbazaar
cd agentbazaar/server
npm install
node index.js
```

Deploy to Render in one click using `server/render.yaml` — just connect the repo, Render picks up the config automatically.

## Configuration

Copy `server/.env.example` to `server/.env` and fill in the values. **Never commit `.env`.**

| Variable | Required | Description |
|---|---|---|
| `PORT` | No | Server port (default: 3000) |
| `NODE_ENV` | No | `development` or `production` |
| `GMAIL_USER` | For emails | Your Gmail address (e.g. `you@gmail.com`) |
| `GMAIL_APP_PASSWORD` | For emails | A 16-character [Gmail App Password](https://myaccount.google.com/apppasswords) |

To generate a Gmail App Password:
1. Enable 2-Step Verification on your Google account.
2. Go to [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords).
3. Create an app password for "Mail" → "Other (custom name)" → call it `AgentBazaar`.
4. Copy the 16-character password into `GMAIL_APP_PASSWORD`.

If the Gmail env vars are absent the server still starts and operates normally — it just skips confirmation emails and logs a warning. The checkout response includes `email_skipped: true` in that case.

## Why this exists

2025–2026 saw OpenAI + Stripe ship ACP, Google + Shopify ship UCP, and Anthropic ship plugins. Every major commerce platform is wiring itself up for agent traffic. AgentBazaar is a tiny educational template that shows, concretely, what "agent-friendly storefront" looks like: one Express server, one Claude skill, and a `/manifest` endpoint that acts as the contract between them. Fork it, swap shoes for whatever you sell, and you have the skeleton of an agent-buyable store in an afternoon.

## License

MIT — see [LICENSE](LICENSE).
