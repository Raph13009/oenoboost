# Stripe ops — Issue #37

**Keep both modes** — it is not complex: same code, different env vars.

| | Local (dev) | Production (Vercel) |
|---|---|---|
| Account | Sandbox **oenoboost-dev** (`acct_1UfIg3DrrxcdxcE8`) | Live **oenoboost.fr** (`acct_1SNauoDbuF0k3RfW`) |
| Secret | `sk_test_…` | `sk_live_…` |
| Price | `price_1UfIwQDrrxcdxcE8zzubKet6` (€9.99) | `price_1TQThWDbuF0k3RfWsMoZ6Gby` (€9.99) |
| Webhook | `stripe listen` → `whsec_…` in `.env.local` | Dashboard endpoint → `whsec_…` in Vercel Production |
| App URL | `http://localhost:3000` | `https://app.oenoboost.fr` (custom subdomain; apex/www stay on Hostinger) |

Never put `sk_live_` in `.env.local`. Never put sandbox price IDs on Vercel Production.

## Catalog (live)

| Product | Price ID | Amount |
|---|---|---|
| **Oenoboost Premium** (`prod_UPII2aruWPacr7`) | `price_1TQThWDbuF0k3RfWsMoZ6Gby` | **€9.99**/month |
| Abonnement oenoboost (`prod_UOtw7Aj5Nd0hgV`) | `price_1TQ68gDbuF0k3RfWBCU2neq7` | €10.00/month (likely duplicate — confirm before deactivating) |

## Catalog (sandbox oenoboost-dev)

| Product | Price ID | Amount |
|---|---|---|
| **Oenoboost Premium** (`prod_VggJ7YEMAOZiN8`) | `price_1UfIwQDrrxcdxcE8zzubKet6` | **€9.99**/month |

## App env vars

```bash
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_ID_PREMIUM=
NEXT_PUBLIC_APP_URL=
```

## Code map

- Checkout / portal: `apps/web/features/billing/actions/billing-actions.ts`
- Stripe ↔ DB reconcile: `apps/web/lib/billing/reconcile-subscription.ts`
- Webhook: `apps/web/app/api/webhooks/stripe/route.ts`  
  Events: `checkout.session.completed`, `customer.subscription.created|updated|deleted`
- Finalize: `apps/web/app/api/billing/checkout-finalize/route.ts`

## Local (sandbox)

```bash
stripe switch acct_1UfIg3DrrxcdxcE8
stripe listen --events checkout.session.completed,customer.subscription.created,customer.subscription.updated,customer.subscription.deleted \
  --forward-to localhost:3000/api/webhooks/stripe
pnpm run dev:web
# card: 4242 4242 4242 4242
```

Helpers: `scripts/stripe-local-setup.sh`, `scripts/stripe-finish-after-auth.sh`.

## Production (live) — checklist

Live webhook endpoint (created):

- ID: `we_1UfJC7DbuF0k3RfWMCJQEFQH`
- URL: `https://oenoboost-app-hffz.vercel.app/api/webhooks/stripe`
- Events: checkout.session.completed + subscription created/updated/deleted

Set these in **Vercel → oenoboost-app-hffz → Settings → Environment Variables → Production** (agent cannot write Production env — 403):

1. `STRIPE_SECRET_KEY` = live Secret key (`sk_live_…`) from [API keys](https://dashboard.stripe.com/apikeys)
2. `STRIPE_WEBHOOK_SECRET` = signing secret of endpoint `we_1UfJC7DbuF0k3RfWMCJQEFQH` (Dashboard → Developers → Webhooks → Reveal)
3. `STRIPE_PRICE_ID_PREMIUM` = `price_1TQThWDbuF0k3RfWsMoZ6Gby`
4. `NEXT_PUBLIC_APP_URL` = `https://app.oenoboost.fr`

Then **redeploy** Production so the new env is picked up.

**Vercel Authentication:** SSO was restricted to **Preview** only so Stripe can hit the production webhook on `*.vercel.app`. Keep it that way (or use a custom domain).

After custom domain (Hostinger DNS): update webhook URL + `NEXT_PUBLIC_APP_URL` to `https://app.oenoboost.fr`.

### Custom domain DNS (Hostinger → Vercel)

- **Vercel project:** `oenoboost-app-hffz` (team `oenoboost`) — domain `app.oenoboost.fr` attached.
- **Keep intact on Hostinger:** apex `@`, `www`, and all `MX` / mail `TXT` (existing site + Google mail).
- **Add only** this Hostinger DNS record:

| Type | Name | Target | TTL |
| --- | --- | --- | --- |
| CNAME | `app` | `cname.vercel-dns.com` | 300 |

Do **not** point `oenoboost.fr` / `www` at Vercel while the current Hostinger site must stay live.

## Status

- [x] Live Premium price €9.99
- [x] Sandbox local wired (`.env.local`)
- [x] Billing reconcile (live vs sandbox rows)
- [x] Live webhook endpoint created
- [x] Vercel: `app.oenoboost.fr` added on `oenoboost-app-hffz`
- [x] Hostinger DNS: CNAME `app` → `cname.vercel-dns.com` (added; Vercel reports configuredBy=CNAME, misconfigured=false)
- [ ] Vercel Production env: `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET` + price + `NEXT_PUBLIC_APP_URL=https://app.oenoboost.fr` (manual — permission)
- [ ] Stripe webhook URL → `https://app.oenoboost.fr/api/webhooks/stripe`
- [ ] Supabase Auth redirect URLs include `https://app.oenoboost.fr/**`
- [ ] Redeploy Production
- [ ] Smoke test one real card / or Stripe test in live carefully
