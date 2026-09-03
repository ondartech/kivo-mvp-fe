import { describe, expect, it } from "vitest";
import {
  canChangeRole,
  canInvite,
  canSuspendRemove,
  roleBadge,
  statusBadge,
} from "./permissions";

describe("team permission gates (display-only; BE is authority)", () => {
  it("owner may invite, change roles, suspend and remove", () => {
    expect(canInvite("OWNER")).toBe(true);
    expect(canChangeRole("OWNER")).toBe(true);
    expect(canSuspendRemove("OWNER")).toBe(true);
  });

  it("admin may invite but not change roles or suspend/remove", () => {
    expect(canInvite("ADMIN")).toBe(true);
    expect(canChangeRole("ADMIN")).toBe(false);
    expect(canSuspendRemove("ADMIN")).toBe(false);
  });

  it("member sees a read-only table (AC: invite button hidden)", () => {
    expect(canInvite("MEMBER")).toBe(false);
    expect(canChangeRole("MEMBER")).toBe(false);
    expect(canSuspendRemove("MEMBER")).toBe(false);
  });

  it("unknown/undefined roles see read-only", () => {
    expect(canInvite(undefined)).toBe(false);
    expect(canChangeRole("STAFF")).toBe(false);
  });
});

describe("status badge mapping (PRD §12 lifecycle)", () => {
  it("maps BE invite PENDING to Invited", () => {
    expect(statusBadge("PENDING")).toEqual({ label: "Invited", variant: "warning" });
  });

  it("maps member lifecyclestates", () => {
    expect(statusBadge("ACTIVE").label).toBe("Active");
    expect(statusBadge("SUSPENDED").label).toBe("Suspended");
    expect(statusBadge("REMOVED").label).toBe("Removed");
    expect(statusBadge("REVOKED").label).toBe("Removed");
  });

  it("maps roles", () => {
    expect(roleBadge("OWNER").label).toBe("Owner");
    expect(roleBadge("ADMIN").label).toBe("Admin");
    expect(roleBadge("MEMBER").label).toBe("Member");
  });
});
