# Public frontend surfaces

The public route group renders browser-facing capability links that do not require an
Ondar account.

Current canonical paths:

```text
/i/{token}       invoice
/q/{token}       quote
/accept/{token}  milestone acceptance
/pay/{token}     payment handoff
```

## Tenant vanity host routing

Production public links use the organization hostname:

```text
https://{organization.handle}.getondar.com/<surface>/{token}
```

Public pages must call public API endpoints on the **same browser hostname**:

```text
https://acme.getondar.com/i/{token}
  -> https://acme.getondar.com/api/v1/public/invoices/{token}
```

The edge layer owns path routing:

- browser/document paths route to the frontend runtime;
- `/api/v1/*` routes to the backend runtime;
- the original tenant hostname must remain available to backend Host classification.

This is required for backend Host/token consistency telemetry and later mismatch
enforcement. Public pages must not silently switch vanity traffic to
`api.getondar.com`.

## Development fallback

Localhost and non-Ondar infrastructure hosts use `NEXT_PUBLIC_API_URL`. This keeps local
frontend development working without requiring wildcard DNS.

## Authority

The hostname is presentation context only. Opaque public tokens remain the authority for
invoice, quote, acceptance and payment resolution. The frontend must not infer tenant
authorization from the hostname.

## Data rules

- Do not expose internal organization IDs.
- Do not calculate authoritative money values in the browser.
- Render backend-provided Decimal strings.
- Public API errors should not reveal whether another organization owns a token.
