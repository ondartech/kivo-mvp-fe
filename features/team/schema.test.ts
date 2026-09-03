import { describe, expect, it } from "vitest";
import { inviteSchema } from "./schema";

describe("inviteSchema (mirrors BE InviteReq extra=forbid)", () => {
  it("accepts email + ADMIN|MEMBER", () => {
    expect(inviteSchema.parse({ email: "ada@acme.ng", role: "MEMBER" })).toEqual({
      email: "ada@acme.ng",
      role: "MEMBER",
    });
  });

  it("rejects bad email and OWNER role", () => {
    expect(() => inviteSchema.parse({ email: "nope", role: "MEMBER" })).toThrow();
    expect(() => inviteSchema.parse({ email: "ada@acme.ng", role: "OWNER" })).toThrow();
  });

  it("rejects unknown fields (strict, like extra=forbid)", () => {
    expect(() =>
      inviteSchema.parse({ email: "ada@acme.ng", role: "MEMBER", team_id: "t1" })
    ).toThrow();
  });
});
