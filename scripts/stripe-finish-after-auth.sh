#!/usr/bin/env bash
# Polls until sandbox oenoboost-dev is authorized, then:
# - switches CLI to sandbox
# - ensures Premium €9.99/month price
# - writes STRIPE_* into apps/web/.env.local
# - starts stripe listen briefly to capture whsec
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENV_LOCAL="$ROOT/apps/web/.env.local"
SANDBOX_ACCT="${STRIPE_SANDBOX_ACCOUNT_ID:-acct_1UfIg3DrrxcdxcE8}"
PRODUCT_NAME="Oenoboost Premium"
AMOUNT=999
CURRENCY=eur
export PATH="${HOME}/.local/bin:${HOME}/.nvm/versions/node/v20.19.6/bin:/usr/bin:/bin:/opt/homebrew/bin:${PATH}"

log() { printf '%s\n' "$*"; }

wait_for_sandbox() {
  local i out
  for i in $(seq 1 120); do
    out="$(stripe sandboxes list 2>/dev/null || true)"
    if printf '%s' "$out" | grep -q "$SANDBOX_ACCT"; then
      log "✓ sandbox authorized: $SANDBOX_ACCT"
      return 0
    fi
    # Any acct_ under sandboxes list (authorized)
    if printf '%s' "$out" | grep -Eq 'acct_[A-Za-z0-9]+'; then
      SANDBOX_ACCT="$(printf '%s' "$out" | grep -Eo 'acct_[A-Za-z0-9]+' | head -1)"
      log "✓ sandbox authorized (discovered): $SANDBOX_ACCT"
      return 0
    fi
    log "… waiting for sandbox auth ($i/120) — finish Stripe browser approval (tick oenoboost-dev)"
    sleep 5
  done
  return 1
}

upsert_env() {
  local key="$1" val="$2"
  python3 - "$ENV_LOCAL" "$key" "$val" <<'PY'
from pathlib import Path
import sys
path, key, val = Path(sys.argv[1]), sys.argv[2], sys.argv[3]
lines = path.read_text().splitlines() if path.exists() else []
out, seen = [], False
for line in lines:
    if line.startswith(f"{key}=") or line.startswith(f"{key} ="):
        out.append(f'{key}="{val}"')
        seen = True
    else:
        out.append(line)
if not seen:
    if out and out[-1].strip():
        out.append("")
    out.append(f'# Stripe (sandbox / test) — issue #37')
    out.append(f'{key}="{val}"')
path.write_text("\n".join(out).rstrip() + "\n")
print(f"set {key}")
PY
}

main() {
  wait_for_sandbox

  log "→ switch to sandbox"
  stripe switch "$SANDBOX_ACCT" >/dev/null

  PRODUCTS_JSON="$(stripe products list --limit 100)"
  PRODUCT_ID="$(python3 - <<'PY' "$PRODUCTS_JSON" "$PRODUCT_NAME"
import json,sys
data=json.loads(sys.argv[1]); name=sys.argv[2]
for p in data.get("data",[]):
    if p.get("name")==name and p.get("active"):
        print(p["id"]); break
PY
)"
  if [[ -z "${PRODUCT_ID}" ]]; then
    PRODUCT_ID="$(stripe products create --name="$PRODUCT_NAME" | python3 -c 'import json,sys; print(json.load(sys.stdin)["id"])')"
    log "  created product $PRODUCT_ID"
  else
    log "  reuse product $PRODUCT_ID"
  fi

  PRICES_JSON="$(stripe prices list --product="$PRODUCT_ID" --limit 100 --active=true)"
  PRICE_ID="$(python3 - <<'PY' "$PRICES_JSON" "$AMOUNT" "$CURRENCY"
import json,sys
data=json.loads(sys.argv[1]); amount=int(sys.argv[2]); currency=sys.argv[3]
for p in data.get("data",[]):
    rec=p.get("recurring") or {}
    if p.get("unit_amount")==amount and p.get("currency")==currency and rec.get("interval")=="month" and p.get("active"):
        print(p["id"]); break
PY
)"
  if [[ -z "${PRICE_ID}" ]]; then
    PRICE_ID="$(
      stripe prices create --product="$PRODUCT_ID" --currency="$CURRENCY" --unit-amount="$AMOUNT" \
        -d "recurring[interval]=month" \
        | python3 -c 'import json,sys; print(json.load(sys.stdin)["id"])'
    )"
    log "  created price $PRICE_ID"
  else
    log "  reuse price $PRICE_ID"
  fi

  upsert_env NEXT_PUBLIC_APP_URL "http://localhost:3000"
  upsert_env STRIPE_PRICE_ID_PREMIUM "$PRICE_ID"

  # Secret key: prefer env, else leave placeholder note
  if [[ -n "${STRIPE_SECRET_KEY:-}" ]]; then
    upsert_env STRIPE_SECRET_KEY "$STRIPE_SECRET_KEY"
  else
    log "⚠ STRIPE_SECRET_KEY not set — paste sandbox sk_test_ from Dashboard → API keys"
  fi

  log "→ capturing webhook signing secret via stripe listen"
  LISTEN_LOG="$(mktemp)"
  # print-secret exits after printing (newer CLI) — fallback to listen + parse
  WHSEC=""
  if WHSEC="$(stripe listen --print-secret 2>/dev/null)"; then
    :
  else
    stripe listen --forward-to localhost:3000/api/webhooks/stripe >"$LISTEN_LOG" 2>&1 &
    LPID=$!
    for _ in $(seq 1 30); do
      if WHSEC="$(python3 - <<'PY' "$LISTEN_LOG"
import re,sys
from pathlib import Path
t=Path(sys.argv[1]).read_text(errors="ignore")
m=re.search(r"whsec_[A-Za-z0-9]+", t)
print(m.group(0) if m else "")
PY
)"; then
        [[ -n "$WHSEC" ]] && break
      fi
      sleep 1
    done
    kill "$LPID" 2>/dev/null || true
    wait "$LPID" 2>/dev/null || true
  fi

  if [[ -n "${WHSEC}" ]]; then
    upsert_env STRIPE_WEBHOOK_SECRET "$WHSEC"
    log "✓ STRIPE_WEBHOOK_SECRET written"
  else
    log "⚠ could not capture whsec — run: stripe listen --forward-to localhost:3000/api/webhooks/stripe"
  fi

  log
  log "Done. Keys in $ENV_LOCAL (names only):"
  grep -E '^(STRIPE_|NEXT_PUBLIC_APP_URL)' "$ENV_LOCAL" | sed 's/=.*/=***/' || true
  log
  log "Next: ensure STRIPE_SECRET_KEY (sk_test_…) is set, then:"
  log "  stripe listen --forward-to localhost:3000/api/webhooks/stripe"
  log "  pnpm run dev:web"
  log "  Checkout with 4242 4242 4242 4242"
}

main "$@"
