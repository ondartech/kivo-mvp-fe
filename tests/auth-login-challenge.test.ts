import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api-client", () => ({
  fetchWithAuth: vi.fn(),
}));

import { fetchWithAuth } from "@/lib/api-client";
import {
  AuthApiError,
  completeLoginChallenge,
  startLoginChallenge,
  type LoginChallengeStart,
} from "@/features/auth/api";

const mockFetch = vi.mocked(fetchWithAuth);

const ticket: LoginChallengeStart = {
  challenge_token: "signed-ticket-example",
  attempt_id: "0123456789abcdef0123456789abcdef",
  provider: "turnstile",
  site_key: "public-site-key",
  expires_in: 180,
};

describe("AUTH-RES-006 challenge API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("issues an attempt bound to the submitted email without credentials", async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify(ticket), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    const issued = await startLoginChallenge("first@example.com");
    expect(issued).toEqual(ticket);
    expect(mockFetch).toHaveBeenCalledOnce();
    const [url, options] = mockFetch.mock.calls[0];
    expect(String(url)).toContain("/api/v1/auth/admission/challenge/start");
    expect(options?.method).toBe("POST");
    expect(JSON.parse(String(options?.body))).toEqual({
      email: "first@example.com",
    });
    expect(String(options?.body)).not.toContain("password");
  });

  it("sends only issued ticket plus provider token and receives admission proof", async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ login_proof: "signed-proof", expires_in: 90 }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    const response = await completeLoginChallenge(
      "first@example.com",
      ticket,
      "provider-attestation",
    );
    expect(response.login_proof).toBe("signed-proof");
    const [url, options] = mockFetch.mock.calls[0];
    expect(String(url)).toContain("/api/v1/auth/admission/challenge/complete");
    expect(JSON.parse(String(options?.body))).toEqual({
      email: "first@example.com",
      challenge_token: "signed-ticket-example",
      provider_token: "provider-attestation",
    });
  });

  it("preserves typed unavailable / rate-limited error codes", async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          error: {
            code: "LOGIN_CHALLENGE_UNAVAILABLE",
            message: "Challenge provider unavailable",
          },
        }),
        { status: 503, headers: { "Content-Type": "application/json" } },
      ),
    );
    await expect(startLoginChallenge("first@example.com")).rejects.toMatchObject({
      name: "AuthApiError",
      code: "LOGIN_CHALLENGE_UNAVAILABLE",
      status: 503,
    } satisfies Partial<AuthApiError>);

    mockFetch.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          error: { code: "RATE_LIMITED", message: "Challenge quota exceeded" },
        }),
        { status: 429, headers: { "Content-Type": "application/json" } },
      ),
    );
    await expect(startLoginChallenge("first@example.com")).rejects.toMatchObject({
      code: "RATE_LIMITED",
      status: 429,
    });
  });
});
