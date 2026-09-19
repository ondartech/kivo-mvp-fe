# Ondar frontend

Next.js 15 frontend for the Ondar application and public customer surfaces.

## Local development

```bash
npm ci
npm run dev
```

The authenticated application uses `NEXT_PUBLIC_API_URL`. Public capability pages on
`*.getondar.com` use the same browser hostname for `/api/v1/*` so the edge can preserve
tenant Host context for backend Host/token consistency checks.

See `app/(public)/README.md` for the public routing contract.

## Production container

The app builds with Next.js standalone output and runs as a non-root user:

```bash
docker build -t ondar-web .
docker run --rm -p 3000:3000 ondar-web
```

Runtime endpoints:

- `GET /health` — liveness; no backend dependency.
- `GET /ready` — web-process readiness; no financial/backend inference.

The Azure Container App should target port `3000` and use these probes. Public edge
routing must send document/browser paths to this web runtime and `/api/v1/*` to the
backend runtime.

Do not place secrets in `NEXT_PUBLIC_*` variables. Only browser-safe configuration such
as the API origin belongs there.
