"use client";

import { EmptyState, ErrorState } from "@/components/kivo/empty-state";
import { PageHeader } from "@/components/kivo/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useNumberingPolicies,
  useSetNumberingPolicy,
  type NumberingScope,
} from "@/features/organization/api";
import {
  NUMBERING_DOCUMENT_LABELS,
  numberingReferenceExample,
} from "@/features/organization/numbering";
import { useActiveOrganizationId } from "@/hooks/use-active-organization";

export default function NumberingSettingsPage() {
  const organizationId = useActiveOrganizationId();
  const policies = useNumberingPolicies(organizationId ?? "");
  const setPolicy = useSetNumberingPolicy(organizationId ?? "");

  if (!organizationId) {
    return (
      <EmptyState
        title="Organization context required"
        description="Select an organization workspace before managing document numbering."
      />
    );
  }

  const changeScope = (
    documentType: keyof typeof NUMBERING_DOCUMENT_LABELS,
    scope: NumberingScope,
  ) => {
    setPolicy.mutate({ documentType, scope });
  };

  return (
    <div className="max-w-[960px] space-y-6">
      <PageHeader
        eyebrow="Business settings"
        title="Document numbering"
        description="Choose whether each commercial document family uses one Organization sequence or independent Branch sequences."
      />

      <Card>
        <CardContent className="p-5">
          <div className="text-sm font-medium">Numbering policy</div>
          <p className="mt-1 text-sm text-muted-foreground">
            Organization numbering produces references such as INV-0001. Branch
            numbering includes the immutable Branch code, for example
            INV-LAG-0001, with a separate sequence per Branch.
          </p>
          <div className="mt-4 rounded-md border border-dashed p-3 text-xs text-muted-foreground">
            Policy changes affect future number allocation only. Ondar never
            renumbers documents that already have a reference, and sequence values
            are not reused when you switch scope.
          </div>
        </CardContent>
      </Card>

      {policies.isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-32 w-full" />
          ))}
        </div>
      ) : policies.isError ? (
        <ErrorState
          title="Numbering policies unavailable"
          description={policies.error.message}
          retry={{ label: "Retry", onClick: () => void policies.refetch() }}
        />
      ) : policies.data?.length ? (
        <div className="space-y-3">
          {policies.data.map((policy) => {
            const isUpdating =
              setPolicy.isPending &&
              setPolicy.variables?.documentType === policy.document_type;

            return (
              <Card key={policy.document_type}>
                <CardContent className="p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="font-medium">
                          {NUMBERING_DOCUMENT_LABELS[policy.document_type]}
                        </div>
                        <Badge variant={policy.explicit ? "success" : "neutral"}>
                          {policy.explicit ? "Explicit" : "Default"}
                        </Badge>
                      </div>
                      <div className="mt-1 text-sm text-muted-foreground">
                        Current scope:{" "}
                        <span className="font-medium text-foreground">
                          {policy.scope === "BRANCH"
                            ? "Per Branch"
                            : "Organization-wide"}
                        </span>
                      </div>
                      <div className="mt-2 text-xs text-muted-foreground">
                        Example:{" "}
                        <code className="rounded bg-neutral-50 px-1.5 py-0.5 text-foreground">
                          {numberingReferenceExample(policy)}
                        </code>
                      </div>
                    </div>

                    <div
                      className="flex flex-wrap gap-2"
                      aria-label={`Numbering scope for ${
                        NUMBERING_DOCUMENT_LABELS[policy.document_type]
                      }`}
                    >
                      <Button
                        size="sm"
                        variant={
                          policy.scope === "ORGANIZATION"
                            ? "primary"
                            : "outline"
                        }
                        disabled={
                          isUpdating || policy.scope === "ORGANIZATION"
                        }
                        loading={
                          isUpdating &&
                          setPolicy.variables?.scope === "ORGANIZATION"
                        }
                        onClick={() =>
                          changeScope(policy.document_type, "ORGANIZATION")
                        }
                      >
                        Organization-wide
                      </Button>
                      <Button
                        size="sm"
                        variant={
                          policy.scope === "BRANCH" ? "primary" : "outline"
                        }
                        disabled={isUpdating || policy.scope === "BRANCH"}
                        loading={
                          isUpdating &&
                          setPolicy.variables?.scope === "BRANCH"
                        }
                        onClick={() =>
                          changeScope(policy.document_type, "BRANCH")
                        }
                      >
                        Per Branch
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState
          title="No numbering policies"
          description="The Organization API did not return any migrated document families."
        />
      )}

      {setPolicy.isError ? (
        <Card>
          <CardContent className="p-4 text-sm">
            <div className="font-medium">Numbering policy was not changed</div>
            <div className="mt-1 text-muted-foreground">
              {setPolicy.error.message}
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
