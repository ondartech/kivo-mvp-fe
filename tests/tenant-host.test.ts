import { describe, expect, it } from "vitest";

import {
  classifyTenantHost,
  normalizeHostname,
  routeForHost,
} from "@/lib/tenant-host";

describe("tenant host classification", () => {
  it("normalizes case and ports", () => {
    expect(normalizeHostname("ACME.getondar.com:443")).toBe(
      "acme.getondar.com",
    );
  });

  it("extracts only a single-label tenant handle", () => {
    expect(classifyTenantHost("acme.getondar.com")).toEqual({
      hostname: "acme.getondar.com",
      kind: "TENANT",
      handle: "acme",
      systemLabel: null,
    });

    expect(classifyTenantHost("foo.bar.getondar.com").kind).toBe(
      "UNKNOWN_ONDAR",
    );
  });

  it.each(["api", "app", "pay", "www"])(
    "classifies %s as a system hostname",
    (label) => {
      expect(classifyTenantHost(label + ".getondar.com")).toEqual({
        hostname: label + ".getondar.com",
        kind: "SYSTEM",
        handle: null,
        systemLabel: label,
      });
    },
  );

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

describe("tenant host routing", () => {
  it("redirects a tenant root to the stable app URL", () => {
    const context = classifyTenantHost("acme.getondar.com");

    expect(routeForHost(context, "/")).toEqual({
      type: "REDIRECT",
      pathname: "/app/dashboard",
    });
  });

  it("rewrites tenant /app paths onto existing Next routes", () => {
    const context = classifyTenantHost("acme.getondar.com");

    expect(routeForHost(context, "/app")).toEqual({
      type: "REDIRECT",
      pathname: "/app/dashboard",
    });
    expect(routeForHost(context, "/app/dashboard")).toEqual({
      type: "REWRITE",
      pathname: "/dashboard",
    });
    expect(routeForHost(context, "/app/customers/123")).toEqual({
      type: "REWRITE",
      pathname: "/customers/123",
    });
  });

  it("leaves public capability-token paths untouched on tenant hosts", () => {
    const context = classifyTenantHost("acme.getondar.com");

    for (const path of [
      "/i/token",
      "/q/token",
      "/accept/token",
      "/pay/token",
    ]) {
      expect(routeForHost(context, path)).toEqual({ type: "NEXT" });
    }
  });

  it("gives app.getondar.com the same /app browser namespace", () => {
    const context = classifyTenantHost("app.getondar.com");

    expect(routeForHost(context, "/")).toEqual({
      type: "REDIRECT",
      pathname: "/app/dashboard",
    });
    expect(routeForHost(context, "/app/invoices")).toEqual({
      type: "REWRITE",
      pathname: "/invoices",
    });
  });

  it("supports /app URLs during localhost development", () => {
    const context = classifyTenantHost("localhost:3000");

    expect(routeForHost(context, "/app/dashboard")).toEqual({
      type: "REWRITE",
      pathname: "/dashboard",
    });
    expect(routeForHost(context, "/")).toEqual({ type: "NEXT" });
  });

  it("rejects deeper unknown Ondar hosts instead of guessing a tenant", () => {
    const context = classifyTenantHost("foo.bar.getondar.com");

    expect(routeForHost(context, "/")).toEqual({ type: "NOT_FOUND" });
  });

  it("leaves apex marketing and external hosts unchanged", () => {
    expect(routeForHost(classifyTenantHost("getondar.com"), "/")).toEqual({
      type: "NEXT",
    });
    expect(routeForHost(classifyTenantHost("example.com"), "/")).toEqual({
      type: "NEXT",
    });
  });
});
