"use client";

import { useEffect } from "react";
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

function useDemoOrgId() {
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem("orgId") ?? localStorage.getItem("organization_id");
    if (stored) return stored;
  }
  return "00000000-0000-0000-0000-000000000000";
}

export default function EditCustomerPage() {
  const params = useParams<{ customerId: string }>();
  const customerId = params.customerId as string;
  const orgId = useDemoOrgId();
  const router = useRouter();
  const { data: customer, isLoading, isError, error } = useCustomer(orgId, customerId);
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
    defaultValues: { name: "", contacts: [] },
  });
  const { fields, append, remove } = useFieldArray({ control, name: "contacts" });
  const contacts = watch("contacts");
  const patchMut = usePatchCustomer(orgId, customerId);
  useEffect(() => {
    if (customer) {
      reset({
        name: customer.name ?? "",
        email: customer.email ?? "",
        phone: customer.phone ?? "",
        billing_address: (customer.billing_address as { street_name?: string; city?: string; postal_zone?: string; state_code?: string; lga_code?: string; country_code?: string }) ?? {
          street_name: "",
          city: "",
          postal_zone: "",
          state_code: "",
          lga_code: "",
          country_code: "NG",
        },
        tax_identifier: customer.tax_identifier ?? "",
        business_description: (customer as { business_description?: string }).business_description ?? "",
        notes: customer.notes ?? "",
        contacts: ((customer as unknown as { contacts?: { name: string; email?: string; phone?: string; type?: string; is_primary?: boolean }[] }).contacts ?? []).map((c) => ({
          name: c.name,
          email: c.email ?? "",
          phone: c.phone ?? "",
          type: (c.type as "BILLING" | "PRIMARY") ?? "BILLING",
          is_primary: !!c.is_primary,
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
      await patchMut.mutateAsync(payload as CustomerCreateInput);
      toast.success("Customer updated");
      router.push(`/app/customers/${customerId}`);
    } catch (e: unknown) {
      const code = (e as { code?: string })?.code;
      if (code === "PRIMARY_ALREADY_EXISTS") toast.error("At most one primary contact is allowed");
      else toast.error(e instanceof Error ? e.message : "Update failed");
    }
  };
  if (isLoading) return <div className="max-w-[760px] space-y-4"><Skeleton className="h-8 w-40" /><Skeleton className="h-64 w-full" /></div>;
  if (isError) return <ErrorState title="Could not load customer" description={(error as Error)?.message ?? "An error occurred."} />;
  return (
    <div className="space-y-6 max-w-[760px]">
      <PageHeader title="Edit customer" description={customer?.name} />
      <Card>
        <CardContent className="p-5">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="name">Name *</Label>
              <Input id="name" {...register("name")} />
              {errors.name ? <p className="text-xs text-critical mt-1">{errors.name.message}</p> : null}
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <Label>Email</Label>
                <Input {...register("email")} />
              </div>
              <div>
                <Label>Phone</Label>
                <Input {...register("phone")} />
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <Label>Street</Label>
                <Input {...register("billing_address.street_name")} />
              </div>
              <div>
                <Label>City</Label>
                <Input {...register("billing_address.city")} />
              </div>
              <div>
                <Label>Postal zone</Label>
                <Input {...register("billing_address.postal_zone")} />
              </div>
              <div>
                <Label>State code</Label>
                <Input {...register("billing_address.state_code")} />
              </div>
              <div>
                <Label>LGA code</Label>
                <Input {...register("billing_address.lga_code")} />
              </div>
              <div>
                <Label>Country</Label>
                <Input {...register("billing_address.country_code")} />
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
                <Button type="button" size="sm" variant="outline" onClick={() => append({ name: "", email: "", phone: "", type: "BILLING", is_primary: false })}>
                  Add contact
                </Button>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button type="submit" disabled={isSubmitting || patchMut.isPending}>
                {patchMut.isPending ? "Saving…" : "Save"}
              </Button>
              <Button type="button" variant="secondary" onClick={() => router.push(`/app/customers/${customerId}`)}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
