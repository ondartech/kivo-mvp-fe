/**
 * Authoritative Backend Error Code Mapping for Kivo Frontend
 * Source: kivo-docs/build/API_CONTRACTS.md (Appendix A) & FRONTEND_SPEC.md (§0.3)
 */

export interface ApiErrorPayload {
  error?: {
    code?: string;
    message?: string;
    details?: Record<string, unknown>;
    request_id?: string;
    correlation_id?: string;
  };
}

export type ErrorCategory =
  | "auth"
  | "forbidden"
  | "not_found"
  | "conflict"
  | "rate_limited"
  | "server"
  | "provider"
  | "validation";

export interface MappedError {
  code: string;
  title: string;
  description: string;
  status: number;
  category: ErrorCategory;
  retryable: boolean;
  actionHint?: string;
}

export const ERROR_MAPPINGS: Record<string, Omit<MappedError, "code">> = {
  // 401 Authentication
  AUTH_REQUIRED: {
    status: 401,
    title: "Authentication Required",
    description: "Please log in to your account to continue.",
    category: "auth",
    retryable: false,
    actionHint: "Log in",
  },
  INVALID_CREDENTIALS: {
    status: 401,
    title: "Invalid Credentials",
    description: "Email or password is incorrect. Please check your details and try again.",
    category: "auth",
    retryable: true,
  },
  INVALID_TOKEN: {
    status: 401,
    title: "Invalid Session",
    description: "Your session token is invalid or has expired. Please sign in again.",
    category: "auth",
    retryable: false,
    actionHint: "Log in",
  },

  // 403 Authorization & Entitlements
  // Security.md:9 & FRONTEND_SPEC.md:0.3 — never distinguish 403 vs 404 for cross-tenant data
  FORBIDDEN: {
    status: 403,
    title: "Access Restricted",
    description: "You don't have access to this workspace or resource.",
    category: "forbidden",
    retryable: false,
    actionHint: "Contact workspace owner",
  },
  TENANT_FORBIDDEN: {
    status: 403,
    title: "Access Restricted",
    description: "You don't have permission to access this organization's data.",
    category: "forbidden",
    retryable: false,
    actionHint: "Switch workspace",
  },
  ENTITLEMENT_LIMIT_REACHED: {
    status: 403,
    title: "Limit Reached",
    description: "You have reached your plan limit for this billing period.",
    category: "forbidden",
    retryable: false,
    actionHint: "Upgrade plan",
  },
  ENTITLEMENT_REQUIRED: {
    status: 403,
    title: "Plan Upgrade Required",
    description: "This feature is not included in your current subscription plan.",
    category: "forbidden",
    retryable: false,
    actionHint: "View plans",
  },

  // 404 Not Found (Cross-tenant resources return 404)
  ORGANIZATION_NOT_FOUND: {
    status: 404,
    title: "Workspace Not Found",
    description: "This workspace does not exist or you are not an active member.",
    category: "not_found",
    retryable: false,
    actionHint: "Switch workspace",
  },
  INVOICE_NOT_FOUND: {
    status: 404,
    title: "Invoice Not Found",
    description: "The requested invoice does not exist in this workspace.",
    category: "not_found",
    retryable: false,
    actionHint: "Back to invoices",
  },
  CUSTOMER_NOT_FOUND: {
    status: 404,
    title: "Customer Not Found",
    description: "The requested customer profile does not exist in this workspace.",
    category: "not_found",
    retryable: false,
    actionHint: "Back to customers",
  },
  PAYMENT_NOT_FOUND: {
    status: 404,
    title: "Payment Not Found",
    description: "The requested payment record could not be found.",
    category: "not_found",
    retryable: false,
    actionHint: "Back to payments",
  },
  NOT_FOUND: {
    status: 404,
    title: "Page or Resource Not Found",
    description: "The page or resource you are looking for does not exist.",
    category: "not_found",
    retryable: false,
    actionHint: "Back to dashboard",
  },

  // 409 Domain & Financial Invariants
  INVOICE_IMMUTABLE: {
    status: 409,
    title: "Invoice is Immutable",
    description: "Issued invoices cannot be edited. You can void this invoice and create a replacement.",
    category: "conflict",
    retryable: false,
    actionHint: "Void and replace",
  },
  INVOICE_NOT_DRAFT: {
    status: 409,
    title: "Invoice Already Issued",
    description: "Only draft invoices can be edited or modified.",
    category: "conflict",
    retryable: false,
  },
  INVOICE_ALREADY_VOID: {
    status: 409,
    title: "Invoice Already Voided",
    description: "This invoice has already been marked as void.",
    category: "conflict",
    retryable: false,
  },
  INVOICE_HAS_ALLOCATIONS: {
    status: 409,
    title: "Invoice Has Paid Allocations",
    description: "Invoices with recorded payments cannot be voided directly.",
    category: "conflict",
    retryable: false,
  },
  INVOICE_PAID_CANNOT_BE_VOIDED: {
    status: 409,
    title: "Paid Invoice Cannot be Voided",
    description: "This invoice is fully or partially paid and cannot be cancelled directly.",
    category: "conflict",
    retryable: false,
  },
  CUSTOMER_ARCHIVED: {
    status: 409,
    title: "Customer is Archived",
    description: "Cannot create new invoices for an archived customer. Restore the customer first.",
    category: "conflict",
    retryable: false,
    actionHint: "View customer",
  },
  ALLOCATION_EXCEEDS_INVOICE: {
    status: 409,
    title: "Allocation Exceeds Invoice Balance",
    description: "The payment amount exceeds the invoice's outstanding balance.",
    category: "conflict",
    retryable: true,
  },
  ALLOCATION_EXCEEDS_PAYMENT: {
    status: 409,
    title: "Allocation Exceeds Available Payment",
    description: "The allocated amount exceeds the total payment amount available.",
    category: "conflict",
    retryable: true,
  },
  IDEMPOTENCY_CONFLICT: {
    status: 409,
    title: "Duplicate Submission",
    description: "A transaction with this idempotency key is already being processed or completed.",
    category: "conflict",
    retryable: false,
  },
  SLUG_ALREADY_EXISTS: {
    status: 409,
    title: "Workspace URL Taken",
    description: "This workspace slug is already registered. Please choose a different URL.",
    category: "conflict",
    retryable: true,
  },
  EMAIL_ALREADY_EXISTS: {
    status: 409,
    title: "Email Already Registered",
    description: "An account with this email address already exists. Please sign in instead.",
    category: "conflict",
    retryable: false,
    actionHint: "Log in",
  },

  // 410 Expired / Revoked Tokens
  TOKEN_EXPIRED: {
    status: 410,
    title: "Link Expired",
    description: "This link has expired. Please request a new link from the sender.",
    category: "not_found",
    retryable: false,
    actionHint: "Request new link",
  },
  TOKEN_REVOKED: {
    status: 410,
    title: "Link Revoked",
    description: "This link was revoked by the sender and is no longer valid.",
    category: "not_found",
    retryable: false,
  },

  // 429 Rate Limiting
  RATE_LIMITED: {
    status: 429,
    title: "Too Many Requests",
    description: "You've exceeded the temporary rate limit. Please wait a moment before trying again.",
    category: "rate_limited",
    retryable: true,
  },

  // 500 Internal Error
  INTERNAL_ERROR: {
    status: 500,
    title: "Something Went Wrong",
    description: "We encountered an unexpected server issue. Please try again in a few moments.",
    category: "server",
    retryable: true,
    actionHint: "Retry",
  },

  // 502 / 503 Provider Issues
  PROVIDER_ERROR: {
    status: 502,
    title: "Payment Service Unavailable",
    description: "The payment provider is currently unreachable. Manual bank transfer details remain valid.",
    category: "provider",
    retryable: true,
  },
  PROVIDER_UNAVAILABLE: {
    status: 503,
    title: "Provider Temporarily Offline",
    description: "The verification or payment service is experiencing temporary downtime. Core invoicing remains active.",
    category: "provider",
    retryable: true,
  },
};

