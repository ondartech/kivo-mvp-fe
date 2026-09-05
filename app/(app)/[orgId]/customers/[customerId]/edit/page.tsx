"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PageHeader } from "@/components/kivo/page-header";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/kivo/empty-state";
import { customerCreateSchema, type CustomerCreateInput } from "@/features/customers/schema";
import { useCustomer, usePatchCustomer } from "@/features/customers/api";
import { toast } from "sonner";

export default function EditOrgCustomerPage() {
  const params = useParams<{ orgId: string; customerId: string }>();
  const orgId = params.orgId as string;
  const customerId = params.customerId as string;
  const router = useRouter();
  const { data: customer, isLoading, isError, error } = useCustomer(orgId, customerId);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    setValue,
    reset,
  } = useForm<CustomerCreateInput>({
    resolver: zodResolver(customerCreateSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      billing_address: { line1: "", line2: "", city: "", state: "", lga: "", postal_code: "", country_code: "NG" },
      classification: "INDIVIDUAL",
      tax_identifier: "",
      tax_identifier_type: null,
      business_description: "",
      notes: "",
      contacts: [],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "contacts" });
  const contacts = watch("contacts");
  const patchMut = usePatchCustomer(orgId, customerId);

  useEffect(() => {
    if (customer) {
      const addr = (customer.billing_address as Record<string, unknown> | null) ?? null;
      reset({
        name: customer.name ?? "",
        email: customer.email ?? "",
        phone: customer.phone ?? "",
        billing_address: addr
          ? {
              line1: (addr.line1 as string) ?? "",
              line2: (addr.line2 as string) ?? "",
              city: (addr.city as string) ?? "",
              state: (addr.state as string) ?? "",
              lga: (addr.lga as string) ?? "",
              postal_code: (addr.postal_code as string) ?? "",
              country_code: (addr.country_code as string) ?? "NG",
            }
          : { line1: "", line2: "", city: "", state: "", lga: "", postal_code: "", country_code: "NG" },
        classification: (customer.classification as CustomerCreateInput["classification"]) ?? "INDIVIDUAL",
        tax_identifier: customer.tax_identifier ?? "",
        tax_identifier_type: (customer.tax_identifier_type as CustomerCreateInput["tax_identifier_type"]) ?? null,
        business_description: customer.business_description ?? "",
        notes: customer.notes ?? "",
        contacts: ((customer as unknown as { contacts?: { name: string; email?: string; phone?: string; type?: string; is_primary?: boolean }[] }).contacts ?? []).map((c) => ({
          name: c.name,
          email: c.email ?? "",
          phone: c.phone ?? "",
          type: (c.type as "BILLING" | "PRIMARY") ?? "BILLING",
          is_primary: !!c.is_primary,
          email_opt_in: true,
          whatsapp_opt_in: false,
        })),
      });
    }
  }, [customer, reset]);

  const togglePrimary = (idx: number, checked: boolean) => {
    if (checked) fields.forEach((_: unknown, i: number) => setValue(`contacts.${i}.is_primary` as const, i === idx));
    else setValue(`contacts.${idx}.is_primary` as const, false);
  };

  const onSubmit = async (data: CustomerCreateInput) => {
    const payload = {
      ...data,
      email: data.email?.trim() || null,
      phone: data.phone?.trim() || null,
      tax_identifier: data.tax_identifier?.trim() || null,
      tax_identifier_type: data.tax_identifier_type || null,
      business_description: data.business_description?.trim() || null,
      notes: data.notes?.trim() || null,
      billing_address: data.billing_address
        ? {
            line1: data.billing_address.line1?.trim() || null,
            line2: data.billing_address.line2?.trim() || null,
            city: data.billing_address.city?.trim() || null,
            state: data.billing_address.state?.trim() || null,
            lga: data.billing_address.lga?.trim() || null,
            postal_code: data.billing_address.postal_code?.trim() || null,
            country_code: data.billing_address.country_code?.trim() || null,
          }
        : null,
      contacts: (data.contacts ?? []).map((c) => ({
        name: c.name,
        email: c.email?.trim() || null,
        phone: c.phone?.trim() || null,
        type: c.type,
        is_primary: !!c.is_primary,
      })),
    };
    try {
      await patchMut.mutateAsync(payload as CustomerCreateInput);
      toast.success("Customer updated");
      router.push(`/app/${orgId}/customers/${customerId}`);
    } catch (e: unknown) {
      const code = (e as { code?: string })?.code;
      if (code === "PRIMARY_ALREADY_EXISTS") toast.error("Another primary contact was added. Review the contacts and try again.");
      else if (code === "CUSTOMER_ARCHIVED") toast.error("Customer is archived — restore before editing.");
      else toast.error(e instanceof Error ? e.message : "Update failed");
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-[760px] space-y-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }
  if (isError) return <ErrorState title="Could not load customer" description={(error as Error)?.message ?? "An error occurred."} />;

  return (
    <div className="space-y-6 max-w-[760px]">
      <PageHeader title="Edit customer" description={customer?.name} />
      <Card>
        <CardContent className="p-5">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-3">
              <h3 className="text-sm font-semibold">Customer information</h3>
              <div>
                <Label htmlFor="name">Customer name *</Label>
                <Input id="name" {...register("name")} />
                {errors.name ? <p className="text-xs text-critical mt-1">{errors.name.message}</p> : null}
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <Label>Email</Label>
                  <Input {...register("email")} />
                  {errors.email ? <p className="text-xs text-critical mt-1">{errors.email.message}</p> : null}
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input {...register("phone")} />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-semibold">Billing address</h3>
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <Label>Address line 1</Label>
                  <Input {...register("billing_address.line1")} />
                </div>
                <div className="sm:col-span-2">
                  <Label>Address line 2</Label>
                  <Input {...register("billing_address.line2")} />
                </div>
                <div>
                  <Label>City</Label>
                  <Input {...register("billing_address.city")} />
                </div>
                <div>
                  <Label>State</Label>
                  <Input {...register("billing_address.state")} />
                </div>
                <div>
                  <Label>LGA</Label>
                  <Input {...register("billing_address.lga")} aria-describedby="lga-hint" />
                  <p id="lga-hint" className="text-xs text-muted-foreground mt-1">Required when country is NG and state is a Nigerian state</p>
                  {errors.billing_address?.lga ? <p className="text-xs text-critical mt-1">{errors.billing_address.lga.message}</p> : null}
                </div>
                <div>
                  <Label>Postal code</Label>
                  <Input {...register("billing_address.postal_code")} />
                </div>
                <div>
                  <Label>Country code</Label>
                  <Input {...register("billing_address.country_code")} maxLength={2} />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-semibold">Contacts</h3>
              <div className="space-y-3">
                {fields.map((field: { id: string }, idx: number) => (
                  <div key={field.id} className="rounded-md border p-3 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-medium">Contact {idx + 1}</span>
                      <label className="flex items-center gap-1 text-xs">
                        <input type="checkbox" checked={!!contacts?.[idx]?.is_primary} onChange={(e) => togglePrimary(idx, e.target.checked)} />
                        Primary
                      </label>
                    </div>
                    <Input placeholder="Name *" {...register(`contacts.${idx}.name` as const)} />
                    {errors.contacts?.[idx]?.name ? <p className="text-xs text-critical">{errors.contacts[idx]?.name?.message}</p> : null}
                    <div className="grid sm:grid-cols-2 gap-2">
                      <Input placeholder="Email" {...register(`contacts.${idx}.email` as const)} />
                      <Input placeholder="Phone" {...register(`contacts.${idx}.phone` as const)} />
                    </div>
                    {fields.length > 1 ? (
                      <Button type="button" size="sm" variant="ghost" onClick={() => remove(idx)}>
                        Remove
                      </Button>
                    ) : null}
                  </div>
                ))}
                {errors.contacts?.message ? <p className="text-xs text-critical">{errors.contacts.message}</p> : null}
                {errors.contacts?.root?.message ? <p className="text-xs text-critical">{errors.contacts.root.message}</p> : null}
                <Button type="button" size="sm" variant="outline" onClick={() => append({ name: "", email: "", phone: "", type: "BILLING", is_primary: false, email_opt_in: true, whatsapp_opt_in: false })}>
                  Add contact
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              <button type="button" onClick={() => setShowAdvanced((v) => !v)} className="text-sm font-medium underline">
                {showAdvanced ? "Hide advanced" : "Show advanced — classification & tax"}
              </button>
              {showAdvanced ? (
                <div className="grid sm:grid-cols-2 gap-3 rounded-md border p-3 bg-neutral-50/50">
                  <div>
                    <Label>Classification</Label>
                    <select className="mt-1 w-full rounded-md border px-3 py-2 text-sm bg-surface" {...register("classification")}>
                      <option value="INDIVIDUAL">Individual</option>
                      <option value="BUSINESS">Business</option>
                      <option value="GOVERNMENT">Government</option>
                      <option value="FOREIGN">Foreign</option>
                    </select>
                  </div>
                  <div>
                    <Label>Tax identifier type</Label>
                    <select className="mt-1 w-full rounded-md border px-3 py-2 text-sm bg-surface" {...register("tax_identifier_type")}>
                      <option value="">—</option>
                      <option value="NG_TIN">NG_TIN (10-14 digits)</option>
                      <option value="INCORPORATION_NUMBER">INCORPORATION_NUMBER (RC/BN/IT + 6 digits)</option>
                      <option value="FOREIGN_TAX_ID">FOREIGN_TAX_ID</option>
                    </select>
                  </div>
                  <div>
                    <Label>Tax identifier</Label>
                    <Input {...register("tax_identifier")} />
                    {errors.tax_identifier ? <p className="text-xs text-critical mt-1">{errors.tax_identifier.message}</p> : null}
                  </div>
                  <div>
                    <Label>Business description</Label>
                    <Input {...register("business_description")} />
                  </div>
                  <div className="sm:col-span-2">
                    <Label>Notes</Label>
                    <Input {...register("notes")} />
                  </div>
                </div>
              ) : null}
            </div>

            <div className="flex gap-2 pt-2">
              <Button type="submit" disabled={isSubmitting || patchMut.isPending}>
                {patchMut.isPending ? "Saving…" : "Save"}
              </Button>
              <Button type="button" variant="secondary" onClick={() => router.push(`/app/${orgId}/customers/${customerId}`)}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
