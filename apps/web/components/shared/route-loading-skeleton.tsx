import { cn } from "@/lib/utils";

type Props = {
  variant?: "page" | "map" | "hub";
  className?: string;
};

/** Shared pulse skeleton for route-level `loading.tsx` files. */
export function RouteLoadingSkeleton({ variant = "page", className }: Props) {
  if (variant === "map") {
    return (
      <div className={cn("flex flex-col gap-4", className)} aria-busy="true">
        <div className="h-8 w-40 animate-pulse rounded bg-muted" />
        <div className="h-[min(70dvh,560px)] w-full animate-pulse rounded-xl bg-muted" />
        <div className="h-16 w-full animate-pulse rounded-xl bg-muted" />
      </div>
    );
  }

  if (variant === "hub") {
    return (
      <div className={cn("flex flex-col gap-6", className)} aria-busy="true">
        <div className="h-4 w-24 animate-pulse rounded bg-muted" />
        <div className="h-12 w-72 max-w-full animate-pulse rounded bg-muted" />
        <div className="h-4 w-full max-w-md animate-pulse rounded bg-muted" />
        <div className="mt-2 grid gap-3 sm:grid-cols-3">
          <div className="h-28 animate-pulse rounded-xl bg-muted" />
          <div className="h-28 animate-pulse rounded-xl bg-muted" />
          <div className="h-28 animate-pulse rounded-xl bg-muted" />
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} aria-busy="true">
      <div className="h-6 w-28 animate-pulse rounded bg-muted" />
      <div className="h-10 w-56 max-w-full animate-pulse rounded bg-muted" />
      <div className="flex flex-col gap-3">
        <div className="h-16 animate-pulse rounded-xl bg-muted" />
        <div className="h-16 animate-pulse rounded-xl bg-muted" />
        <div className="h-16 animate-pulse rounded-xl bg-muted" />
        <div className="h-16 animate-pulse rounded-xl bg-muted" />
      </div>
    </div>
  );
}
