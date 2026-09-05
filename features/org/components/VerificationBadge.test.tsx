import { describe, expect, it } from "vitest";
import { verificationTone } from "./VerificationBadge";

describe("VerificationBadge tone mapping (DESIGN-TOKENS financial)", () => {
  it("maps VERIFIED MATCH to success", () => {
    expect(verificationTone("VERIFIED", "MATCH")).toBe("success");
  });
  it("maps VERIFIED CLOSE_MATCH to warning", () => {
    expect(verificationTone("VERIFIED", "CLOSE_MATCH")).toBe("warning");
  });
  it("maps MISMATCH to critical", () => {
    expect(verificationTone("MISMATCH", "MISMATCH")).toBe("critical");
    expect(verificationTone("MISMATCH", null)).toBe("critical");
  });
  it("maps UNVERIFIED to neutral", () => {
    expect(verificationTone("UNVERIFIED", null)).toBe("neutral");
  });
});