/**
 * Maps a backend error code or HTTP status code to structured user-facing copy.
 */
export function mapErrorCode(
  code?: string,
  status?: number,
  fallbackMessage?: string
): MappedError {
  if (code && ERROR_MAPPINGS[code]) {
    return {
      code,
      ...ERROR_MAPPINGS[code],
    };
  }

  // Fallback by HTTP status code
  if (status === 401) return { code: "AUTH_REQUIRED", ...ERROR_MAPPINGS.AUTH_REQUIRED };
  if (status === 403) return { code: "FORBIDDEN", ...ERROR_MAPPINGS.FORBIDDEN };
  if (status === 404) return { code: "NOT_FOUND", ...ERROR_MAPPINGS.NOT_FOUND };
  if (status === 409) return { code: "CONFLICT", status: 409, title: "Action Conflict", description: fallbackMessage || "The requested operation violates a domain invariant.", category: "conflict", retryable: false };
  if (status === 410) return { code: "TOKEN_EXPIRED", ...ERROR_MAPPINGS.TOKEN_EXPIRED };
  if (status === 429) return { code: "RATE_LIMITED", ...ERROR_MAPPINGS.RATE_LIMITED };
  if (status === 502) return { code: "PROVIDER_ERROR", ...ERROR_MAPPINGS.PROVIDER_ERROR };
  if (status === 503) return { code: "PROVIDER_UNAVAILABLE", ...ERROR_MAPPINGS.PROVIDER_UNAVAILABLE };

  // Default 500 internal error
  return {
    code: code || "INTERNAL_ERROR",
    title: ERROR_MAPPINGS.INTERNAL_ERROR.title,
    description: fallbackMessage || ERROR_MAPPINGS.INTERNAL_ERROR.description,
    status: status || 500,
    category: "server",
    retryable: true,
    actionHint: "Retry",
  };
}

