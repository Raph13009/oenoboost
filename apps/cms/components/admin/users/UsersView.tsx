"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter, usePathname } from "next/navigation";
import type { User } from "@/app/admin/(cms)/users/actions";
import { UsersTable } from "./UsersTable";
import { UserDetailPanel } from "./UserDetailPanel";

type Props = {
  initialUsers: User[];
  total: number;
  currentPage: number;
  searchQuery: string;
  planFilter: string;
  levelFilter: string;
};

export function UsersView({
  initialUsers,
  total,
  currentPage,
  searchQuery,
  planFilter,
  levelFilter,
}: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [router, pathname] = [useRouter(), usePathname()];
  const [isPending, startTransition] = useTransition();

  const buildUrl = (updates: { page?: number; q?: string; plan?: string; level?: string }) => {
    const params = new URLSearchParams();
    const page = updates.page ?? currentPage;
    const q = updates.q !== undefined ? updates.q : searchQuery;
    const plan = updates.plan !== undefined ? updates.plan : planFilter;
    const level = updates.level !== undefined ? updates.level : levelFilter;
    if (page > 1) params.set("page", String(page));
    if (q) params.set("q", q);
    if (plan && plan !== "all") params.set("plan", plan);
    if (level && level !== "all") params.set("level", level);
    const s = params.toString();
    return pathname + (s ? `?${s}` : "");
  };

  const onSearchChange = (q: string) => {
    startTransition(() => router.push(buildUrl({ q, page: 1 })));
  };
  const onPlanFilterChange = (plan: string) => {
    startTransition(() => router.push(buildUrl({ plan, page: 1 })));
  };
  const onLevelFilterChange = (level: string) => {
    startTransition(() => router.push(buildUrl({ level, page: 1 })));
  };
  const onPageChange = (page: number) => {
    startTransition(() => router.push(buildUrl({ page })));
  };

  useEffect(() => {
    const hasNextPage = currentPage * 25 < total;
    if (!hasNextPage) return;
    router.prefetch(buildUrl({ page: currentPage + 1 }));
  }, [buildUrl, currentPage, router, total]);

  return (
    <div className="flex min-h-0 flex-1 overflow-hidden">
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <UsersTable
          users={initialUsers}
          total={total}
          currentPage={currentPage}
          searchQuery={searchQuery}
          planFilter={planFilter}
          levelFilter={levelFilter}
          onSearchChange={onSearchChange}
          onPlanFilterChange={onPlanFilterChange}
          onLevelFilterChange={onLevelFilterChange}
          onPageChange={onPageChange}
          selectedId={selectedId}
          onSelect={setSelectedId}
          isPending={isPending}
        />
      </div>
      <div className="flex min-h-0 w-[420px] shrink-0 flex-col overflow-hidden border-l border-slate-200">
        {selectedId ? (
          <UserDetailPanel
            userId={selectedId}
            onClose={() => setSelectedId(null)}
            onDeleted={() => setSelectedId(null)}
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-slate-50/50 text-sm text-slate-500">
            Sélectionnez un utilisateur pour voir le détail.
          </div>
        )}
      </div>
    </div>
  );
}
