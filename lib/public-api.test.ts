import { describe, expect, it } from "vitest";

import {
  isOndarPublicHost,
  normalizeRequestHost,
  publicApiUrl,
  resolvePublicApiOrigin,
} from "./public-api";

describe("public API routing", () => {
  it("uses the tenant vanity origin for one-label getondar hosts", () => {
    expect(
      publicApiUrl(
        "acme.getondar.com",
        "https://api.getondar.com",
        "/api/v1/public/invoices/token-1",
      ),
    ).toBe(
      "https://acme.getondar.com/api/v1/public/invoices/token-1",
    );
  });

  it("uses the public app origin when the fallback public host serves the page", () => {
    expect(
      resolvePublicApiOrigin(
        "app.getondar.com",
        "https://api.getondar.com",
      ),
    ).toBe("https://app.getondar.com");
  });

  it("falls back to the configured API for localhost and infrastructure hosts", () => {
    expect(
      resolvePublicApiOrigin(
        "localhost:3000",
        "https://api.getondar.com/",
      ),
    ).toBe("https://api.getondar.com");

    expect(
      resolvePublicApiOrigin(
        "web.internal.example",
        "https://api.getondar.com",
      ),
    ).toBe("https://api.getondar.com");
  });

  it("rejects deep and lookalike hosts from the same-origin rule", () => {
    expect(isOndarPublicHost("foo.bar.getondar.com")).toBe(false);
    expect(isOndarPublicHost("acme.getondar.com.attacker.example")).toBe(false);
  });

  it("normalizes case, ports, and a trailing FQDN dot", () => {
    expect(normalizeRequestHost("Acme.GetOndar.com:443")).toBe(
      "acme.getondar.com",
    );
    expect(normalizeRequestHost("getondar.com.")).toBe("getondar.com");
  });
});
