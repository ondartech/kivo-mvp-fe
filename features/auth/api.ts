"use client";

import { fetchWithAuth } from "@/lib/api-client";
import { env } from "@/lib/env";

const API = env.NEXT_PUBLIC_API_URL.replace(/\/$/, "");

export type GoogleStartRes = { authorization_url: string; state: string; code_verifier: string };
export type LoginRes = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  user: { id: string; email: string };
  memberships: Array<{ organization_id: string; role: string; status: string }>;
};

export async function startGoogleOAuth(redirectUri?: string): Promise<GoogleStartRes> {
  const url = new URL(`${API}/api/v1/auth/google/start`);
  if (redirectUri) url.searchParams.set("redirect_uri", redirectUri);
  const res = await fetchWithAuth(url.toString(), { method: "GET" });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error?.message || "Failed to start Google OAuth");
  }
  return res.json();
}

export async function exchangeGoogleCode(params: {
  code: string;
  state: string;
  code_verifier?: string;
  redirect_uri?: string;
}): Promise<LoginRes> {
  const res = await fetchWithAuth(`${API}/api/v1/auth/google/exchange`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error?.message || "Google exchange failed");
  }
  return res.json();
}

export async function linkGoogleAccount(params: {
  password: string;
  code: string;
  state: string;
  code_verifier?: string;
  redirect_uri?: string;
}): Promise<{ message: string }> {
  const res = await fetchWithAuth(`${API}/api/v1/auth/google/link`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error?.message || "Failed to link Google account");
  }
  return res.json();
}

export async function unlinkGoogleAccount(): Promise<{ message: string }> {
  const res = await fetchWithAuth(`${API}/api/v1/auth/google/unlink`, { method: "DELETE" });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error?.message || "Failed to unlink Google account");
  }
  return res.json();
}
