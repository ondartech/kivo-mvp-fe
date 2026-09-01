/** Single fetch boundary — adds X-Request-Id + X-Correlation-Id + Idempotency-Key + Decimal string handling
 *  KIV-FE-001: ApiClient injects Authorization + X-Request-Id + X-Correlation-Id + Idempotency-Key per mutating features
 *  Decimal string: money fields remain string via lib/money.ts display-only (never parseFloat)
 */
export async function fetchWithAuth(input: RequestInfo, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  const requestId = crypto.randomUUID();
  headers.set("X-Request-Id", requestId);
  headers.set("X-Correlation-Id", requestId);
  if (init.method && init.method !== "GET" && !headers.has("Idempotency-Key")) {
    headers.set("Idempotency-Key", crypto.randomUUID());
  }
  const token = typeof window !== "undefined" ? localStorage.getItem("token") ?? localStorage.getItem("access_token") : null;
  if (token) headers.set("Authorization", `Bearer ${token}`);
  return fetch(input, { ...init, headers });
}

export const ApiClient = { fetch: fetchWithAuth };