/**
 * Extract error code, request_id, and message from unknown error objects safely.
 * Strictly avoids logging or exposing raw stack traces.
 */
export function extractErrorDetails(error: unknown): {
  code?: string;
  message: string;
  requestId?: string;
  correlationId?: string;
  status?: number;
} {
  if (!error) {
    return { message: "An unexpected error occurred." };
  }

  // Check for Next.js App Router error digest or custom fields
  const errObj = error as Record<string, unknown>;
  const nestedError =
    typeof errObj.error === "object" && errObj.error !== null
      ? (errObj.error as Record<string, unknown>)
      : undefined;

  const requestId =
    (typeof errObj.requestId === "string" ? errObj.requestId : undefined) ||
    (typeof errObj.request_id === "string" ? errObj.request_id : undefined) ||
    (typeof nestedError?.request_id === "string" ? nestedError.request_id : undefined) ||
    (typeof nestedError?.requestId === "string" ? nestedError.requestId : undefined) ||
    (typeof errObj.digest === "string" ? errObj.digest : undefined);

  const correlationId =
    (typeof errObj.correlation_id === "string" ? errObj.correlation_id : undefined) ||
    (typeof nestedError?.correlation_id === "string" ? nestedError.correlation_id : undefined);

  const code =
    typeof errObj.code === "string"
      ? errObj.code
      : typeof (errObj.error as Record<string, unknown>)?.code === "string"
        ? ((errObj.error as Record<string, unknown>).code as string)
        : undefined;

  const status =
    typeof errObj.status === "number"
      ? errObj.status
      : typeof errObj.statusCode === "number"
        ? errObj.statusCode
        : undefined;

  let message = "An unexpected error occurred.";
  if (typeof errObj.message === "string" && errObj.message.trim()) {
    message = errObj.message;
  } else if (
    typeof (errObj.error as Record<string, unknown>)?.message === "string"
  ) {
    message = (errObj.error as Record<string, unknown>).message as string;
  }

  return { code, message, requestId, correlationId, status };
}
