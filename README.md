# Ondar frontend

This repository hosts the Next.js frontend for Ondar.

## Organization vanity hosts

FE-010 recognizes single-label organization hosts under:

```text
https://{handle}.getondar.com
```

The frontend middleware classifies the request Host and forwards these internal request
headers to server-side application code:

- `x-ondar-host-kind`
- `x-ondar-original-host`
- `x-ondar-tenant-handle` when the Host is a tenant vanity hostname

These headers are presentation context only. They do not authenticate a user, prove
membership, or authorize access to an organization.

Authenticated tenant authority remains the backend membership check. Public invoice,
quote, acceptance, and payment authority remains the opaque capability token resolved by
the backend.

## Host classes

The frontend distinguishes:

- `getondar.com` — apex;
- `api|app|pay|www.getondar.com` — system hosts;
- one DNS label such as `acme.getondar.com` — tenant host;
- deeper names such as `foo.bar.getondar.com` — unknown Ondar host;
- localhost/IP — local development;
- all other hosts — external.

Reserved organization handles are enforced by the backend Organization domain. Frontend
host parsing is deliberately not a second reservation authority.

## Routing

Vanity-host routing preserves the incoming path. For example:

```text
https://acme.getondar.com/i/<token>
```

continues to resolve through the existing Next.js `/i/[token]` route.

The middleware does not rewrite tenant handles into organization IDs. Any future
authenticated host-first navigation must resolve the handle through an authenticated
backend API and still enforce membership server-side.

## Configuration

```text
NEXT_PUBLIC_API_URL=https://api.getondar.com
NEXT_PUBLIC_ROOT_DOMAIN=getondar.com
```

Local development continues to work on localhost without tenant classification.
