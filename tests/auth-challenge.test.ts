import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/env", () => ({
  env: { NEXT_PUBLIC_API_URL: "https://api.getondar.com" },
}));
vi.mock("@/lib/api-client", () => ({ fetchWithAuth: vi.fn() }));

import { fetchWithAuth } from "@/lib/api-client";
import {
  completeLoginChallenge,
  startLoginChallenge,
  type LoginChallengeStart,
} from "@/features/auth/api";

const mockedFetch = vi.mocked(fetchWithAuth);
const ticket: LoginChallengeStart = {
  challenge_token: "signed-ticket-placeholder",
  attempt_id: "0123456789abcdef0123456789abcdef",
  site_key: "public-sitekey",
  provider: "turnstile",
  expires_in: 180,
};

describe("AUTH-RES-006 first-time login admission challenge", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("issues a challenge without a password and receives a server attempt", async () => {
    mockedFetch.mockResolvedValue({
      ok: true,
      json: async () => ticket,
    } as Response);
    const result = await startLoginChallenge("member@example.com");
    expect(result).toEqual(ticket);
    const [url, init] = mockedFetch.mock.calls[0];
    expect(url).toBe("https://api.getondar.com/api/v1/auth/admission/challenge/start");
    expect(init?.method).toBe("POST");
    expect(JSON.parse(String(init?.body))).toEqual({ email: "member@example.com" });
    expect(String(init?.body)).not.toContain("password");
  });

  it("redeems the provider token only through the backend", async () => {
    mockedFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ login_proof: "single-use-proof", expires_in: 90 }),
    } as Response);
    const outcome = await completeLoginChallenge(
      "member@example.com", ticket, "provider-attestation"
    );
    expect(outcome.login_proof).toBe("single-use-proof");
    const [url, init] = mockedFetch.mock.calls[0];
    expect(url).toBe("https://api.getondar.com/api/v1/auth/admission/challenge/complete");
    expect(JSON.parse(String(init?.body))).toEqual({
      email: "member@example.com",
      challenge_token: ticket.challenge_token,
      provider_token: "provider-attestation",
    });
  });
});
