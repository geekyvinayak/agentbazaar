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
4. The whole flow is simulated — no payment, no shipping.

The key concept is `/manifest`: a self-describing capabilities document that any agent can read without out-of-band documentation. See [docs/architecture.md](docs/architecture.md) for the full diagram.

## Run your own storefront

```bash
git clone https://github.com/geekyvinayak/agentbazaar
cd agentbazaar/server
npm install
node index.js
```

Deploy to Render in one click using `server/render.yaml` — just connect the repo, Render picks up the config automatically.

## Why this exists

2025–2026 saw OpenAI + Stripe ship ACP, Google + Shopify ship UCP, and Anthropic ship plugins. Every major commerce platform is wiring itself up for agent traffic. AgentBazaar is a tiny educational template that shows, concretely, what "agent-friendly storefront" looks like: one Express server, one Claude skill, and a `/manifest` endpoint that acts as the contract between them. Fork it, swap shoes for whatever you sell, and you have the skeleton of an agent-buyable store in an afternoon.

## License

MIT — see [LICENSE](LICENSE).
