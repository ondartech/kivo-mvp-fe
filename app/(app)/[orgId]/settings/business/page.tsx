"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { PageHeader } from "@/components/kivo/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState, ErrorState } from "@/components/kivo/empty-state";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useMyMembership } from "@/features/team/api";
import {
  useBusinessProfile,
  useBusinessVerifications,
  useConfirmBusinessVerification,
  useLookupBusinessVerification,
  usePatchBusinessProfile,
  usePutBusinessProfile,
  type ApiError,
  type BusinessProfile,
  type BusinessVerification,
  type BusinessVerificationLookupOut,
} from "@/features/org/api";
import { businessProfileSchema, cacLookupSchema, type BusinessProfileInput, type CacLookupInput } from "@/features/org/schema";

// ── Helpers ───────────────────────────────────────────────────────────────────

function errCode(e: unknown): string | undefined {
  return (e as ApiError)?.code;
}
function errMessage(e: unknown, fallback: string): string {
  return e instanceof Error ? e.message : fallback;
}
function truncateHash(hash: string): string {
  if (!hash) return "—";
  return `${hash.slice(0, 8)}…${hash.slice(-6)}`;
}

function ProfileVerificationBadge({ status }: { status: string }) {
  // BusinessProfile.verification_status — profile-level (UNVERIFIED | VERIFIED | NOT_APPLICABLE)
  if (status === "VERIFIED") return <Badge variant="success">Verified</Badge>;
  if (status === "NOT_APPLICABLE") return <Badge variant="neutral">Not applicable</Badge>;
  return <Badge variant="neutral">Unverified</Badge>;
}

function AttemptStatusBadge({ status, lookup_result }: { status: string; lookup_result: string }) {
  // BusinessVerification.status — per-attempt lifecycle, separate from profile status
  if (status === "CONFIRMED") return <Badge variant="success">Confirmed</Badge>;
  if (status === "PENDING_CONFIRMATION") return <Badge variant="processing">Pending confirmation</Badge>;
  if (status === "EXPIRED") return <Badge variant="critical">Expired</Badge>;
  if (status === "SUPERSEDED") return <Badge variant="neutral">Superseded</Badge>;
  // fallback for older records where status may mirror lookup_result
  if (lookup_result === "FOUND") return <Badge variant="info">Found</Badge>;
  return <Badge variant="critical">Not found</Badge>;
}

