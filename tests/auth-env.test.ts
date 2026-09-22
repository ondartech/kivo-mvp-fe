import { afterEach, describe, expect, it, vi } from "vitest";

describe("Microsoft authentication frontend gate", () => {
  afterEach(() => {
    delete process.env.NEXT_PUBLIC_MICROSOFT_AUTH_ENABLED;
    vi.resetModules();
  });

  it("defaults to disabled so an unconfigured backend never exposes a broken button", async () => {
    delete process.env.NEXT_PUBLIC_MICROSOFT_AUTH_ENABLED;
    vi.resetModules();

    const { env } = await import("@/lib/env");

    expect(env.NEXT_PUBLIC_MICROSOFT_AUTH_ENABLED).toBe(false);
  });

  it("enables only for the explicit true build-time value", async () => {
    process.env.NEXT_PUBLIC_MICROSOFT_AUTH_ENABLED = "true";
    vi.resetModules();

    const { env } = await import("@/lib/env");

    expect(env.NEXT_PUBLIC_MICROSOFT_AUTH_ENABLED).toBe(true);
  });

  it("does not treat arbitrary non-empty strings as enabled", async () => {
    process.env.NEXT_PUBLIC_MICROSOFT_AUTH_ENABLED = "1";
    vi.resetModules();

    const { env } = await import("@/lib/env");

    expect(env.NEXT_PUBLIC_MICROSOFT_AUTH_ENABLED).toBe(false);
  });
});
