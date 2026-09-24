"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { EmptyState, ErrorState } from "@/components/kivo/empty-state";
import { PageHeader } from "@/components/kivo/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useFinanceAccounts } from "@/features/finance-explorer/api";
import { useActiveOrganizationId } from "@/hooks/use-active-organization";
import { CatalogTaxDefaults } from "./catalog-defaults";
import {
  useAddTaxCodeVersion,
  useArchiveTaxCode,
  useCreateTaxAccountMapping,
  useCreateTaxCode,
  useCreateTaxRegistration,
  useTaxCode,
  useTaxCodes,
  useTaxRegistrations,
} from "./api";
import {
  defaultRecognitionRuleForFamily,
  financeAccountClassForTaxRole,
  humanizeTaxValue,
  taxAccountMappingInputSchema,
  taxCodeCreateInputSchema,
  taxCodeVersionInputSchema,
  taxRegistrationInputSchema,
  taxRolesForFamily,
  type TaxCodeCreateInput,
  type TaxCodeVersionInput,
  type TaxFamily,
  type TaxRegistrationInput,
  type TaxAccountMappingInput,
} from "./schema";

const selectClassName =
  "mt-1 w-full rounded-md border bg-surface px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-60";
const textareaClassName =
  "mt-1 min-h-24 w-full rounded-md border bg-surface px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring";

function FieldError({ message }: { message?: string }) {
  return message ? (
    <p className="mt-1 text-xs text-red-600" role="alert">
      {message}
    </p>
  ) : null;
}