function useExpiryCountdown(expiresAt: string | null): string | null {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!expiresAt) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [expiresAt]);
  if (!expiresAt) return null;
  const diff = new Date(expiresAt).getTime() - now;
  if (diff <= 0) return "Expired";
  const m = Math.floor(diff / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return `${m}:${String(s).padStart(2, "0")} left`;
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function BusinessIdentityPage() {
  const params = useParams<{ orgId: string }>();
  const orgId = params.orgId as string;

  const { role } = useMyMembership(orgId);
  const canMutate = role === "OWNER";
  // BE enforces org:write — ANY role reads, but only OWNER mutates (MVP)
  const profileQ = useBusinessProfile(orgId);
  const verificationsQ = useBusinessVerifications(orgId);
  const putMut = usePutBusinessProfile(orgId);
  const patchMut = usePatchBusinessProfile(orgId);
  const lookupMut = useLookupBusinessVerification(orgId);
  const confirmMut = useConfirmBusinessVerification(orgId);

  const [structureDraft, setStructureDraft] = useState<"UNREGISTERED" | "REGISTERED">("UNREGISTERED");
  const [lookupResult, setLookupResult] = useState<BusinessVerificationLookupOut | null>(null);
  const [lookupError, setLookupError] = useState<{ code?: string; message: string; status?: number } | null>(null);
  const [showEvidence, setShowEvidence] = useState<BusinessVerification | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const profile: BusinessProfile | null = profileQ.data ?? null;
  const verifications: BusinessVerification[] = verificationsQ.data ?? [];

  // Sync radio with fetched profile (but keep draft editable before save)
  useEffect(() => {
    if (profile?.business_structure) {
      setStructureDraft(profile.business_structure === "REGISTERED" ? "REGISTERED" : "UNREGISTERED");
    }
  }, [profile?.business_structure]);

  const profileForm = useForm<BusinessProfileInput>({
    resolver: zodResolver(businessProfileSchema),
    defaultValues: {
      legal_name: "",
      business_structure: "UNREGISTERED",
      trading_name: "",
      display_name: "",
      email: "",
      phone: "",
      website: "",
      tax_identifier: "",
      invoice_prefix: "INV-",
      default_currency: "NGN",
      logo_url: "",
      address: { line1: "", line2: "", city: "", state: "", postal_code: "", country_code: "NG" },
    },
  });

  // Hydrate form when profile loads
  useEffect(() => {
    if (profile) {
      profileForm.reset({
        legal_name: profile.legal_name ?? "",
        business_structure: (profile.business_structure as "UNREGISTERED" | "REGISTERED") ?? "UNREGISTERED",
        trading_name: profile.trading_name ?? "",
        display_name: profile.display_name ?? "",
        email: profile.email ?? "",
        phone: profile.phone ?? "",
        website: profile.website ?? "",
        tax_identifier: profile.tax_identifier ?? "",
        invoice_prefix: profile.invoice_prefix ?? "INV-",
        default_currency: profile.default_currency ?? "NGN",
        logo_url: profile.logo_url ?? "",
        address: {
          line1: profile.address?.line1 ?? "",
          line2: profile.address?.line2 ?? "",
          city: profile.address?.city ?? "",
          state: profile.address?.state ?? "",
          postal_code: profile.address?.postal_code ?? "",
          country_code: profile.address?.country_code ?? "NG",
        },
      });
    }
  }, [profile, profileForm]);

  const cacForm = useForm<CacLookupInput>({
    resolver: zodResolver(cacLookupSchema),
    defaultValues: { identifier_type: "RC", identifier: "" },
  });

  const onSaveProfile = async (values: BusinessProfileInput) => {
    // Business structure is explicit: radio state is source of truth, not stale form value
    const payload: BusinessProfileInput = { ...values, business_structure: structureDraft };
    try {
      await putMut.mutateAsync(payload);
      toast.success("Business profile saved.");
    } catch (e) {
      const code = errCode(e);
      if (code === "BUSINESS_PROFILE_NOT_FOUND") {
        // PUT creates; this should not happen, but map
        toast.error(errMessage(e, "Create profile failed."));
      } else {
        toast.error(errMessage(e, "Could not save business profile."));
      }
    }
  };

  const onLookup = async (values: CacLookupInput) => {
    setLookupResult(null);
    setLookupError(null);
    try {
      const res = await lookupMut.mutateAsync(values);
      setLookupResult(res);
      if (res.found) {
        toast.success(`Found — ${res.registered_name} (${res.registry_status ?? "—"})`);
      } else {
        toast.message("Not found — no matching RC/BN in CAC. Check the number or continue with manual entry.");
      }
    } catch (e) {
      const code = errCode(e);
      const status = (e as ApiError)?.status;
      const message = errMessage(e, "Lookup failed.");
      setLookupError({ code, message, status });
      if (code === "ENTITLEMENT_LIMIT_REACHED" || status === 403) {
        toast.error("CAC verification limit reached (5 this month). Upgrade or try next period.");
      } else if (code === "RATE_LIMITED" || status === 429) {
        toast.error(message || "Too many verification attempts — try again shortly.");
      } else if (code === "PROVIDER_UNAVAILABLE" || status === 503) {
        toast.error("Verification service temporarily unavailable — you can continue with manual entry and verify later.");
      } else if (code === "VALIDATION_ERROR") {
        toast.error(message);
      } else {
        toast.error(message);
      }
    }
  };

  const onConfirm = async (verificationId: string) => {
    setConfirmingId(verificationId);
    try {
      const res = await confirmMut.mutateAsync(verificationId);
      toast.success(`Verified — ${res.registration.registered_name} (${res.registration.registration_type} ${res.registration.registration_number})`);
      setLookupResult(null);
      cacForm.reset({ identifier_type: "RC", identifier: "" });
    } catch (e) {
      const code = errCode(e);
      if (code === "VERIFICATION_EXPIRED") toast.error("Lookup expired (30 min window) — start a new lookup.");
      else if (code === "LOOKUP_NOT_FOUND") toast.error("Cannot confirm — lookup was not found.");
      else if (code === "ALREADY_CONFIRMED") toast.error("Already confirmed.");
      else if (code === "VERIFICATION_EXPIRED_OR_SUPERSEDED") toast.error("Verification no longer valid — start a new lookup.");
      else if (code === "BUSINESS_PROFILE_NOT_FOUND") toast.error("Create a business profile before confirming.");
      else toast.error(errMessage(e, "Confirmation failed."));
    } finally {
      setConfirmingId(null);
    }
  };

  const onUseRegisteredName = async (registeredName: string | null) => {
    if (!registeredName) return;
    // Explicit user action — PATCH legal_name only, never silent overwrite
    if (!confirm(`Use registered name “${registeredName}” as your legal name?`)) return;
    try {
      await patchMut.mutateAsync({ legal_name: registeredName });
      toast.success("Legal name updated to registered name.");
    } catch (e) {
      toast.error(errMessage(e, "Could not update legal name."));
    }
  };

  const expiryLabel = useExpiryCountdown(lookupResult?.expires_at ?? null);
  const isExpired = expiryLabel === "Expired";
  const pendingVerification = useMemo(
    () => verifications.find((v) => v.status === "PENDING_CONFIRMATION") ?? null,
    [verifications],
  );
  const pendingCountdown = useExpiryCountdown(pendingVerification?.expires_at ?? null);

  // Loading
  if (profileQ.isLoading || verificationsQ.isLoading) {
    return (
      <div className="space-y-6 max-w-[880px]">
        <PageHeader title="Business Identity" description="Business identity used in invoices — name, address, logo. Frozen in snapshots after issue." />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-72 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  // Error — 404 business profile not yet created is NOT an error page; it's an empty state that shows form
  // Real errors: org not found / forbidden / provider
  if (profileQ.isError) {
    const code = errCode(profileQ.error);
    const msg = errMessage(profileQ.error, "Could not load business profile.");
    const status = (profileQ.error as ApiError)?.status;
    // 404 BUSINESS_PROFILE_NOT_FOUND — render form empty, not error
    if (code === "BUSINESS_PROFILE_NOT_FOUND" || status === 404) {
      // fall through to normal render with empty profile
    } else if (code === "ORGANIZATION_NOT_FOUND" || status === 404) {
      return (
        <div className="space-y-6 max-w-[880px]">
          <PageHeader title="Business Identity" />
          <ErrorState title="Workspace not found" description="This organization does not exist or you are not a member." />
        </div>
      );
    } else if (code === "FORBIDDEN" || status === 403) {
      return (
        <div className="space-y-6 max-w-[880px]">
          <PageHeader title="Business Identity" />
          <ErrorState title="You don’t have access" description={msg} retry={{ label: "Retry", onClick: () => profileQ.refetch() }} />
        </div>
      );
    } else {
      return (
        <div className="space-y-6 max-w-[880px]">
          <PageHeader title="Business Identity" />
          <ErrorState title="Could not load business identity" description={msg} retry={{ label: "Retry", onClick: () => profileQ.refetch() }} />
        </div>
      );
    }
  }

  const isRegisteredStructure = structureDraft === "REGISTERED";
  const verificationStatus = profile?.verification_status ?? "UNVERIFIED";
  const registration = profile?.registration ?? null;

  return (
    <div className="space-y-6 max-w-[880px]">
      <PageHeader
        title="Business Identity"
        description="Business identity used in invoices — name, address, logo. Frozen in snapshots after issue. Verification builds buyer trust on invoices and public views."
      />

      {/* Verification status summary — profile-level, separate from attempt lifecycle */}
      <Card>
        <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="space-y-1">
            <div className="text-sm font-medium">Verification</div>
            <p className="text-xs text-muted-foreground">
              {verificationStatus === "VERIFIED"
                ? "Your business name is verified against CAC."
                : verificationStatus === "NOT_APPLICABLE"
                  ? "Not applicable for unregistered businesses."
                  : "Unverified — verify your RC/BN with CAC to add trust to your invoices."}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <ProfileVerificationBadge status={verificationStatus} />
            {registration ? (
              <span className="text-xs text-muted-foreground hidden sm:inline">
                {registration.registration_type} {registration.registration_number} · {registration.registry_status ?? "—"}
              </span>
            ) : null}
          </div>
        </CardContent>
      </Card>

      {/* Business structure — explicit choice, drives visibility of Registered section */}
      <Card>
        <CardHeader>
          <CardTitle>Business structure</CardTitle>
          <CardDescription>Choose whether your business is registered with CAC. This determines verification and invoice presentation.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <fieldset className="flex flex-col sm:flex-row gap-3" aria-label="Business structure">
            <label className="flex-1 flex items-center gap-2 rounded-lg border p-3 cursor-pointer has-[:checked]:border-brand has-[:checked]:bg-brand/5">
              <input
                type="radio"
                name="business_structure"
                value="UNREGISTERED"
                checked={structureDraft === "UNREGISTERED"}
                onChange={() => setStructureDraft("UNREGISTERED")}
                className="h-4 w-4"
                aria-label="Unregistered business"
              />
              <span className="text-sm font-medium">Unregistered</span>
            </label>
            <label className="flex-1 flex items-center gap-2 rounded-lg border p-3 cursor-pointer has-[:checked]:border-brand has-[:checked]:bg-brand/5">
              <input
                type="radio"
                name="business_structure"
                value="REGISTERED"
                checked={structureDraft === "REGISTERED"}
                onChange={() => setStructureDraft("REGISTERED")}
                className="h-4 w-4"
                aria-label="Registered business"
              />
              <span className="text-sm font-medium">Registered (CAC)</span>
            </label>
          </fieldset>
          <p className="text-xs text-muted-foreground">
            You can change this later. Switching to Unregistered marks verification as not applicable; switching back keeps your last verification but you should re-verify if your legal name changes.
          </p>
        </CardContent>
      </Card>

      {/* Business profile form — legal_name is the only required field; registration fields are NOT here */}
      <Card>
        <CardHeader>
          <CardTitle>Business profile</CardTitle>
          <CardDescription>Invoice-facing seller identity — 1 per organization. Editing here never rewrites already-issued invoices (they keep their snapshot).</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={profileForm.handleSubmit(onSaveProfile)} aria-label="Business profile form">
            <div>
              <Label htmlFor="legal_name">Legal name *</Label>
              <Input id="legal_name" className="mt-1" placeholder="Maro Labs Ltd" {...profileForm.register("legal_name")} aria-describedby="legal_name-help" />
              {profileForm.formState.errors.legal_name ? (
                <p role="alert" className="mt-1 text-xs text-critical">
                  {profileForm.formState.errors.legal_name.message}
                </p>
              ) : (
                <p id="legal_name-help" className="mt-1 text-xs text-muted-foreground">
                  Displayed on invoices and public pages. Will be frozen into the invoice snapshot when you issue.
                </p>
              )}
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <Label htmlFor="trading_name">Trading name</Label>
                <Input id="trading_name" className="mt-1" placeholder="Maro" {...profileForm.register("trading_name")} />
              </div>
              <div>
                <Label htmlFor="display_name">Display name</Label>
                <Input id="display_name" className="mt-1" placeholder="Maro Labs" {...profileForm.register("display_name")} />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <Label htmlFor="email">Contact email</Label>
                <Input id="email" className="mt-1" placeholder="hello@maro.ng" type="email" {...profileForm.register("email")} />
                {profileForm.formState.errors.email ? (
                  <p role="alert" className="mt-1 text-xs text-critical">
                    {profileForm.formState.errors.email.message}
                  </p>
                ) : null}
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" className="mt-1" placeholder="0801 234 5678" {...profileForm.register("phone")} />
              </div>
            </div>

            <div>
              <Label htmlFor="website">Website</Label>
              <Input id="website" className="mt-1" placeholder="https://maro.ng" {...profileForm.register("website")} />
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <Label htmlFor="tax_identifier">Tax identifier</Label>
                <Input id="tax_identifier" className="mt-1" placeholder="TIN / etc." {...profileForm.register("tax_identifier")} />
              </div>
              <div>
                <Label htmlFor="invoice_prefix">Invoice prefix</Label>
                <Input id="invoice_prefix" className="mt-1" placeholder="INV-" {...profileForm.register("invoice_prefix")} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Address</Label>
              <div className="grid sm:grid-cols-2 gap-3">
                <Input placeholder="Line 1" {...profileForm.register("address.line1")} aria-label="Address line 1" />
                <Input placeholder="Line 2" {...profileForm.register("address.line2")} aria-label="Address line 2" />
                <Input placeholder="City" {...profileForm.register("address.city")} aria-label="City" />
                <Input placeholder="State" {...profileForm.register("address.state")} aria-label="State" />
                <Input placeholder="Postal code" {...profileForm.register("address.postal_code")} aria-label="Postal code" />
                <Input placeholder="Country (NG)" maxLength={2} {...profileForm.register("address.country_code")} aria-label="Country code" />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <Label htmlFor="default_currency">Default currency</Label>
                <Input id="default_currency" className="mt-1" placeholder="NGN" maxLength={3} {...profileForm.register("default_currency")} />
              </div>
              <div>
                <Label htmlFor="logo_url">Logo URL</Label>
                <Input id="logo_url" className="mt-1" placeholder="https://... / logos/{orgId}/..." {...profileForm.register("logo_url")} />
                <p className="mt-1 text-xs text-muted-foreground">PNG · 1:1 · SAS logos/&#123;orgId&#125;/ · Shown in invoice PDF.</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button type="submit" loading={putMut.isPending} disabled={!canMutate}>
                Save business
              </Button>
              {!canMutate ? <span className="text-xs text-muted-foreground self-center">Read only — only workspace owners can edit.</span> : null}
              {putMut.isError ? (
                <span role="alert" className="text-xs text-critical self-center">
                  {errMessage(putMut.error, "Save failed")}
                </span>
              ) : null}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Registration details — read-only, populated only when business_structure=REGISTERED and confirm has run */}
      {isRegisteredStructure ? (
        <Card>
          <CardHeader>
            <CardTitle>Registration details</CardTitle>
            <CardDescription>Canonical CAC registration — written only when you confirm a successful lookup. Not editable here.</CardDescription>
          </CardHeader>
          <CardContent>
            {registration ? (
              <dl className="grid sm:grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-xs text-muted-foreground">Registration type</dt>
                  <dd className="font-medium">{registration.registration_type}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Registration number</dt>
                  <dd className="font-medium">{registration.registration_number}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-xs text-muted-foreground">Registered name (canonical from CAC)</dt>
                  <dd className="font-medium">{registration.registered_name}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Registry status</dt>
                  <dd>{registration.registry_status ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Jurisdiction</dt>
                  <dd>{registration.jurisdiction}</dd>
                </div>
                <div className="sm:col-span-2 text-xs text-muted-foreground">Evidence: {truncateHash(verifications.find((v) => v.id === registration.latest_verification_id)?.evidence_hash ?? "")}</div>
              </dl>
            ) : (
              <p className="text-sm text-muted-foreground">No verified registration yet — verify your RC/BN below.</p>
            )}
          </CardContent>
        </Card>
      ) : null}

      {/* CAC verification — only for REGISTERED structure */}
      {isRegisteredStructure ? (
        <Card>
          <CardHeader>
            <CardTitle>Verify with CAC</CardTitle>
            <CardDescription>Look up your RC/BN against the Corporate Affairs Commission. Lookup creates a pending record; confirmation makes it canonical.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form className="space-y-3" onSubmit={cacForm.handleSubmit(onLookup)} aria-label="CAC lookup form">
              <div className="grid sm:grid-cols-[160px_1fr_auto] gap-3 items-end">
                <div>
                  <Label htmlFor="identifier_type">Identifier type</Label>
                  <select
                    id="identifier_type"
                    className="mt-1 h-9 w-full rounded-md border border-input bg-surface px-2 text-sm"
                    aria-label="Identifier type"
                    {...cacForm.register("identifier_type")}
                  >
                    <option value="RC">RC</option>
                    <option value="BN">BN</option>
                    <option value="IT">IT</option>
                    <option value="LLP">LLP</option>
                    <option value="OTHER">OTHER</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="identifier">RC / BN number</Label>
                  <Input id="identifier" className="mt-1" placeholder="1234567 or BN987654" {...cacForm.register("identifier")} aria-describedby="identifier-help" />
                  {cacForm.formState.errors.identifier ? (
                    <p role="alert" className="mt-1 text-xs text-critical">
                      {cacForm.formState.errors.identifier.message}
                    </p>
                  ) : (
                    <p id="identifier-help" className="mt-1 text-xs text-muted-foreground">
                      CAC lookup by RC/BN. The name comes back from CAC — you don’t type it.
                    </p>
                  )}
                </div>
                <Button type="submit" loading={lookupMut.isPending} disabled={!canMutate || lookupMut.isPending} aria-label="Verify with CAC">
                  Verify with CAC
                </Button>
              </div>
              {!canMutate ? <p className="text-xs text-muted-foreground">Only workspace owners can verify.</p> : null}
            </form>

            {/* Lookup error states — mapped per API error code */}
            {lookupError ? (
              <div role="alert" className="rounded-lg border p-3 text-sm">
                {lookupError.code === "ENTITLEMENT_LIMIT_REACHED" || lookupError.status === 403 ? (
                  <div className="text-amber-900 bg-amber-50 border-amber-200 rounded-md p-3">
                    <div className="font-medium">CAC verification limit reached</div>
                    <p className="text-xs mt-1">You’ve used 5 verifications this month (FREE). Upgrade or try next period. You can continue with manual entry and verify later.</p>
                  </div>
                ) : lookupError.code === "RATE_LIMITED" || lookupError.status === 429 ? (
                  <div className="text-critical">Too many attempts — try again shortly. {lookupError.message}</div>
                ) : lookupError.code === "PROVIDER_UNAVAILABLE" || lookupError.status === 503 ? (
                  <div className="space-y-1">
                    <div className="font-medium">Verification service temporarily unavailable</div>
                    <p className="text-xs text-muted-foreground">You can continue with manual entry and verify later. Your business profile save and invoice creation are not blocked.</p>
                  </div>
                ) : (
                  <div className="text-critical">{lookupError.message}</div>
                )}
              </div>
            ) : null}

            {/* Lookup result — Found vs Not Found */}
            {lookupResult ? (
              <div
                className={`rounded-lg border p-4 space-y-3 ${lookupResult.found ? "bg-success-subtle border-success/20" : "bg-neutral-50 border-dashed"}`}
                aria-live="polite"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="font-medium text-sm">{lookupResult.found ? "Found in CAC" : "Not found in CAC"}</div>
                  <span className="text-xs text-muted-foreground">Expires: {new Date(lookupResult.expires_at).toLocaleTimeString()} · {expiryLabel ?? ""}</span>
                </div>

                {lookupResult.found ? (
                  <>
                    <dl className="grid sm:grid-cols-2 gap-2 text-sm">
                      <div>
                        <dt className="text-xs text-muted-foreground">Registered name</dt>
                        <dd className="font-medium">{lookupResult.registered_name ?? "—"}</dd>
                      </div>
                      <div>
                        <dt className="text-xs text-muted-foreground">Registry status</dt>
                        <dd>{lookupResult.registry_status ?? "—"}</dd>
                      </div>
                      <div>
                        <dt className="text-xs text-muted-foreground">Identifier</dt>
                        <dd>
                          {lookupResult.identifier_type} {lookupResult.identifier}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs text-muted-foreground">Evidence</dt>
                        <dd className="font-mono text-xs">{truncateHash(lookupResult.evidence_hash)}</dd>
                      </div>
                    </dl>
                    <p className="text-xs text-muted-foreground">
                      CAC’s <span className="font-medium">registered_name</span> is canonical evidence. Your <span className="font-medium">legal_name</span> only changes if you choose “Use registered name”.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={!canMutate || isExpired}
                        onClick={() => onUseRegisteredName(lookupResult.registered_name)}
                      >
                        Use registered name
                      </Button>
                      <Button
                        size="sm"
                        loading={confirmingId === lookupResult.verification_id}
                        disabled={!canMutate || isExpired || confirmingId !== null}
                        onClick={() => onConfirm(lookupResult.verification_id)}
                        aria-label="Confirm verification"
                      >
                        Confirm verification
                      </Button>
                      <span className="text-xs text-muted-foreground self-center">{isExpired ? "Expired — start a new lookup" : "You have 30 minutes to confirm"}</span>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-sm">
                      No matching {lookupResult.identifier_type} {lookupResult.identifier} in CAC. Check the number for typos or continue with manual entry — invoices remain usable while unverified.
                    </p>
                    <div className="flex gap-2">
                      <Button variant="secondary" size="sm" onClick={() => cacForm.setFocus("identifier")}>
                        Try again
                      </Button>
                      <span className="text-xs text-muted-foreground self-center">Manual entry is not blocked by verification.</span>
                    </div>
                  </>
                )}
              </div>
            ) : null}

            {/* Pending hint from history when lookup just done is not the only pending */}
            {pendingVerification && !lookupResult ? (
              <p className="text-xs text-muted-foreground">
                You have a pending verification {pendingVerification.identifier_type} {pendingVerification.identifier} — confirm it within {pendingCountdown ?? "30 min"} or it will expire.
              </p>
            ) : null}
          </CardContent>
        </Card>
      ) : (
        <Card className="border-dashed">
          <CardContent className="p-4 text-sm text-muted-foreground">
            Select <span className="font-medium">Registered</span> business structure to verify your RC/BN with CAC. Unregistered businesses are marked “Not applicable” and don’t need verification.
          </CardContent>
        </Card>
      )}

      {/* Verification history — append-only evidence, separate lifecycle from profile */}
      <Card>
        <CardHeader>
          <CardTitle>Verification history</CardTitle>
          <CardDescription>Append-only evidence of every CAC lookup — audit trail. Status shows per-attempt lifecycle, not profile state.</CardDescription>
        </CardHeader>
        <CardContent>
          {verificationsQ.isLoading ? (
            <Skeleton className="h-20 w-full" />
          ) : verifications.length === 0 ? (
            <EmptyState title="No verifications yet" description="Your CAC lookups will appear here as evidence, even when not found." />
          ) : (
            <div className="space-y-2">
              {/* Mobile stacked, desktop table */}
              <div className="hidden md:grid grid-cols-12 gap-2 px-2 py-1 text-xs uppercase tracking-wide text-muted-foreground">
                <span className="col-span-2">When</span>
                <span className="col-span-2">Identifier</span>
                <span className="col-span-3">Returned name</span>
                <span className="col-span-2">Status</span>
                <span className="col-span-2">Evidence</span>
                <span className="col-span-1"></span>
              </div>
              <div className="divide-y rounded-lg border overflow-hidden">
                {verifications.map((v) => (
                  <div key={v.id} className="grid md:grid-cols-12 gap-2 px-3 py-2 items-center text-sm">
                    <div className="md:col-span-2 text-xs text-muted-foreground">{new Date(v.created_at).toLocaleString()}</div>
                    <div className="md:col-span-2 font-mono text-xs">
                      {v.identifier_type} {v.identifier}
                    </div>
                    <div className="md:col-span-3 truncate" title={v.returned_name ?? "—"}>
                      {v.returned_name ?? <span className="text-muted-foreground">—</span>}
                    </div>
                    <div className="md:col-span-2">
                      <AttemptStatusBadge status={v.status} lookup_result={v.lookup_result} />
                    </div>
                    <div className="md:col-span-2 font-mono text-xs">{truncateHash(v.evidence_hash)}</div>
                    <div className="md:col-span-1 flex justify-end">
                      <Button variant="ghost" size="sm" onClick={() => setShowEvidence(v)}>
                        View
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Evidence dialog — shows both dimensions separately */}
      <Dialog open={!!showEvidence} onOpenChange={(o) => !o && setShowEvidence(null)}>
        <DialogHeader>
          <DialogTitle>Verification evidence</DialogTitle>
          <DialogDescription>Evidence hash preserves CAC response integrity without exposing raw provider payload.</DialogDescription>
        </DialogHeader>
        {showEvidence ? (
          <DialogContent>
            <dl className="space-y-2 text-sm">
              <div>
                <dt className="text-xs text-muted-foreground">Verification ID</dt>
                <dd className="font-mono text-xs">{showEvidence.id}</dd>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <dt className="text-xs text-muted-foreground">Lookup result</dt>
                  <dd className="font-medium">{showEvidence.lookup_result}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Attempt status</dt>
                  <dd>
                    <AttemptStatusBadge status={showEvidence.status} lookup_result={showEvidence.lookup_result} />
                  </dd>
                </div>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Returned name / status</dt>
                <dd className="font-medium">{showEvidence.returned_name ?? "—"} · {showEvidence.returned_status ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Evidence hash (SHA-256)</dt>
                <dd className="font-mono text-xs break-all">{showEvidence.evidence_hash}</dd>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <dt className="text-xs text-muted-foreground">Expires at</dt>
                  <dd className="text-xs">{new Date(showEvidence.expires_at).toLocaleString()}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Confirmed at</dt>
                  <dd className="text-xs">{showEvidence.confirmed_at ? new Date(showEvidence.confirmed_at).toLocaleString() : "—"}</dd>
                </div>
              </div>
              {showEvidence.confirmed_legal_name ? (
                <div>
                  <dt className="text-xs text-muted-foreground">Confirmed legal name snapshot</dt>
                  <dd>{showEvidence.confirmed_legal_name}</dd>
                </div>
              ) : null}
              {showEvidence.status === "PENDING_CONFIRMATION" && !isExpiredPending(showEvidence.expires_at) && canMutate ? (
                <div className="pt-2">
                  <Button size="sm" loading={confirmingId === showEvidence.id} onClick={() => onConfirm(showEvidence.id)}>
                    Confirm this verification
                  </Button>
                </div>
              ) : null}
            </dl>
          </DialogContent>
        ) : null}
        <DialogFooter>
          <Button variant="ghost" onClick={() => setShowEvidence(null)}>
            Close
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}

function isExpiredPending(expiresAt: string): boolean {
  return new Date(expiresAt).getTime() <= Date.now();
}
