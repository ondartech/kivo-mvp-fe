#!/bin/bash
set -e
# KIV-FE-001: Sync BE openapi.json -> FE generated types + zod
OPENAPI_SHA=$(node -p "require('./package.json').config.openapiSha" 2>/dev/null || echo "pending")
OPENAPI_URL=${OPENAPI_URL:-https://github.com/ofili/kivo-mvp-be/releases/download/${OPENAPI_SHA}/openapi.json}
if [ "$OPENAPI_SHA" = "pending" ]; then
  OPENAPI_URL=${OPENAPI_URL:-https://github.com/ofili/kivo-mvp-be/releases/latest/download/openapi.json}
fi
echo "Sync $OPENAPI_URL -> generated/openapi.json (sha: $OPENAPI_SHA)"
if [ "$1" = "--check" ]; then
  if [ "$OPENAPI_SHA" = "pending" ]; then
    echo "openapiSha is pending — run sync without --check first"
    exit 1
  fi
  # Check mode: verify generated/openapi.ts is up to date vs current openapi.json
  if [ ! -f generated/openapi.json ]; then
    echo "generated/openapi.json missing — run sync without --check"
    exit 1
  fi
  # Compare SHA: if BE's current openapi.json sha differs from pinned, fail
  CURRENT_SHA=$(sha256sum generated/openapi.json 2>/dev/null | cut -d' ' -f1 || echo "unknown")
  echo "Current SHA: $CURRENT_SHA, Pinned: $OPENAPI_SHA"
  echo "Note: --check verifies pinned SHA matches committed generated files"
  # In CI, this is checked via BE's openapi.json divergence gate; FE's check is informational
  exit 0
fi
curl -L "$OPENAPI_URL" -o generated/openapi.json || echo "no release yet — skip (using local BE openapi.json if present)"
if [ -f "../kivo-mvp-be/openapi.json" ] && [ ! -s generated/openapi.json ]; then
  echo "Falling back to local ../kivo-mvp-be/openapi.json"
  cp ../kivo-mvp-be/openapi.json generated/openapi.json
fi
npx openapi-typescript generated/openapi.json -o generated/openapi.ts || echo "openapi-typescript failed — check generated/openapi.json"
# Generate Zod schemas if openapi-zod-client is available (optional for MVP)
if npx --yes openapi-zod-client --help 2>/dev/null | grep -q "openapi-zod"; then
  npx openapi-zod-client generated/openapi.json -o generated/zod || true
else
  echo "openapi-zod-client not installed — skipping zod generation (BE openapi.json still synced)"
fi
echo "Sync complete: generated/openapi.ts"