function CreateTaxCodeForm({
  organizationId,
  onCreated,
}: {
  organizationId: string;
  onCreated: (taxCodeId: string) => void;
}) {
  const mutation = useCreateTaxCode(organizationId);
  const form = useForm<TaxCodeCreateInput>({
    resolver: zodResolver(taxCodeCreateInputSchema),
    defaultValues: {
      code: "",
      name: "",
      family: "VAT",
      jurisdiction_country: "NG",
      initial_version: {
        rate: "0.075000",
        treatment: "TAXABLE",
        recognition_rule: "ON_DOCUMENT",
        effective_from: "",
        effective_to: null,
        authority_reference: null,
      },
    },
  });

  const family = form.watch("family");

  const submit = form.handleSubmit(async (values) => {
    try {
      const created = await mutation.mutateAsync(values);
      toast.success(created.code + " created");
      onCreated(created.id);
      form.reset({
        code: "",
        name: "",
        family: "VAT",
        jurisdiction_country: "NG",
        initial_version: {
          rate: "0.075000",
          treatment: "TAXABLE",
          recognition_rule: "ON_DOCUMENT",
          effective_from: "",
          effective_to: null,
          authority_reference: null,
        },
      });
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Tax code creation failed");
    }
  });

  return (
    <Card>
      <CardContent className="space-y-4 p-5">
        <div>
          <div className="font-medium">New tax code</div>
          <p className="mt-1 text-sm text-muted-foreground">
            Create the stable tax identity and its first effective statutory version.
            Later rate or treatment changes are added as new versions.
          </p>
        </div>

        <form className="space-y-4" onSubmit={submit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="tax-code">Code</Label>
              <Input
                id="tax-code"
                className="mt-1"
                placeholder="VAT-STD"
                {...form.register("code")}
              />
              <FieldError message={form.formState.errors.code?.message} />
            </div>
            <div>
              <Label htmlFor="tax-name">Name</Label>
              <Input
                id="tax-name"
                className="mt-1"
                placeholder="VAT Standard"
                {...form.register("name")}
              />
              <FieldError message={form.formState.errors.name?.message} />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="tax-family">Family</Label>
              <select
                id="tax-family"
                className={selectClassName}
                value={family}
                onChange={(event) => {
                  const nextFamily = event.target.value as TaxFamily;
                  form.setValue("family", nextFamily, { shouldValidate: true });
                  form.setValue(
                    "initial_version.recognition_rule",
                    defaultRecognitionRuleForFamily(nextFamily),
                    { shouldValidate: true },
                  );
                }}
              >
                <option value="VAT">VAT</option>
                <option value="WHT">WHT</option>
                <option value="LEVY">Levy</option>
                <option value="DUTY">Duty</option>
                <option value="OTHER_STATUTORY">Other statutory</option>
              </select>
              <FieldError message={form.formState.errors.family?.message} />
            </div>
            <div>
              <Label>Jurisdiction</Label>
              <div className="mt-1 flex min-h-10 items-center rounded-md border bg-neutral-50 px-3 text-sm">
                Nigeria · NG
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <Label htmlFor="tax-rate">Rate</Label>
              <Input
                id="tax-rate"
                className="mt-1 font-mono"
                placeholder="0.075000"
                {...form.register("initial_version.rate")}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Decimal form; 0.075000 represents 7.5%.
              </p>
              <FieldError
                message={form.formState.errors.initial_version?.rate?.message}
              />
            </div>
            <div>
              <Label htmlFor="tax-treatment">Treatment</Label>
              <select
                id="tax-treatment"
                className={selectClassName}
                {...form.register("initial_version.treatment")}
              >
                <option value="TAXABLE">Taxable</option>
                <option value="ZERO_RATED">Zero rated</option>
                <option value="EXEMPT">Exempt</option>
                <option value="OUT_OF_SCOPE">Out of scope</option>
              </select>
              <FieldError
                message={form.formState.errors.initial_version?.treatment?.message}
              />
            </div>
            <div>
              <Label htmlFor="tax-effective-from">Effective from</Label>
              <Input
                id="tax-effective-from"
                className="mt-1"
                type="date"
                {...form.register("initial_version.effective_from")}
              />
              <FieldError
                message={
                  form.formState.errors.initial_version?.effective_from?.message
                }
              />
            </div>
          </div>

          <div>
            <Label htmlFor="tax-recognition">Recognition rule</Label>
            <select
              id="tax-recognition"
              className={selectClassName}
              {...form.register("initial_version.recognition_rule")}
            >
              <option value="ON_DOCUMENT">On document</option>
              <option value="ON_PAYMENT_OR_SETTLEMENT">
                On payment or settlement
              </option>
              <option value="EARLIER_OF_PAYMENT_OR_LIABILITY_RECOGNITION">
                Earlier of payment or liability recognition
              </option>
              <option value="EARLIER_OF_PAYMENT_OR_INCOME_CREDIT">
                Earlier of payment or income credit
              </option>
              <option value="NIGERIA_WHT_CONTEXTUAL">
                Nigeria WHT contextual
              </option>
            </select>
            <p className="mt-1 text-xs text-muted-foreground">
              VAT normally uses On document. Transactional WHT normally uses
              Nigeria WHT contextual timing; the backend remains authoritative.
            </p>
            <FieldError
              message={
                form.formState.errors.initial_version?.recognition_rule?.message
              }
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="tax-effective-to">Effective to · optional</Label>
              <Input
                id="tax-effective-to"
                className="mt-1"
                type="date"
                {...form.register("initial_version.effective_to", {
                  setValueAs: (value) => (value ? value : null),
                })}
              />
              <FieldError
                message={form.formState.errors.initial_version?.effective_to?.message}
              />
            </div>
            <div>
              <Label htmlFor="tax-authority">Authority reference · optional</Label>
              <Input
                id="tax-authority"
                className="mt-1"
                placeholder="Nigeria Tax Act / regulation reference"
                {...form.register("initial_version.authority_reference", {
                  setValueAs: (value) => (value ? value : null),
                })}
              />
              <FieldError
                message={
                  form.formState.errors.initial_version?.authority_reference?.message
                }
              />
            </div>
          </div>

          {mutation.isError ? (
            <p className="text-sm text-red-600">{mutation.error.message}</p>
          ) : null}

          <Button type="submit" loading={mutation.isPending}>
            Create tax code
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function AddVersionForm({
  organizationId,
  taxCodeId,
  family,
  onDone,
}: {
  organizationId: string;
  taxCodeId: string;
  family: TaxFamily;
  onDone: () => void;
}) {
  const mutation = useAddTaxCodeVersion(organizationId, taxCodeId);
  const form = useForm<TaxCodeVersionInput>({
    resolver: zodResolver(taxCodeVersionInputSchema),
    defaultValues: {
      rate: "",
      treatment: "TAXABLE",
      recognition_rule: defaultRecognitionRuleForFamily(family),
      effective_from: "",
      effective_to: null,
      authority_reference: null,
    },
  });

  const submit = form.handleSubmit(async (values) => {
    try {
      const version = await mutation.mutateAsync(values);
      toast.success("Version " + version.version + " added");
      onDone();
      form.reset({
        rate: "",
        treatment: "TAXABLE",
        recognition_rule: defaultRecognitionRuleForFamily(family),
        effective_from: "",
        effective_to: null,
        authority_reference: null,
      });
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Version creation failed");
    }
  });

  return (
    <Card className="border-dashed">
      <CardContent className="p-5">
        <div className="font-medium">Add effective version</div>
        <p className="mt-1 text-sm text-muted-foreground">
          Existing versions are immutable. The new version must start after the
          latest effective-from date.
        </p>
        <form className="mt-4 space-y-4" onSubmit={submit}>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <Label htmlFor="version-rate">Rate</Label>
              <Input
                id="version-rate"
                className="mt-1 font-mono"
                placeholder="0.075000"
                {...form.register("rate")}
              />
              <FieldError message={form.formState.errors.rate?.message} />
            </div>
            <div>
              <Label htmlFor="version-treatment">Treatment</Label>
              <select
                id="version-treatment"
                className={selectClassName}
                {...form.register("treatment")}
              >
                <option value="TAXABLE">Taxable</option>
                <option value="ZERO_RATED">Zero rated</option>
                <option value="EXEMPT">Exempt</option>
                <option value="OUT_OF_SCOPE">Out of scope</option>
              </select>
              <FieldError message={form.formState.errors.treatment?.message} />
            </div>
            <div>
              <Label htmlFor="version-effective-from">Effective from</Label>
              <Input
                id="version-effective-from"
                className="mt-1"
                type="date"
                {...form.register("effective_from")}
              />
              <FieldError message={form.formState.errors.effective_from?.message} />
            </div>
          </div>

          <div>
            <Label htmlFor="version-recognition">Recognition rule</Label>
            <select
              id="version-recognition"
              className={selectClassName}
              {...form.register("recognition_rule")}
            >
              <option value="ON_DOCUMENT">On document</option>
              <option value="ON_PAYMENT_OR_SETTLEMENT">
                On payment or settlement
              </option>
              <option value="EARLIER_OF_PAYMENT_OR_LIABILITY_RECOGNITION">
                Earlier of payment or liability recognition
              </option>
              <option value="EARLIER_OF_PAYMENT_OR_INCOME_CREDIT">
                Earlier of payment or income credit
              </option>
              <option value="NIGERIA_WHT_CONTEXTUAL">
                Nigeria WHT contextual
              </option>
            </select>
            <FieldError message={form.formState.errors.recognition_rule?.message} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="version-effective-to">Effective to · optional</Label>
              <Input
                id="version-effective-to"
                className="mt-1"
                type="date"
                {...form.register("effective_to", {
                  setValueAs: (value) => (value ? value : null),
                })}
              />
              <FieldError message={form.formState.errors.effective_to?.message} />
            </div>
            <div>
              <Label htmlFor="version-authority">Authority reference · optional</Label>
              <Input
                id="version-authority"
                className="mt-1"
                {...form.register("authority_reference", {
                  setValueAs: (value) => (value ? value : null),
                })}
              />
              <FieldError
                message={form.formState.errors.authority_reference?.message}
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button type="submit" loading={mutation.isPending}>
              Add version
            </Button>
            <Button type="button" variant="ghost" onClick={onDone}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function AddAccountMappingForm({
  organizationId,
  taxCodeId,
  family,
  onDone,
}: {
  organizationId: string;
  taxCodeId: string;
  family: TaxFamily;
  onDone: () => void;
}) {
  const mutation = useCreateTaxAccountMapping(organizationId, taxCodeId);
  const accounts = useFinanceAccounts(organizationId);
  const roles = taxRolesForFamily(family);
  const form = useForm<TaxAccountMappingInput>({
    resolver: zodResolver(taxAccountMappingInputSchema),
    defaultValues: {
      accounting_role: roles[0],
      account_id: "",
      effective_from: "",
      effective_to: null,
      reason: "",
    },
  });
  const selectedRole = form.watch("accounting_role");
  const expectedClass = financeAccountClassForTaxRole(selectedRole);
  const eligibleAccounts = useMemo(
    () =>
      (accounts.data?.data ?? []).filter(
        (account) =>
          account.status === "ACTIVE" && account.account_class === expectedClass,
      ),
    [accounts.data?.data, expectedClass],
  );

  const submit = form.handleSubmit(async (values) => {
    try {
      await mutation.mutateAsync(values);
      toast.success("Tax account mapping added");
      onDone();
      form.reset({
        accounting_role: roles[0],
        account_id: "",
        effective_from: "",
        effective_to: null,
        reason: "",
      });
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Account mapping failed");
    }
  });

  return (
    <Card className="border-dashed">
      <CardContent className="p-5">
        <div className="font-medium">Add Finance account mapping</div>
        <p className="mt-1 text-sm text-muted-foreground">
          Map this statutory role to an effective Finance account. Ondar validates
          Asset versus Liability class on the server.
        </p>

        <form className="mt-4 space-y-4" onSubmit={submit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="mapping-role">Accounting role</Label>
              <select
                id="mapping-role"
                className={selectClassName}
                {...form.register("accounting_role", {
                  onChange: () => form.setValue("account_id", ""),
                })}
              >
                {roles.map((role) => (
                  <option key={role} value={role}>
                    {humanizeTaxValue(role)}
                  </option>
                ))}
              </select>
              <FieldError message={form.formState.errors.accounting_role?.message} />
            </div>
            <div>
              <Label htmlFor="mapping-account">
                Finance account · {humanizeTaxValue(expectedClass)}
              </Label>
              <select
                id="mapping-account"
                className={selectClassName}
                disabled={accounts.isLoading || accounts.isError}
                {...form.register("account_id")}
              >
                <option value="">
                  {accounts.isLoading
                    ? "Loading accounts…"
                    : eligibleAccounts.length
                      ? "Choose account"
                      : "No compatible active accounts"}
                </option>
                {eligibleAccounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.code + " · " + account.name}
                  </option>
                ))}
              </select>
              <FieldError message={form.formState.errors.account_id?.message} />
            </div>
          </div>

          {accounts.isError ? (
            <p className="text-sm text-red-600">
              Finance accounts could not be loaded: {accounts.error.message}
            </p>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="mapping-from">Effective from</Label>
              <Input
                id="mapping-from"
                className="mt-1"
                type="date"
                {...form.register("effective_from")}
              />
              <FieldError message={form.formState.errors.effective_from?.message} />
            </div>
            <div>
              <Label htmlFor="mapping-to">Effective to · optional</Label>
              <Input
                id="mapping-to"
                className="mt-1"
                type="date"
                {...form.register("effective_to", {
                  setValueAs: (value) => (value ? value : null),
                })}
              />
              <FieldError message={form.formState.errors.effective_to?.message} />
            </div>
          </div>

          <div>
            <Label htmlFor="mapping-reason">Change reason</Label>
            <textarea
              id="mapping-reason"
              className={textareaClassName}
              placeholder="Why this account is the correct statutory posting destination"
              {...form.register("reason")}
            />
            <FieldError message={form.formState.errors.reason?.message} />
          </div>

          <div className="flex gap-2">
            <Button type="submit" loading={mutation.isPending}>
              Add mapping
            </Button>
            <Button type="button" variant="ghost" onClick={onDone}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function TaxCodeDetailPanel({
  organizationId,
  taxCodeId,
}: {
  organizationId: string;
  taxCodeId: string;
}) {
  const detail = useTaxCode(organizationId, taxCodeId);
  const archive = useArchiveTaxCode(organizationId, taxCodeId);
  const accounts = useFinanceAccounts(organizationId);
  const [showVersion, setShowVersion] = useState(false);
  const [showMapping, setShowMapping] = useState(false);

  const accountById = useMemo(
    () =>
      new Map(
        (accounts.data?.data ?? []).map((account) => [
          account.id,
          account.code + " · " + account.name,
        ]),
      ),
    [accounts.data?.data],
  );

  if (detail.isLoading) {
    return <Skeleton className="h-80 w-full" />;
  }

  if (detail.isError) {
    return (
      <ErrorState
        title="Tax code unavailable"
        description={detail.error.message}
        retry={{ label: "Retry", onClick: () => void detail.refetch() }}
      />
    );
  }

  if (!detail.data) return null;

  const taxCode = detail.data;
  const archiveCode = async () => {
    if (
      !confirm(
        "Archive " +
          taxCode.code +
          "? Existing documents and tax evidence remain unchanged, but the code cannot be used for new tax decisions or versions.",
      )
    ) {
      return;
    }
    try {
      await archive.mutateAsync();
      toast.success(taxCode.code + " archived");
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Archive failed");
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-sm font-semibold">{taxCode.code}</span>
                <Badge variant={taxCode.status === "ACTIVE" ? "success" : "neutral"}>
                  {humanizeTaxValue(taxCode.status)}
                </Badge>
                <Badge variant="neutral">{humanizeTaxValue(taxCode.family)}</Badge>
              </div>
              <h2 className="mt-2 text-lg font-semibold">{taxCode.name}</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {taxCode.jurisdiction_country} statutory identity · historical
                versions are immutable.
              </p>
            </div>

            {taxCode.status === "ACTIVE" ? (
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setShowVersion((value) => !value);
                    setShowMapping(false);
                  }}
                >
                  Add version
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setShowMapping((value) => !value);
                    setShowVersion(false);
                  }}
                >
                  Add account mapping
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  loading={archive.isPending}
                  onClick={() => void archiveCode()}
                >
                  Archive
                </Button>
              </div>
            ) : null}
          </div>

          {taxCode.current_version ? (
            <div className="mt-5 grid gap-3 sm:grid-cols-4">
              <div className="rounded-md border p-3">
                <div className="text-xs text-muted-foreground">Current rate</div>
                <div className="mt-1 font-mono text-sm font-medium">
                  {taxCode.current_version.rate}
                </div>
              </div>
              <div className="rounded-md border p-3">
                <div className="text-xs text-muted-foreground">Treatment</div>
                <div className="mt-1 text-sm font-medium">
                  {humanizeTaxValue(taxCode.current_version.treatment)}
                </div>
              </div>
              <div className="rounded-md border p-3 sm:col-span-2">
                <div className="text-xs text-muted-foreground">Recognition</div>
                <div className="mt-1 text-sm font-medium">
                  {humanizeTaxValue(taxCode.current_version.recognition_rule)}
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-5 rounded-md border border-dashed p-3 text-sm text-muted-foreground">
              No version is effective today. Historical and future versions remain
              visible below.
            </div>
          )}
        </CardContent>
      </Card>

      {showVersion && taxCode.status === "ACTIVE" ? (
        <AddVersionForm
          organizationId={organizationId}
          taxCodeId={taxCode.id}
          family={taxCode.family}
          onDone={() => setShowVersion(false)}
        />
      ) : null}

      {showMapping && taxCode.status === "ACTIVE" ? (
        <AddAccountMappingForm
          organizationId={organizationId}
          taxCodeId={taxCode.id}
          family={taxCode.family}
          onDone={() => setShowMapping(false)}
        />
      ) : null}

      <Card>
        <CardContent className="p-5">
          <div className="font-medium">Effective versions</div>
          <p className="mt-1 text-sm text-muted-foreground">
            Each row is an immutable statutory definition. Changes are appended,
            never overwritten.
          </p>
          <div className="mt-4 divide-y rounded-md border">
            {taxCode.versions.map((version) => (
              <div
                key={version.id}
                className="grid gap-2 px-4 py-3 text-sm sm:grid-cols-12 sm:items-start"
              >
                <div className="sm:col-span-1 font-medium">
                  v{version.version}
                </div>
                <div className="sm:col-span-2 font-mono">{version.rate}</div>
                <div className="sm:col-span-2">
                  {humanizeTaxValue(version.treatment)}
                </div>
                <div className="sm:col-span-3">
                  {humanizeTaxValue(version.recognition_rule)}
                </div>
                <div className="sm:col-span-2">
                  {version.effective_from}
                  {version.effective_to ? " → " + version.effective_to : " → open"}
                </div>
                <div className="sm:col-span-2 text-muted-foreground">
                  {version.authority_reference ?? "No authority reference"}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5">
          <div className="font-medium">Finance account mappings</div>
          <p className="mt-1 text-sm text-muted-foreground">
            Effective-dated mappings tell Finance where recognized tax is posted.
          </p>
          {taxCode.account_mappings.length ? (
            <div className="mt-4 divide-y rounded-md border">
              {taxCode.account_mappings.map((mapping) => (
                <div
                  key={mapping.id}
                  className="grid gap-2 px-4 py-3 text-sm sm:grid-cols-12 sm:items-start"
                >
                  <div className="sm:col-span-3 font-medium">
                    {humanizeTaxValue(mapping.accounting_role)}
                  </div>
                  <div className="sm:col-span-3">
                    {accountById.get(mapping.account_id) ?? mapping.account_id}
                  </div>
                  <div className="sm:col-span-2">
                    {mapping.effective_from}
                    {mapping.effective_to ? " → " + mapping.effective_to : " → open"}
                  </div>
                  <div className="sm:col-span-4 text-muted-foreground">
                    {mapping.change_reason}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-4 rounded-md border border-dashed p-3 text-sm text-muted-foreground">
              No Finance account mappings yet. Posting that requires a mapping
              will fail closed until the relevant role has one.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function TaxRegistrationsPanel({ organizationId }: { organizationId: string }) {
  const registrations = useTaxRegistrations(organizationId);
  const createRegistration = useCreateTaxRegistration(organizationId);
  const [showCreate, setShowCreate] = useState(false);
  const form = useForm<TaxRegistrationInput>({
    resolver: zodResolver(taxRegistrationInputSchema),
    defaultValues: {
      authority_code: "NRS",
      registration_type: "",
      registration_number: null,
      remittance_frequency: "MONTHLY",
      effective_from: "",
      effective_to: null,
    },
  });

  const submit = form.handleSubmit(async (values) => {
    try {
      await createRegistration.mutateAsync(values);
      toast.success("Tax registration added");
      setShowCreate(false);
      form.reset({
        authority_code: "NRS",
        registration_type: "",
        registration_number: null,
        remittance_frequency: "MONTHLY",
        effective_from: "",
        effective_to: null,
      });
    } catch (error: unknown) {
      toast.error(
        error instanceof Error ? error.message : "Tax registration creation failed",
      );
    }
  });

  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="font-medium">Tax registrations & remittance cadence</div>
            <p className="mt-1 text-sm text-muted-foreground">
              Filing/remittance frequency belongs to the organization’s authority
              registration, not to an individual TaxCode.
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowCreate((value) => !value)}
          >
            {showCreate ? "Close form" : "Add registration"}
          </Button>
        </div>

        {showCreate ? (
          <form className="mt-5 space-y-4 border-t pt-5" onSubmit={submit}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="registration-authority">Authority code</Label>
                <Input
                  id="registration-authority"
                  className="mt-1"
                  placeholder="NRS"
                  {...form.register("authority_code")}
                />
                <FieldError message={form.formState.errors.authority_code?.message} />
              </div>
              <div>
                <Label htmlFor="registration-type">Registration type</Label>
                <Input
                  id="registration-type"
                  className="mt-1"
                  placeholder="VAT"
                  {...form.register("registration_type")}
                />
                <FieldError message={form.formState.errors.registration_type?.message} />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="registration-number">
                  Registration number · optional
                </Label>
                <Input
                  id="registration-number"
                  className="mt-1"
                  {...form.register("registration_number", {
                    setValueAs: (value) => (value ? value : null),
                  })}
                />
                <FieldError
                  message={form.formState.errors.registration_number?.message}
                />
              </div>
              <div>
                <Label htmlFor="registration-frequency">Remittance frequency</Label>
                <select
                  id="registration-frequency"
                  className={selectClassName}
                  {...form.register("remittance_frequency")}
                >
                  <option value="MONTHLY">Monthly</option>
                  <option value="QUARTERLY">Quarterly</option>
                  <option value="ANNUAL">Annual</option>
                  <option value="ON_DEMAND">On demand</option>
                </select>
                <FieldError
                  message={form.formState.errors.remittance_frequency?.message}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="registration-from">Effective from</Label>
                <Input
                  id="registration-from"
                  className="mt-1"
                  type="date"
                  {...form.register("effective_from")}
                />
                <FieldError
                  message={form.formState.errors.effective_from?.message}
                />
              </div>
              <div>
                <Label htmlFor="registration-to">Effective to · optional</Label>
                <Input
                  id="registration-to"
                  className="mt-1"
                  type="date"
                  {...form.register("effective_to", {
                    setValueAs: (value) => (value ? value : null),
                  })}
                />
                <FieldError message={form.formState.errors.effective_to?.message} />
              </div>
            </div>

            <Button type="submit" loading={createRegistration.isPending}>
              Add registration
            </Button>
          </form>
        ) : null}

        {registrations.isLoading ? (
          <div className="mt-5 space-y-2">
            {Array.from({ length: 2 }, (_, index) => (
              <Skeleton key={index} className="h-16 w-full" />
            ))}
          </div>
        ) : registrations.isError ? (
          <div className="mt-5">
            <ErrorState
              title="Tax registrations unavailable"
              description={registrations.error.message}
              retry={{
                label: "Retry",
                onClick: () => void registrations.refetch(),
              }}
            />
          </div>
        ) : registrations.data?.data.length ? (
          <div className="mt-5 divide-y rounded-md border">
            {registrations.data.data.map((registration) => (
              <div
                key={registration.id}
                className="grid gap-2 px-4 py-3 text-sm sm:grid-cols-12 sm:items-center"
              >
                <div className="sm:col-span-2 font-medium">
                  {registration.authority_code}
                </div>
                <div className="sm:col-span-2">
                  {humanizeTaxValue(registration.registration_type)}
                </div>
                <div className="sm:col-span-3 font-mono text-xs">
                  {registration.registration_number ?? "No number recorded"}
                </div>
                <div className="sm:col-span-2">
                  {humanizeTaxValue(registration.remittance_frequency)}
                </div>
                <div className="sm:col-span-2">
                  {registration.effective_from}
                </div>
                <div className="sm:col-span-1">
                  <Badge
                    variant={
                      registration.status === "ACTIVE" ? "success" : "neutral"
                    }
                  >
                    {humanizeTaxValue(registration.status)}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-5 rounded-md border border-dashed p-3 text-sm text-muted-foreground">
            No tax registrations recorded yet.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function TaxAdministration() {
  const organizationId = useActiveOrganizationId();
  const taxCodes = useTaxCodes(organizationId ?? "");
  const [selectedTaxCodeId, setSelectedTaxCodeId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    if (
      !selectedTaxCodeId &&
      taxCodes.data?.data &&
      taxCodes.data.data.length > 0
    ) {
      const firstActive =
        taxCodes.data.data.find((taxCode) => taxCode.status === "ACTIVE") ??
        taxCodes.data.data[0];
      setSelectedTaxCodeId(firstActive.id);
    }
  }, [selectedTaxCodeId, taxCodes.data?.data]);

  if (!organizationId) {
    return (
      <EmptyState
        title="Organization context required"
        description="Select an organization workspace before managing tax authority."
      />
    );
  }

  const codes = taxCodes.data?.data ?? [];

  return (
    <div className="max-w-[1100px] space-y-6">
      <PageHeader
        eyebrow="Business settings"
        title="Tax"
        description="Manage statutory tax identities, immutable effective versions, Finance mappings, and organization remittance registrations."
        actions={
          <Button
            size="sm"
            onClick={() => setShowCreate((value) => !value)}
          >
            {showCreate ? "Close form" : "New tax code"}
          </Button>
        }
      />

      <Card>
        <CardContent className="p-5">
          <div className="font-medium">Authority model</div>
          <p className="mt-1 text-sm text-muted-foreground">
            TaxCode is a stable identity. Rates, treatment, recognition timing and
            GL mappings are effective-dated evidence. Ondar appends changes rather
            than rewriting history. Archived codes remain visible for audit and
            historical documents.
          </p>
        </CardContent>
      </Card>

      {showCreate ? (
        <CreateTaxCodeForm
          organizationId={organizationId}
          onCreated={(id) => {
            setSelectedTaxCodeId(id);
            setShowCreate(false);
          }}
        />
      ) : null}

      <section className="space-y-3" aria-labelledby="tax-code-list-heading">
        <div>
          <h2 id="tax-code-list-heading" className="text-base font-semibold">
            Tax codes
          </h2>
          <p className="text-sm text-muted-foreground">
            Choose a code to inspect versions and Finance mappings.
          </p>
        </div>

        {taxCodes.isLoading ? (
          <div className="grid gap-3 md:grid-cols-2">
            {Array.from({ length: 4 }, (_, index) => (
              <Skeleton key={index} className="h-28 w-full" />
            ))}
          </div>
        ) : taxCodes.isError ? (
          <ErrorState
            title="Tax codes unavailable"
            description={taxCodes.error.message}
            retry={{ label: "Retry", onClick: () => void taxCodes.refetch() }}
          />
        ) : codes.length ? (
          <div className="grid gap-3 md:grid-cols-2">
            {codes.map((taxCode) => {
              const selected = taxCode.id === selectedTaxCodeId;
              return (
                <button
                  key={taxCode.id}
                  type="button"
                  onClick={() => setSelectedTaxCodeId(taxCode.id)}
                  className={
                    "rounded-lg border p-4 text-left transition-colors hover:bg-neutral-50 " +
                    (selected ? "ring-2 ring-ring" : "")
                  }
                  aria-pressed={selected}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-mono text-sm font-semibold">
                      {taxCode.code}
                    </span>
                    <Badge
                      variant={taxCode.status === "ACTIVE" ? "success" : "neutral"}
                    >
                      {humanizeTaxValue(taxCode.status)}
                    </Badge>
                  </div>
                  <div className="mt-2 font-medium">{taxCode.name}</div>
                  <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    <span>{humanizeTaxValue(taxCode.family)}</span>
                    <span>{taxCode.jurisdiction_country}</span>
                    {taxCode.current_version ? (
                      <>
                        <span className="font-mono">
                          Rate {taxCode.current_version.rate}
                        </span>
                        <span>
                          {humanizeTaxValue(taxCode.current_version.treatment)}
                        </span>
                      </>
                    ) : (
                      <span>No version effective today</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <EmptyState
            title="No tax codes yet"
            description="Create the first statutory tax identity for this organization."
            action={{ label: "Create tax code", onClick: () => setShowCreate(true) }}
          />
        )}
      </section>

      {selectedTaxCodeId ? (
        <section aria-label="Selected tax code">
          <TaxCodeDetailPanel
            organizationId={organizationId}
            taxCodeId={selectedTaxCodeId}
          />
        </section>
      ) : null}

      <CatalogTaxDefaults organizationId={organizationId} />

      <TaxRegistrationsPanel organizationId={organizationId} />
    </div>
  );
}
