import { describe, expect, it } from "vitest";

import {
  publicInvoicePaymentOptionsSchema,
  publicInvoicePaymentSessionSchema,
  publicInvoiceFeePreviewSchema,
  publicInvoiceCheckoutStatusSchema,
} from "@/features/public/schema";

describe("IPACK-UI-002 public PSP choice contracts", () => {
  it("keeps two distinct accounts of the same processor", () => {
    const options = publicInvoicePaymentOptionsSchema.parse({
      invoice_number: "INV-100",
      currency: "NGN",
      checkout_enabled: false,
      options: [
        {
          provider_key: "paystack",
          provider_name: "Paystack",
          connection_id: "IPC-PS-ONE",
          is_preferred: true,
          readiness: "CERTIFICATION_PENDING",
          checkout_enabled: false,
        },
        {
          provider_key: "paystack",
          provider_name: "Paystack",
          connection_id: "IPC-PS-TWO",
          is_preferred: true,
          readiness: "CERTIFICATION_PENDING",
          checkout_enabled: false,
        },
        {
          provider_key: "monnify",
          provider_name: "Monnify",
          connection_id: "IPC-MON-ONE",
          is_preferred: false,
          readiness: "CERTIFICATION_PENDING",
          checkout_enabled: false,
        },
      ],
    });
    expect(options.options).toHaveLength(3);
    expect(options.options.filter((x) => x.provider_key === "paystack")).toHaveLength(2);
    expect(options.checkout_enabled).toBe(false);
    expect(options.options.every((x) => x.checkout_enabled === false)).toBe(true);
  });

  it("does not treat a merely selected PSP as checkout-authorized", () => {
    const session = publicInvoicePaymentSessionSchema.parse({
      state: "CHOOSING",
      version: 2,
      selected_provider: "paystack",
      selected_connection_id: "IPC-PS-ONE",
      checkout_enabled: false,
      fee_quote_available: false,
    });
    expect(session.selected_provider).toBe("paystack");
    expect(session.checkout_enabled).toBe(false);
  });

  it("requires exact server-provided fee fingerprint and total", () => {
    const preview = publicInvoiceFeePreviewSchema.parse({
      choice_version: 2,
      provider_key: "paystack",
      connection_id: "IPC-PS-ONE",
      currency: "NGN",
      invoice_amount: "500.00",
      provider_fee: "20.00",
      ondar_fee: "5.00",
      buyer_fee: "25.00",
      merchant_fee: "0.00",
      buyer_total: "525.00",
      fee_payer: "BUYER",
      quote_valid_until: "2026-10-18T12:00:00+01:00",
      terms_sha256: "a".repeat(64),
      checkout_enabled: false,
      fee_quote_available: true,
      is_frozen: false,
    });
    expect(preview.buyer_total).toBe("525.00");
    expect(preview.checkout_enabled).toBe(false);
    expect(publicInvoiceFeePreviewSchema.safeParse({
      ...preview,
      terms_sha256: "not-a-real-fee-fingerprint",
    }).success).toBe(false);
  });
});


describe("IPACK-UI-002B merchant PSP checkout progress", () => {
  it("never treats a ready hosted checkout as confirmed payment", () => {
    const state = publicInvoiceCheckoutStatusSchema.parse({
      state: "CHECKOUT_PREPARED",
      provider_key: "paystack",
      checkout_enabled: false,
      redirect_available: false,
      payment_confirmed: false,
    });
    expect(state.payment_confirmed).toBe(false);
  });

  it("refuses a redirect unless explicitly allowed for prepared checkout", () => {
    const base = {
      state: "CHECKOUT_PREPARED",
      provider_key: "monnify",
      checkout_enabled: false,
      redirect_available: true,
      payment_confirmed: false,
    };
    expect(publicInvoiceCheckoutStatusSchema.safeParse(base).success).toBe(false);
    expect(publicInvoiceCheckoutStatusSchema.safeParse({
      ...base, checkout_enabled: true,
    }).success).toBe(true);
    expect(publicInvoiceCheckoutStatusSchema.safeParse({
      ...base, checkout_enabled: true, state: "REVIEW_REQUIRED",
    }).success).toBe(false);
  });

  it("forbids payment confirmation from a PSP redirect alone", () => {
    const base = {
      state: "INITIATION_IN_PROGRESS",
      provider_key: "paystack",
      checkout_enabled: false,
      redirect_available: false,
      payment_confirmed: true,
    };
    expect(publicInvoiceCheckoutStatusSchema.safeParse(base).success).toBe(false);
    expect(publicInvoiceCheckoutStatusSchema.safeParse({
      ...base, state: "PAYMENT_CONFIRMED",
    }).success).toBe(true);
  });

  it("rejects provider references and sensitive checkout details", () => {
    const base = {
      state: "REVIEW_REQUIRED",
      provider_key: null,
      checkout_enabled: false,
      redirect_available: false,
      payment_confirmed: false,
    };
    expect(publicInvoiceCheckoutStatusSchema.safeParse({
      ...base, merchant_secret: "should-never-render",
    }).success).toBe(false);
    expect(publicInvoiceCheckoutStatusSchema.safeParse({
      ...base, provider_reference: "not-public",
    }).success).toBe(false);
    expect(publicInvoiceCheckoutStatusSchema.safeParse({
      ...base, checkout_url: "https://example.invalid",
    }).success).toBe(false);
  });
});
