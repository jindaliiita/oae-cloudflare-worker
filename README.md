# Adobe Optimize at Edge — Cloudflare Worker

This Worker routes AI/LLM agent traffic (GPTBot, ChatGPT-User, ClaudeBot, etc.) to Adobe's Optimize at Edge service, while passing human and SEO bot traffic directly to your origin — unchanged.

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/adobe-rnd/oae-cloudflare-worker)

---

## What it does

```
Incoming request
  ├── LLM / AI bot?  → routed to live.edgeoptimize.net  (optimized HTML)
  └── Human / SEO?   → passed to your origin            (unchanged)
```

- Zero impact on human visitors or SEO bots
- Automatic failover to origin if Adobe edge is unreachable
- Loop protection built in

---

## Prerequisites

- Cloudflare account with Workers enabled (free tier works)
- Your domain must be on Cloudflare (proxied, not DNS-only)
- An API key from [Adobe LLM Optimizer](https://llm-optimizer.adobe.com)

---

## Deploy

Click the button above, then complete these steps:

### Step 1 — Connect accounts

- Authorize GitHub (Cloudflare will fork this repo into your account)
- Authorize your Cloudflare account

### Step 2 — Set your API key

After the Worker deploys, go to:

**Cloudflare Dashboard → Workers & Pages → `edge-optimize-router` → Settings → Variables and Secrets**

Add a new **Secret**:

| Name | Value |
|---|---|
| `ADOBE_API_KEY` | Your API key from Adobe LLM Optimizer |

### Step 3 — Set your domain

In the same Settings page, add a **Variable**:

| Name | Value |
|---|---|
| `TARGET_HOST` | Your domain without protocol, e.g. `acme.com` |

### Step 4 — Add a route

Go to **Cloudflare Dashboard → Workers & Pages → `edge-optimize-router` → Settings → Triggers → Routes** and click **Add route**.

| Field | Value |
|---|---|
| Route | `*yourdomain.com/*` |
| Zone | Select your domain from the dropdown |

> Replace `yourdomain.com` with your actual domain. The zone dropdown lists all domains in your Cloudflare account.

---

## Verify it's working

Run this curl command (replace `yourdomain.com`):

```bash
# Should route to Adobe edge — look for x-edgeoptimize-request-id in response headers
curl -I -A "GPTBot" https://yourdomain.com/

# Should go to your origin — no x-edgeoptimize headers
curl -I -A "Mozilla/5.0" https://yourdomain.com/
```

A successful AI bot request will have this response header:

```
x-edgeoptimize-routed: true
x-edgeoptimize-request-id: <some-id>
```

---

## Rollback

To disable the Worker instantly, go to:

**Cloudflare Dashboard → Workers & Pages → `edge-optimize-router` → Triggers → Routes**

Delete the route. Your origin will serve all traffic again immediately. The Worker remains deployed but inactive.

---

## Supported AI bots

The Worker currently detects:

- GPTBot
- ChatGPT-User
- ClaudeBot
- Claude-Web
- anthropic-ai
- PerplexityBot
- YouBot
- Applebot-Extended
- AdobeEdgeOptimize

To add more patterns, edit `src/worker.js` and redeploy.

---

## Configuration reference

| Variable | Type | Description |
|---|---|---|
| `ADOBE_API_KEY` | Secret | Your API key from Adobe LLM Optimizer |
| `TARGET_HOST` | Variable | Your domain without protocol (e.g. `acme.com`) |

---

## License

Apache 2.0 — see [LICENSE](LICENSE)
