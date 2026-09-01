import { ReactNode } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function EmptyState({
  title,
  description,
  action,
  secondary,
}: {
  title: string;
  description: string;
  action?: { label: string; href?: string; onClick?: () => void };
  secondary?: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-dashed bg-surface p-10 text-center">
      <h3 className="text-sm font-semibold">{title}</h3>
      <p className="mx-auto mt-1 max-w-[48ch] text-sm text-muted-foreground">{description}</p>
      {action ? (
        <div className="mt-4">
          {action.href ? (
            <Link href={action.href}>
              <Button onClick={action.onClick}>{action.label}</Button>
            </Link>
          ) : (
            <Button onClick={action.onClick}>{action.label}</Button>
          )}
        </div>
      ) : null}
      {secondary ? <div className="mt-3 text-sm">{secondary}</div> : null}
    </div>
  );
}

export function ErrorState({
  title,
  description,
  retry,
}: {
  title: string;
  description: string;
  retry?: { label: string; onClick: () => void };
}) {
  return (
    <div className="rounded-lg border border-critical/20 bg-critical-subtle p-6">
      <h3 className="text-sm font-semibold text-critical">{title}</h3>
      <p className="mt-1 text-sm text-critical/90">{description}</p>
      {retry ? (
        <div className="mt-3">
          <Button variant="outline" size="sm" onClick={retry.onClick}>
            {retry.label}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
