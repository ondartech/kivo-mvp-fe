"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PageHeader } from "@/components/kivo/page-header";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState, ErrorState } from "@/components/kivo/empty-state";
import { customerCreateSchema, type CustomerCreateInput } from "@/features/customers/schema";
import { useCreateCustomer } from "@/features/customers/api";
import { toast } from "sonner";

export default function NewOrgCustomerPage() {
  const params = useParams<{ orgId: string }>();
  const orgId = params.orgId as string;
  const router = useRouter();
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    setValue,
  } = useForm<CustomerCreateInput>({
    resolver: zodResolver(customerCreateSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      billing_address: { street_name: "", city: "", postal_zone: "", state_code: "", lga_code: "", country_code: "NG" },
      tax_identifier: "",
      business_description: "",
      notes: "",
      contacts: [{ name: "", email: "", phone: "", type: "BILLING", is_primary: true }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "contacts" });
  const createMut = useCreateCustomer(orgId);
  const contacts = watch("contacts");

  const onSubmit = async (data: CustomerCreateInput) => {
    // Normalize empty strings to null for API
    const payload = {
      ...data,
      email: data.email || null,
      phone: data.phone || null,
      tax_identifier: data.tax_identifier || null,
      business_description: data.business_description || null,
      notes: data.notes || null,
      billing_address: data.billing_address ?? null,
      contacts: (data.contacts ?? []).map((c) => ({
        name: c.name,
        email: c.email || null,
        phone: c.phone || null,
        type: c.type,
        is_primary: !!c.is_primary,
      })),
    };
    try {
      const res: unknown = await createMut.mutateAsync(payload as CustomerCreateInput);
      const id = (res as { id?: string })?.id ?? "";
      toast.success("Customer created");
      if (id) router.push(`/app/${orgId}/customers/${id}`);
      else router.push(`/app/${orgId}/customers`);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Create failed";
      const code = (e as { code?: string })?.code;
      if (code === "PRIMARY_ALREADY_EXISTS") toast.error("At most one primary contact is allowed");
      else toast.error(msg);
    }
  };

  const togglePrimary = (idx: number, checked: boolean) => {
    if (checked) {
      fields.forEach((_: unknown, i: number) => setValue(`contacts.${i}.is_primary` as const, i === idx));
    } else {
      setValue(`contacts.${idx}.is_primary` as const, false);
    }
  };

  return (
    <div className="space-y-6 max-w-[760px]">
      <PageHeader title="Add customer" description="Fast — name is required, rest can be added later. After creation: Create invoice." />
      <Card>
        <CardContent className="p-5">
          {createMut.isError ? (
            <div className="mb-4">
              <ErrorState title="Could not create customer" description={(createMut.error as Error)?.message ?? "An error occurred."} />
            </div>
          ) : null}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="name">Name *</Label>
              <Input id="name" placeholder="Acme Ltd." className="mt-1" {...register("name")} aria-describedby="name-error" />
              {errors.name ? <p id="name-error" className="text-xs text-critical mt-1">{errors.name.message}</p> : null}
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <Label>Email</Label>
                <Input placeholder="sola@acme.ng" className="mt-1" {...register("email")} />
                {errors.email ? <p className="text-xs text-critical mt-1">{errors.email.message}</p> : null}
              </div>
              <div>
                <Label>Phone</Label>
                <Input placeholder="0801 234 5678" className="mt-1" {...register("phone")} />
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <Label>Street</Label>
                <Input placeholder="Lekki" className="mt-1" {...register("billing_address.street_name")} />
              </div>
              <div>
                <Label>City</Label>
                <Input placeholder="Lagos" className="mt-1" {...register("billing_address.city")} />
              </div>
              <div>
                <Label>Postal zone</Label>
                <Input placeholder="101233" className="mt-1" {...register("billing_address.postal_zone")} />
              </div>
              <div>
                <Label>State code</Label>
                <Input placeholder="LA" className="mt-1" {...register("billing_address.state_code")} />
              </div>
              <div>
                <Label>LGA code</Label>
                <Input placeholder="ETI-OSA" className="mt-1" {...register("billing_address.lga_code")} />
              </div>
              <div>
                <Label>Country</Label>
                <Input placeholder="NG" className="mt-1" {...register("billing_address.country_code")} />
              </div>
              <div>
                <Label>Tax identifier</Label>
                <Input placeholder="12345678-0001" className="mt-1" {...register("tax_identifier")} />
              </div>
              <div>
                <Label>Tax type</Label>
                <select className="mt-1 w-full rounded-md border px-3 py-2 text-sm" {...register("tax_identifier_type")}>
                  <option value="">—</option>
                  <option value="NG_TIN">NG_TIN</option>
                  <option value="INCORPORATION_NUMBER">INCORPORATION_NUMBER</option>
                  <option value="FOREIGN_TAX_ID">FOREIGN_TAX_ID</option>
                </select>
              </div>
            </div>
            <div>
              <Label>Contacts</Label>
              <div className="mt-2 space-y-3">
                {fields.map((field: { id: string }, idx: number) => (
                  <div key={field.id} className="rounded-md border p-3 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-medium">Contact {idx + 1}</span>
                      <label className="flex items-center gap-1 text-xs">
                        <input type="checkbox" checked={!!contacts?.[idx]?.is_primary} onChange={(e) => togglePrimary(idx, e.target.checked)} />
                        Primary
                      </label>
                    </div>
                    <Input placeholder="Name" {...register(`contacts.${idx}.name` as const)} />
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
                <Button type="button" size="sm" variant="outline" onClick={() => append({ name: "", email: "", phone: "", type: "BILLING", is_primary: false })}>
                  Add contact
                </Button>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button type="submit" disabled={isSubmitting || createMut.isPending}>
                {createMut.isPending ? "Creating…" : "Create customer"}
              </Button>
              <Button type="button" variant="secondary" onClick={() => router.push(`/app/${orgId}/customers`)}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      <div className="text-xs text-muted-foreground">
        On success you’ll be offered <span className="font-medium">Create invoice</span> — pre-fills <code>/app/{orgId}/invoices/new?customerId</code>.
      </div>
    </div>
  );
}
