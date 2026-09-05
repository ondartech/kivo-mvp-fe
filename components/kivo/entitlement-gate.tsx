"use client";

import * as React from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useEntitlements } from "@/features/billing/api";

export interface EntitlementGateProps {
  capability: string;
  orgId?: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  title?: string;
  description?: string;
  requiredPlanName?: string;
}

export function EntitlementGate({
  capability,
  orgId = "org_demo",
  children,
  fallback,
  title,
  description,
  requiredPlanName = "Business",
}: EntitlementGateProps) {
  const { data: entitlements, isLoading } = useEntitlements(orgId);

  if (isLoading) {
    return <>{children}</>;
  }

  const isEntitled = Boolean(entitlements?.capabilities?.[capability]);

  if (isEntitled) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  return (
    <Card className="rounded-xl border border-warning/30 bg-warning-subtle/30 shadow-subtle p-6 text-center max-w-2xl mx-auto my-6">
      <CardContent className="p-0 space-y-4">
        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-warning-subtle text-warning">
          <svg
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-center gap-2">
            <h3 className="text-base font-semibold tracking-tight text-foreground">
              {title || `Available on the ${requiredPlanName} plan`}
            </h3>
            <Badge variant="warning">{requiredPlanName}</Badge>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto">
            {description ||
              `This feature is part of the ${requiredPlanName} plan. Upgrade your subscription to unlock this capability without losing any existing data.`}
          </p>
        </div>

        <div className="pt-2 flex justify-center gap-3">
          <Link href="/settings/subscription">
            <Button size="sm" variant="primary">
              Upgrade Subscription
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button size="sm" variant="outline">
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
