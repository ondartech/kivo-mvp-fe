import { afterEach, describe, expect, it, vi } from "vitest";

import { fetchPublic } from "./api-client";

describe("fetchPublic", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("adds correlation headers without attaching authorization or idempotency", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("crypto", { randomUUID: () => "request-1" });

    await fetchPublic("https://acme.getondar.com/api/v1/public/test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const headers = new Headers(init.headers);

    expect(headers.get("X-Request-Id")).toBe("request-1");
    expect(headers.get("X-Correlation-Id")).toBe("request-1");
    expect(headers.has("Authorization")).toBe(false);
    expect(headers.has("Idempotency-Key")).toBe(false);
  });
});
