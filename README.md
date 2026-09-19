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
- organization vanity host: `https://{handle}.getondar.com` (FE-010)
- public invoice path: `/i/{token}`

`NEXT_PUBLIC_API_URL` is a **build-time public value**. It is compiled into the client
bundle and must never contain a secret.

## Local development

```bash
npm ci
NEXT_PUBLIC_API_URL=http://localhost:8000 npm run dev
```

The development server listens on port 3000 by default.

## Production build

```bash
npm ci
NEXT_PUBLIC_API_URL=https://api.getondar.com npm run build
```

`next.config.mjs` uses `output: "standalone"` so the resulting server can run without
shipping the full development dependency tree.

## Container image

```bash
docker build \
  --build-arg NEXT_PUBLIC_API_URL=https://api.getondar.com \
  -t ondar-web:local .
docker run --rm -p 3000:3000 ondar-web:local
```

The image runs as the non-root `nextjs` user. Runtime configuration must not attempt to
change `NEXT_PUBLIC_API_URL`; rebuild the image when that public build-time value changes.

## Tenancy and hostname invariant

A browser hostname is presentation context, not tenant authorization. FE-010 may derive
an organization handle from `{handle}.getondar.com`, but authenticated data access still
uses backend JWT/membership enforcement and public document access still uses opaque
tokens. The frontend must never treat a hostname as proof of organization membership.

## Validation

Before merging frontend changes:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
docker build --build-arg NEXT_PUBLIC_API_URL=https://api.getondar.com -t ondar-web:test .
```
