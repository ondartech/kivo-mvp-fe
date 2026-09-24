"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ErrorState } from "@/components/kivo/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useTaxComplianceCalendar } from "./api";
import { humanizeTaxValue } from "./schema";

function deadlineVariant(
  state: "UPCOMING" | "DUE_TODAY" | "PAST_DUE",
): "info" | "warning" | "critical" {
  if (state === "PAST_DUE") return "critical";
  if (state === "DUE_TODAY") return "warning";
  return "info";
}

export function TaxComplianceCalendarPanel({
  organizationId,
}: {
  organizationId: string;
}) {
  const calendar = useTaxComplianceCalendar(organizationId);

  return (
    <Card>
      <CardContent className="p-5">
        <div>
          <div className="font-medium">Compliance calendar</div>
          <p className="mt-1 text-sm text-muted-foreground">
            Projected filing deadlines from effective tax registrations. Deadline
            state is not filing status; completion evidence is not tracked yet.
          </p>
        </div>

        {calendar.isLoading ? (
          <div className="mt-5 space-y-2">
            {Array.from({ length: 3 }, (_, index) => (
              <Skeleton key={index} className="h-16 w-full" />
            ))}
          </div>
        ) : calendar.isError ? (
          <div className="mt-5">
            <ErrorState
              title="Compliance calendar unavailable"
              description={calendar.error.message}
              retry={{
                label: "Retry",
                onClick: () => void calendar.refetch(),
              }}
            />
          </div>
        ) : calendar.data ? (
          <div className="mt-5 space-y-4">
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span>
                {calendar.data.from_date} → {calendar.data.to_date}
              </span>
              <Badge
                variant={
                  calendar.data.coverage.schedule_coverage === "COMPLETE"
                    ? "success"
                    : "warning"
                }
              >
                {humanizeTaxValue(calendar.data.coverage.schedule_coverage)} schedule
              </Badge>
              <span>
                {calendar.data.coverage.scheduled_registration_count} scheduled ·{" "}
                {calendar.data.coverage.unscheduled_registration_count} missing rule
              </span>
            </div>

            {calendar.data.items.length ? (
              <div className="divide-y rounded-md border">
                {calendar.data.items.map((item) => (
                  <div
                    key={[
                      item.registration_id,
                      item.period_start,
                      item.period_end,
                    ].join(":")}
                    className="grid gap-2 px-4 py-3 text-sm md:grid-cols-12 md:items-center"
                  >
                    <div className="md:col-span-2">
                      <div className="font-medium">{item.authority_code}</div>
                      <div className="text-xs text-muted-foreground">
                        {humanizeTaxValue(item.registration_type)}
                      </div>
                    </div>
                    <div className="md:col-span-3">
                      <div className="text-xs text-muted-foreground">Tax period</div>
                      <div className="font-mono text-xs">
                        {item.period_start} → {item.period_end}
                      </div>
                    </div>
                    <div className="md:col-span-2">
                      <div className="text-xs text-muted-foreground">Due</div>
                      <div className="font-medium">{item.due_date}</div>
                    </div>
                    <div className="md:col-span-2">
                      <Badge variant={deadlineVariant(item.deadline_state)}>
                        {humanizeTaxValue(item.deadline_state)}
                      </Badge>
                    </div>
                    <div className="md:col-span-3 text-xs text-muted-foreground">
                      {item.deadline_authority_reference}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
                No recurring filing deadlines fall in this calendar window.
              </div>
            )}

            {calendar.data.gaps.length ? (
              <div className="rounded-md border p-4">
                <div className="text-sm font-medium">Schedule gaps</div>
                <div className="mt-2 space-y-2">
                  {calendar.data.gaps.map((gap) => (
                    <div
                      key={gap.registration_id}
                      className="flex flex-col gap-1 text-sm sm:flex-row sm:items-center sm:justify-between"
                    >
                      <span>
                        {gap.authority_code} ·{" "}
                        {humanizeTaxValue(gap.registration_type)}
                      </span>
                      <Badge
                        variant={
                          gap.reason === "DEADLINE_RULE_MISSING"
                            ? "warning"
                            : "neutral"
                        }
                      >
                        {humanizeTaxValue(gap.reason)}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {calendar.data.coverage.warnings.length ? (
              <div className="space-y-1 text-xs text-muted-foreground">
                {calendar.data.coverage.warnings.map((warning) => (
                  <p key={warning}>{warning}</p>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
