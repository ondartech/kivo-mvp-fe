import { describe, expect, it } from "vitest";

import { buildHostedPaymentApiUrl } from "@/app/(public)/pay/[token]/route";

describe("public pay bridge", () => {
  it("routes the vanity browser path to the backend hosted-pay endpoint", () => {
    expect(
      buildHostedPaymentApiUrl("token-123", "https://api.getondar.com"),
    ).toBe(
      "https://api.getondar.com/api/v1/pay/token-123",
    );
  });

  it("escapes the token as a single path segment", () => {
    expect(
      buildHostedPaymentApiUrl("token/with space", "https://api.getondar.com"),
    ).toBe(
      "https://api.getondar.com/api/v1/pay/token%2Fwith%20space",
    );
  });
});
