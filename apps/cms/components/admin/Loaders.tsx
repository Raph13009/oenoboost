"use client";

import { useEffect, useState } from "react";

export function useDelayedBusy(isBusy: boolean, delayMs = 150): boolean {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!isBusy) {
      setVisible(false);
      return;
    }
    const t = window.setTimeout(() => setVisible(true), delayMs);
    return () => window.clearTimeout(t);
  }, [isBusy, delayMs]);

  return visible;
}

function SkeletonLine({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-slate-200 ${className}`} />;
}

export function TableSkeleton({
  rows = 8,
  columns = 5,
}: {
  rows?: number;
  columns?: number;
}) {
  return (
    <div className="p-3">
      <div className="space-y-2">
        {Array.from({ length: rows }).map((_, rowIdx) => (
          <div
            key={rowIdx}
            className="grid gap-3 rounded border border-slate-100 bg-white px-3 py-2"
            style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
          >
            {Array.from({ length: columns }).map((__, colIdx) => (
              <SkeletonLine key={colIdx} className="h-3.5 w-full" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function DrawerSkeleton() {
  return (
    <div className="h-full border-l border-slate-200 bg-white p-4">
      <div className="space-y-3">
        <SkeletonLine className="h-6 w-2/5" />
        <div className="space-y-2 rounded border border-slate-200 bg-slate-50/50 p-3">
          <SkeletonLine className="h-3 w-1/3" />
          <SkeletonLine className="h-8 w-full" />
          <SkeletonLine className="h-3 w-1/4" />
          <SkeletonLine className="h-8 w-full" />
        </div>
        <div className="space-y-2 rounded border border-slate-200 bg-slate-50/50 p-3">
          <SkeletonLine className="h-3 w-1/3" />
          <SkeletonLine className="h-20 w-full" />
        </div>
      </div>
    </div>
  );
}

