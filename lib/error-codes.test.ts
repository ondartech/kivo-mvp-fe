import { describe, it, expect } from "vitest";
import { mapErrorCode, extractErrorDetails, ERROR_MAPPINGS } from "@/lib/error-codes";

describe("error-codes", () => {
  it("maps known domain error codes accurately", () => {
    const notFound = mapErrorCode("INVOICE_NOT_FOUND");
    expect(notFound.status).toBe(404);
    expect(notFound.title).toBe("Invoice Not Found");
    expect(notFound.category).toBe("not_found");
    expect(notFound.retryable).toBe(false);

    const immutable = mapErrorCode("INVOICE_IMMUTABLE");
    expect(immutable.status).toBe(409);
    expect(immutable.category).toBe("conflict");
    expect(immutable.description).toContain("void this invoice");

    const rateLimited = mapErrorCode("RATE_LIMITED");
    expect(rateLimited.status).toBe(429);
    expect(rateLimited.category).toBe("rate_limited");
    expect(rateLimited.retryable).toBe(true);
  });

  it("falls back gracefully by HTTP status code when code is missing", () => {
    const mapped401 = mapErrorCode(undefined, 401);
    expect(mapped401.category).toBe("auth");
    expect(mapped401.status).toBe(401);

    const mapped403 = mapErrorCode(undefined, 403);
    expect(mapped403.category).toBe("forbidden");
    expect(mapped403.status).toBe(403);

    const mapped404 = mapErrorCode(undefined, 404);
    expect(mapped404.category).toBe("not_found");
    expect(mapped404.status).toBe(404);

    const mapped500 = mapErrorCode(undefined, 500);
    expect(mapped500.category).toBe("server");
    expect(mapped500.status).toBe(500);
  });

  it("extracts details cleanly from Error objects with request ID", () => {
    const errorWithDigest = new Error("Something broke");
    (errorWithDigest as unknown as { digest: string }).digest = "req-uuid-789";

    const extracted = extractErrorDetails(errorWithDigest);
    expect(extracted.message).toBe("Something broke");
    expect(extracted.requestId).toBe("req-uuid-789");
  });

  it("extracts code and request ID from API error envelope", () => {
    const apiError = {
      error: {
        code: "ORGANIZATION_NOT_FOUND",
        message: "Organization not found",
        request_id: "req-01HXYZ",
      },
      status: 404,
    };

    const extracted = extractErrorDetails(apiError);
    expect(extracted.code).toBe("ORGANIZATION_NOT_FOUND");
    expect(extracted.requestId).toBe("req-01HXYZ");
    expect(extracted.status).toBe(404);
  });

  it("ensures all mapped error codes have valid non-empty descriptions", () => {
    for (const [, mapping] of Object.entries(ERROR_MAPPINGS)) {
      expect(mapping.title).toBeTruthy();
      expect(mapping.description).toBeTruthy();
      expect(mapping.status).toBeGreaterThanOrEqual(400);
      expect(mapping.category).toBeTruthy();
    }
  });
});
