import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  clearOAuthTransaction,
  loadOAuthTransaction,
  rememberOAuthTransaction,
  type OAuthTransaction,
} from "@/features/auth/api";

class MemoryStorage {
  private values = new Map<string, string>();

  getItem(key: string) {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string) {
    this.values.set(key, String(value));
  }

  removeItem(key: string) {
    this.values.delete(key);
  }

  clear() {
    this.values.clear();
  }
}

describe("OAuth transaction storage", () => {
  beforeEach(() => {
    vi.stubGlobal("sessionStorage", new MemoryStorage());
  });

  it("keeps Google and Microsoft verifier state isolated by returned state", () => {
    const google: OAuthTransaction = {
      provider: "google",
      state: "google-state",
      codeVerifier: "google-verifier",
      redirectUri: "https://app.getondar.com/auth/callback",
    };
    const microsoft: OAuthTransaction = {
      provider: "microsoft",
      state: "microsoft-state",
      codeVerifier: "microsoft-verifier",
    };

    rememberOAuthTransaction(google);
    rememberOAuthTransaction(microsoft);

    expect(loadOAuthTransaction("google-state")).toEqual(google);
    expect(loadOAuthTransaction("microsoft-state")).toEqual(microsoft);
  });

  it("rejects an index/provider mismatch instead of mixing provider state", () => {
    rememberOAuthTransaction({
      provider: "google",
      state: "shared-state",
      codeVerifier: "google-verifier",
    });

    sessionStorage.setItem("ondar_oauth_index:shared-state", "microsoft");

    expect(loadOAuthTransaction("shared-state")).toBeNull();
  });

  it("rejects unknown state and clears completed transactions", () => {
    const transaction: OAuthTransaction = {
      provider: "microsoft",
      state: "known-state",
      codeVerifier: "known-verifier",
    };

    rememberOAuthTransaction(transaction);
    expect(loadOAuthTransaction("missing-state")).toBeNull();

    clearOAuthTransaction(transaction);
    expect(loadOAuthTransaction("known-state")).toBeNull();
  });
});
