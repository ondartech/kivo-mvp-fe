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

## Missing public UI surfaces

Invoice `/i/{token}` exists today. Quote `/q/{token}` and milestone acceptance
`/accept/{token}` require their own product-surface implementation cards; vanity-host
routing must not fabricate their business state.
