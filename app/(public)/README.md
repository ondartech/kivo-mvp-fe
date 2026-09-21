# Public web surface

The public route group owns browser-facing token URLs. These routes are capability
surfaces, not tenant-authentication surfaces.

## Vanity hosts

Tenant-facing Ondar URLs use:

```text
https://{organization-handle}.getondar.com/...
```

`middleware.ts` classifies the request Host and exposes `x-ondar-tenant-handle` to
server-side routes/components as presentation context only. It must never be used instead
of backend membership or opaque-token resolution.

## Public API requests

Browser-facing public pages should call the same-origin `/api/public/*` proxy rather than
calling the backend host directly. The proxy forwards the original vanity host as
`X-Forwarded-Host`; the backend may consume it only when the immediate proxy address is
inside its trusted-proxy CIDRs.

This preserves Host context for security telemetry without giving the frontend authority
to select an organization.

## Payment links

`/pay/{token}` is a thin server route. It forwards the opaque token to the backend hosted
payment endpoint and relays the provider redirect. The frontend never calculates payment
amounts or treats Host as payment authority.

## Public UI surfaces

The public route group now exposes:

- `/i/{token}` — invoice
- `/q/{token}` — frozen public quote
- `/accept/{token}` — milestone acceptance view and decision
- `/pay/{token}` — hosted payment redirect

Quote and acceptance pages consume only the PII-minimal backend public contracts. They do
not calculate financial totals, resolve organizations from Host, or expose internal IDs.
