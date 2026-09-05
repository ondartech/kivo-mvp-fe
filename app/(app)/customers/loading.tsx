import { Skeleton } from "@/components/ui/skeleton";
import { TableSkeleton } from "@/components/kivo/skeletons";

export default function CustomersLoading() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-7 w-36" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-9 w-32 rounded-md" />
      </div>

      <div className="flex gap-2">
        <Skeleton className="h-9 w-full max-w-md rounded-md" />
        <Skeleton className="h-7 w-12 rounded-full" />
        <Skeleton className="h-7 w-16 rounded-full" />
      </div>

      <TableSkeleton rows={8} />
    </div>
  );
}
