import { describe, expect, it } from "vitest";

import { classifyTenantHost, normalizeHostname } from "@/lib/tenant-host";

describe("tenant host routing", () => {
  it("normalizes host ports and case", () => {
    expect(normalizeHostname("ACME.getondar.com:443")).toBe("acme.getondar.com");
  });

  it("extracts only single-label tenant handles", () => {
    expect(classifyTenantHost("acme.getondar.com")).toEqual({
      hostname: "acme.getondar.com",
      kind: "TENANT",
      handle: "acme",
    });

    expect(classifyTenantHost("foo.bar.getondar.com")).toEqual({
      hostname: "foo.bar.getondar.com",
      kind: "UNKNOWN_ONDAR",
      handle: null,
    });
  });

  it.each(["api", "app", "pay", "www"])(
    "keeps %s.getondar.com as a system hostname",
    (label) => {
      expect(classifyTenantHost(label + ".getondar.com")).toEqual({
        hostname: label + ".getondar.com",
        kind: "SYSTEM",
        handle: null,
      });
    },
  );

  it("does not treat external or local hosts as tenants", () => {
    expect(classifyTenantHost("localhost:3000").kind).toBe("LOCAL");
    expect(classifyTenantHost("example.com").kind).toBe("EXTERNAL");
  });

  it.each([
    "https://acme.getondar.com",
    "acme getondar.com",
    "user@acme.getondar.com",
    "-acme.getondar.com",
    "acme.getondar.com:bad",
  ])("rejects malformed hosts: %s", (host) => {
    expect(() => classifyTenantHost(host)).toThrow("Invalid host");
  });
});
