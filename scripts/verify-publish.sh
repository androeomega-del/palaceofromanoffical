#!/usr/bin/env bash
# Post-publish smoke test: confirms critical admin routes are reachable on the live site.
# Usage: bash scripts/verify-publish.sh [base-url]
# Default base: https://palaceofromanofficial.com
set -u

BASE="${1:-https://palaceofromanofficial.com}"
ROUTES=(
  "/admin/gsc-monitor"
)

fail=0
for path in "${ROUTES[@]}"; do
  url="${BASE}${path}"
  code=$(curl -sS -o /dev/null -L -w "%{http_code}" --max-time 20 "$url" || echo "000")
  if [[ "$code" == "200" ]]; then
    printf "  PASS  %s  -> %s\n" "$code" "$url"
  else
    printf "  FAIL  %s  -> %s\n" "$code" "$url"
    fail=1
  fi
done

if [[ $fail -ne 0 ]]; then
  echo "Post-publish verification FAILED."
  exit 1
fi
echo "Post-publish verification OK."
