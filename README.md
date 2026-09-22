# Ondar web application

This repository contains the Next.js frontend for Ondar. The historical repository name
and some internal code identifiers still use `kivo`; the public product identity is Ondar.

## Runtime contract

The production frontend runs as a Next.js standalone Node server:

- container port: `3000`
- liveness: `GET /health`
- readiness: `GET /ready`
- canonical backend API: `https://api.getondar.com`
- canonical app host: `https://app.getondar.com`
- organization vanity host: `https://{handle}.getondar.com`
- public invoice path: `/i/{token}`

`NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_MICROSOFT_AUTH_ENABLED` are **build-time public values**. They are compiled into the client bundle and must never contain secrets. Microsoft authentication defaults to disabled; only build the web image with `NEXT_PUBLIC_MICROSOFT_AUTH_ENABLED=true` after the matching backend environment has Microsoft auth enabled and its Entra credential is present in Key Vault.

## Local development

```bash
npm ci
NEXT_PUBLIC_API_URL=http://localhost:8000 npm run dev
```

The development server listens on port 3000 by default.

## Production build

```bash
npm ci
NEXT_PUBLIC_API_URL=https://api.getondar.com \
NEXT_PUBLIC_MICROSOFT_AUTH_ENABLED=false \
npm run build
```

`next.config.mjs` uses `output: "standalone"` so the resulting server can run without
shipping the full development dependency tree.

## Container image

```bash
docker build \
  --build-arg NEXT_PUBLIC_API_URL=https://api.getondar.com \
  --build-arg NEXT_PUBLIC_MICROSOFT_AUTH_ENABLED=false \
  -t ondar-web:local .
docker run --rm -p 3000:3000 ondar-web:local
```

The image runs as the non-root `nextjs` user. Runtime configuration must not attempt to
change `NEXT_PUBLIC_API_URL`; rebuild the image when that public build-time value changes.

## Organization vanity routing

FE-010 classifies browser hosts into apex, system, tenant, local, external, or unknown
Ondar hosts. A tenant hostname may expose its single-label handle to server-side
presentation code through internal request headers, but the handle is never an
authorization credential.

Stable browser URLs use an explicit `/app` namespace:

```text
https://app.getondar.com/app/dashboard
https://acme.getondar.com/app/dashboard
https://acme.getondar.com/app/customers
```

The middleware rewrites those paths internally onto the repository's existing App Router
surfaces such as `/dashboard` and `/customers`. The browser URL remains `/app/...`.

On tenant hosts, public capability paths are never rewritten:

```text
/i/{token}
/q/{token}
/accept/{token}
/pay/{token}
```

Only `/i/{token}` exists in the current frontend implementation; the other public
surfaces may be added by their owning product cards without changing hostname routing.

A browser hostname is presentation context, not tenant authorization. Authenticated data
access still uses backend JWT/membership enforcement and public document access still uses
opaque tokens. The frontend must never treat a hostname as proof of organization
membership.

Unknown deeper Ondar hosts such as `foo.bar.getondar.com` return 404 rather than being
guessed into a tenant context.

## Validation

Before merging frontend changes:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
docker build --build-arg NEXT_PUBLIC_API_URL=https://api.getondar.com -t ondar-web:test .
```
