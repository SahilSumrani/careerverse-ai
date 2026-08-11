import { Skeleton } from "@/components/ui/states";

export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-4">
      <Skeleton className="h-10 w-56" />
      <Skeleton className="h-4 w-80 max-w-full" />
      <div className="grid gap-4 md:grid-cols-2">
        <Skeleton className="h-44" />
        <Skeleton className="h-44" />
      </div>
    </div>
  );
}
