"use client";

import { fetchWithAuth } from "@/lib/api-client";
import { env } from "@/lib/env";

const API = env.NEXT_PUBLIC_API_URL.replace(/\/$/, "");

export type OAuthProvider = "google" | "microsoft";
export type OAuthStartRes = {
  authorization_url: string;
  state: string;
  code_verifier: string;
};

export type LoginRes = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  user: { id: string; email: string };
  memberships: Array<{ organization_id: string; role: string; status: string }>;
};

export type AuthMethod = {
  method: "PASSWORD" | "GOOGLE" | "MICROSOFT";
  connected: boolean;
  identifier?: string | null;
  last_used_at?: string | null;
  can_disconnect: boolean;
};

export type OAuthTransaction = {
  provider: OAuthProvider;
  state: string;
  codeVerifier: string;
  redirectUri?: string;
};

export class AuthApiError extends Error {
  code?: string;
  status: number;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "AuthApiError";
    this.status = status;
    this.code = code;
  }
}

async function parseAuthError(res: Response, fallback: string): Promise<AuthApiError> {
  const body = await res.json().catch(() => ({}));
  return new AuthApiError(
    body?.error?.message || fallback,
    res.status,
    body?.error?.code,
  );
}

async function requestJson<T>(
  url: string,
  init: RequestInit,
  fallback: string,
): Promise<T> {
  const res = await fetchWithAuth(url, init);
  if (!res.ok) throw await parseAuthError(res, fallback);
  return res.json() as Promise<T>;
}

function oauthIndexKey(state: string) {
  return `ondar_oauth_index:${state}`;
}

function oauthTransactionKey(provider: OAuthProvider, state: string) {
  return `ondar_oauth:${provider}:${state}`;
}

export function rememberOAuthTransaction(transaction: OAuthTransaction) {
  sessionStorage.setItem(oauthIndexKey(transaction.state), transaction.provider);
  sessionStorage.setItem(
    oauthTransactionKey(transaction.provider, transaction.state),
    JSON.stringify(transaction),
  );
}

export function loadOAuthTransaction(state: string): OAuthTransaction | null {
  const provider = sessionStorage.getItem(oauthIndexKey(state));
  if (provider !== "google" && provider !== "microsoft") return null;

  const raw = sessionStorage.getItem(oauthTransactionKey(provider, state));
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as OAuthTransaction;
    if (
      parsed.provider !== provider ||
      parsed.state !== state ||
      !parsed.codeVerifier
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function clearOAuthTransaction(transaction: OAuthTransaction) {
  sessionStorage.removeItem(oauthIndexKey(transaction.state));
  sessionStorage.removeItem(
    oauthTransactionKey(transaction.provider, transaction.state),
  );
}

export async function startOAuth(
  provider: OAuthProvider,
  redirectUri?: string,
): Promise<OAuthStartRes> {
  const url = new URL(`${API}/api/v1/auth/${provider}/start`);
  if (provider === "google" && redirectUri) {
    url.searchParams.set("redirect_uri", redirectUri);
  }

  return requestJson<OAuthStartRes>(
    url.toString(),
    { method: "GET" },
    `Failed to start ${provider === "google" ? "Google" : "Microsoft"} sign-in`,
  );
}

export async function beginOAuth(
  provider: OAuthProvider,
  redirectUri = `${window.location.origin}/auth/callback`,
): Promise<string> {
  const start = await startOAuth(provider, redirectUri);
  rememberOAuthTransaction({
    provider,
    state: start.state,
    codeVerifier: start.code_verifier,
    redirectUri: provider === "google" ? redirectUri : undefined,
  });
  return start.authorization_url;
}

export async function exchangeOAuthCode(
  transaction: OAuthTransaction,
  code: string,
): Promise<LoginRes> {
  const body =
    transaction.provider === "google"
      ? {
          code,
          state: transaction.state,
          code_verifier: transaction.codeVerifier,
          redirect_uri: transaction.redirectUri,
        }
      : {
          code,
          state: transaction.state,
          code_verifier: transaction.codeVerifier,
        };

  return requestJson<LoginRes>(
    `${API}/api/v1/auth/${transaction.provider}/exchange`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
    `${transaction.provider === "google" ? "Google" : "Microsoft"} sign-in failed`,
  );
}

// Compatibility exports for existing callers while auth surfaces move to the
// provider-neutral transaction helpers.
export const startGoogleOAuth = (redirectUri?: string) =>
  startOAuth("google", redirectUri);

export async function exchangeGoogleCode(params: {
  code: string;
  state: string;
  code_verifier?: string;
  redirect_uri?: string;
}): Promise<LoginRes> {
  if (!params.code_verifier) {
    throw new AuthApiError("Missing Google PKCE verifier", 400, "OAUTH_STATE_INVALID");
  }
  return exchangeOAuthCode(
    {
      provider: "google",
      state: params.state,
      codeVerifier: params.code_verifier,
      redirectUri: params.redirect_uri,
    },
    params.code,
  );
}

export const startMicrosoftOAuth = () => startOAuth("microsoft");

export async function exchangeMicrosoftCode(params: {
  code: string;
  state: string;
  code_verifier: string;
}): Promise<LoginRes> {
  return exchangeOAuthCode(
    {
      provider: "microsoft",
      state: params.state,
      codeVerifier: params.code_verifier,
    },
    params.code,
  );
}

export async function listAuthMethods(): Promise<{ methods: AuthMethod[] }> {
  return requestJson<{ methods: AuthMethod[] }>(
    `${API}/api/v1/auth/methods`,
    { method: "GET" },
    "Failed to load authentication methods",
  );
}

export async function linkGoogleAccount(params: {
  password: string;
  code: string;
  state: string;
  code_verifier?: string;
  redirect_uri?: string;
}): Promise<{ message: string }> {
  return requestJson<{ message: string }>(
    `${API}/api/v1/auth/google/link`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    },
    "Failed to link Google account",
  );
}

export async function unlinkGoogleAccount(): Promise<{ message: string }> {
  return requestJson<{ message: string }>(
    `${API}/api/v1/auth/google/unlink`,
    { method: "DELETE" },
    "Failed to unlink Google account",
  );
}

export async function unlinkMicrosoftAccount(): Promise<{ message: string }> {
  return requestJson<{ message: string }>(
    `${API}/api/v1/auth/microsoft/unlink`,
    { method: "DELETE" },
    "Failed to unlink Microsoft account",
  );
}
