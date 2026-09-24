"use client";

import { toast } from "sonner";

import { ErrorState } from "@/components/kivo/empty-state";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useCatalogItems,
  useUpdateCatalogTaxDefaults,
} from "@/features/catalog/api";
import { useTaxCodes } from "./api";
import { documentAttachableTaxCodes, findTaxCode } from "./document";

function shortId(value: string): string {
  return value.slice(0, 8);
}

export function CatalogTaxDefaults({ organizationId }: { organizationId: string }) {
  const items = useCatalogItems(organizationId);
  const taxCodes = useTaxCodes(organizationId);
  const update = useUpdateCatalogTaxDefaults(organizationId);
  const allCodes = taxCodes.data?.data ?? [];
  const attachable = documentAttachableTaxCodes(allCodes);

  const changeDefault = async (
    itemId: string,
    direction: "SELL" | "BUY",
    value: string,
  ) => {
    try {
      await update.mutateAsync({
        itemId,
        ...(direction === "SELL"
          ? { sales_tax_code_id: value || null }
          : { purchase_tax_code_id: value || null }),
      });
      toast.success(direction === "SELL" ? "Sales tax default updated" : "Purchase tax default updated");
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Catalog tax default update failed");
    }
  };

  const options = (currentId: string | null) => {
    const current = findTaxCode(allCodes, currentId);
    const currentAttachable = attachable.some((code) => code.id === currentId);
    return (
      <>
        <option value="">No default</option>
        {currentId && !currentAttachable ? (
          <option value={currentId} disabled>
            {(current?.code ?? shortId(currentId)) + " · unavailable for new documents"}
          </option>
        ) : null}
        {attachable.map((code) => (
          <option key={code.id} value={code.id}>
            {code.code + " · " + code.name + " · " + (code.current_version?.rate ?? "—")}
          </option>
        ))}
      </>
    );
  };

  return (
    <Card>
      <CardContent className="p-5">
        <div>
          <div className="font-medium">Catalog tax defaults</div>
          <p className="mt-1 text-sm text-muted-foreground">
            Set the default document TaxCode inherited by catalog-backed lines.
            Sales defaults flow into SELL documents; purchase defaults flow into
            BUY documents. A line may still choose another TaxCode explicitly.
          </p>
        </div>

        {items.isLoading || taxCodes.isLoading ? (
          <div className="mt-5 space-y-2">
            {Array.from({ length: 3 }, (_, index) => (
              <Skeleton key={index} className="h-20 w-full" />
            ))}
          </div>
        ) : items.isError ? (
          <div className="mt-5">
            <ErrorState
              title="Catalog items unavailable"
              description={items.error.message}
              retry={{ label: "Retry", onClick: () => void items.refetch() }}
            />
          </div>
        ) : taxCodes.isError ? (
          <div className="mt-5">
            <ErrorState
              title="TaxCodes unavailable"
              description={taxCodes.error.message}
              retry={{ label: "Retry", onClick: () => void taxCodes.refetch() }}
            />
          </div>
        ) : items.data?.data.length ? (
          <div className="mt-5 divide-y rounded-md border">
            {items.data.data.map((item) => {
              const isUpdating = update.isPending && update.variables?.itemId === item.id;
              return (
                <div key={item.id} className="grid gap-4 px-4 py-4 lg:grid-cols-12 lg:items-start">
                  <div className="lg:col-span-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{item.name}</span>
                      <Badge variant="neutral">{item.type}</Badge>
                      {isUpdating ? <Badge variant="processing">Saving</Badge> : null}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {item.code ?? item.sku ?? shortId(item.id)}
                    </div>
                  </div>

                  <div className="lg:col-span-4">
                    <label className="text-xs font-medium" htmlFor={"sales-tax-" + item.id}>
                      Sales default
                    </label>
                    {item.sales_enabled ? (
                      <select
                        id={"sales-tax-" + item.id}
                        value={item.sales_tax_code_id ?? ""}
                        disabled={isUpdating}
                        onChange={(event) => void changeDefault(item.id, "SELL", event.target.value)}
                        className="mt-1 w-full rounded-md border bg-surface px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring disabled:opacity-60"
                      >
                        {options(item.sales_tax_code_id)}
                      </select>
                    ) : (
                      <div className="mt-1 text-sm text-muted-foreground">Sales disabled</div>
                    )}
                  </div>

                  <div className="lg:col-span-4">
                    <label className="text-xs font-medium" htmlFor={"purchase-tax-" + item.id}>
                      Purchase default
                    </label>
                    {item.purchase_enabled ? (
                      <select
                        id={"purchase-tax-" + item.id}
                        value={item.purchase_tax_code_id ?? ""}
                        disabled={isUpdating}
                        onChange={(event) => void changeDefault(item.id, "BUY", event.target.value)}
                        className="mt-1 w-full rounded-md border bg-surface px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring disabled:opacity-60"
                      >
                        {options(item.purchase_tax_code_id)}
                      </select>
                    ) : (
                      <div className="mt-1 text-sm text-muted-foreground">Purchasing disabled</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="mt-5 rounded-md border border-dashed p-3 text-sm text-muted-foreground">
            No active Catalog items are available yet. Defaults can be configured here once Catalog items exist.
          </div>
        )}

        <p className="mt-4 text-xs text-muted-foreground">
          Only active, effective, ON_DOCUMENT TaxCodes are offered. WHT is not an additive document-line tax.
        </p>
      </CardContent>
    </Card>
  );
}
