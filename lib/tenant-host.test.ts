import { describe, expect, it } from "vitest";
import { classifyTenantHost } from "@/lib/tenant-host";

describe("classifyTenantHost", () => {
  it("extracts a single-label tenant handle", () => {
    expect(classifyTenantHost("acme.getondar.com")).toEqual({
      hostname: "acme.getondar.com",
      kind: "TENANT",
      handle: "acme",
    });
  });

  it("never treats platform hosts as tenants", () => {
    expect(classifyTenantHost("api.getondar.com").kind).toBe("SYSTEM");
    expect(classifyTenantHost("app.getondar.com").handle).toBeNull();
    expect(classifyTenantHost("pay.getondar.com").handle).toBeNull();
  });

  it("rejects deep descendants as tenant handles", () => {
    expect(classifyTenantHost("foo.bar.getondar.com")).toEqual({
      hostname: "foo.bar.getondar.com",
      kind: "UNKNOWN_ONDAR",
      handle: null,
    });
  });

  it("supports local development with a port", () => {
    expect(classifyTenantHost("localhost:3000").kind).toBe("LOCAL");
  });

  it("does not infer tenants from external lookalikes", () => {
    expect(classifyTenantHost("acme.getondar.com.attacker.example").kind).toBe("EXTERNAL");
  });
});
