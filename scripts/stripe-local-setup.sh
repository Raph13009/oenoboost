#!/usr/bin/env bash
# Local Stripe wiring for OenoBoost (#37).
# Prereqs: Stripe CLI ≥ 1.55, authorized for oenoboost.fr + sandbox oenoboost-dev.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENV_LOCAL="$ROOT/apps/web/.env.local"
SANDBOX_ACCT="${STRIPE_SANDBOX_ACCOUNT_ID:-acct_1UfIg3DrrxcdxcE8}"
LIVE_PRICE_AMOUNT=999
LIVE_PRICE_CURRENCY=eur
PRODUCT_NAME="Oenoboost Premium"

export PATH="${HOME}/.local/bin:${HOME}/.nvm/versions/node/v20.19.6/bin:/usr/bin:/bin:/opt/homebrew/bin:${PATH}"

if ! command -v stripe >/dev/null; then
  echo "Stripe CLI missing. Run: npm i -g @stripe/cli@latest" >&2
  exit 1
fi

echo "→ Switching to sandbox ${SANDBOX_ACCT}"
if ! stripe switch "$SANDBOX_ACCT" --format json >/dev/null; then
  echo "Sandbox not authorized. Run:" >&2
  echo "  stripe login" >&2
  echo "Then authorize sandbox oenoboost-dev (${SANDBOX_ACCT}) and re-run this script." >&2
  exit 1
fi

echo "→ Ensuring Premium product/price (€9.99/month) in sandbox"
PRODUCTS_JSON="$(stripe products list --limit 100)"
PRODUCT_ID="$(python3 - <<'PY' "$PRODUCTS_JSON" "$PRODUCT_NAME"
import json,sys
data=json.loads(sys.argv[1])
name=sys.argv[2]
for p in data.get("data",[]):
    if p.get("name")==name and p.get("active"):
        print(p["id"]); break
PY
)"

if [[ -z "${PRODUCT_ID}" ]]; then
  PRODUCT_ID="$(stripe products create --name="$PRODUCT_NAME" -d "tax_code=" | python3 -c 'import json,sys; print(json.load(sys.stdin)["id"])')"
  echo "  created product ${PRODUCT_ID}"
else
  echo "  reuse product ${PRODUCT_ID}"
fi

PRICES_JSON="$(stripe prices list --product="$PRODUCT_ID" --limit 100 --active=true)"
PRICE_ID="$(python3 - <<'PY' "$PRICES_JSON" "$LIVE_PRICE_AMOUNT" "$LIVE_PRICE_CURRENCY"
import json,sys
data=json.loads(sys.argv[1])
amount=int(sys.argv[2]); currency=sys.argv[3]
for p in data.get("data",[]):
    rec=p.get("recurring") or {}
    if (
        p.get("unit_amount")==amount
        and p.get("currency")==currency
        and rec.get("interval")=="month"
        and p.get("active")
    ):
        print(p["id"]); break
PY
)"

if [[ -z "${PRICE_ID}" ]]; then
  PRICE_ID="$(
    stripe prices create \
      --product="$PRODUCT_ID" \
      --currency="$LIVE_PRICE_CURRENCY" \
      --unit-amount="$LIVE_PRICE_AMOUNT" \
      -d "recurring[interval]=month" \
      | python3 -c 'import json,sys; print(json.load(sys.stdin)["id"])'
  )"
  echo "  created price ${PRICE_ID}"
else
  echo "  reuse price ${PRICE_ID}"
fi

# Restricted key for sandbox: prefer STRIPE_API_KEY if set, else ask CLI profile
# After switch, `stripe listen` prints whsec — we start listen separately.
SECRET_KEY="${STRIPE_SECRET_KEY:-}"
if [[ -z "$SECRET_KEY" ]]; then
  echo "→ STRIPE_SECRET_KEY not in environment."
  echo "  Paste the sandbox Secret key (sk_test_…) from Dashboard → Developers → API keys"
  echo "  into apps/web/.env.local (script will write other fields)."
fi

touch "$ENV_LOCAL"
python3 - <<'PY' "$ENV_LOCAL" "$PRICE_ID" "$SECRET_KEY"
from pathlib import Path
import sys
path = Path(sys.argv[1])
price_id = sys.argv[2]
secret = sys.argv[3]
lines = path.read_text().splitlines() if path.exists() else []
kv = {}
order = []
for line in lines:
    raw = line
    if not line.strip() or line.strip().startswith("#") or "=" not in line:
        order.append(("raw", raw))
        continue
    k, _, v = line.partition("=")
    kv[k.strip()] = v
    order.append(("kv", k.strip()))

def set_key(k, v):
    if k in kv:
        kv[k] = v
    else:
        order.append(("kv", k))
        kv[k] = v

set_key("NEXT_PUBLIC_APP_URL", '"http://localhost:3000"')
set_key("STRIPE_PRICE_ID_PREMIUM", f'"{price_id}"')
if secret:
    set_key("STRIPE_SECRET_KEY", f'"{secret}"')
# webhook secret filled by stripe listen tip / operator

out = []
seen = set()
for kind, val in order:
    if kind == "raw":
        out.append(val)
    else:
        if val in seen:
            continue
        seen.add(val)
        out.append(f"{val}={kv[val]}")
for k, v in kv.items():
    if k not in seen:
        out.append(f"{k}={v}")
path.write_text("\n".join(out).rstrip() + "\n")
print(f"updated {path}")
print(f"STRIPE_PRICE_ID_PREMIUM={price_id}")
PY

echo
echo "Next:"
echo "  1) Ensure STRIPE_SECRET_KEY (sk_test_…) is in apps/web/.env.local"
echo "  2) stripe listen --forward-to localhost:3000/api/webhooks/stripe"
echo "  3) Copy whsec_… → STRIPE_WEBHOOK_SECRET in .env.local"
echo "  4) pnpm run dev:web  → test checkout with card 4242…"
