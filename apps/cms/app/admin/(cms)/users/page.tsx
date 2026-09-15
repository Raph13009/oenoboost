import { WorkspacePage } from "@/components/admin/WorkspacePage";
import { getUsers } from "./actions";
import { UsersView } from "@/components/admin/users/UsersView";

type PageProps = {
  searchParams: Promise<{ page?: string; q?: string; plan?: string; level?: string }> | { page?: string; q?: string; plan?: string; level?: string };
};

export default async function UsersPage({ searchParams }: PageProps) {
  const params = typeof (searchParams as Promise<unknown>).then === "function"
    ? await (searchParams as Promise<{ page?: string; q?: string; plan?: string; level?: string }>)
    : (searchParams as { page?: string; q?: string; plan?: string; level?: string });

  const page = Math.max(1, parseInt(params?.page ?? "1", 10) || 1);
  const { users, total } = await getUsers({
    page,
    pageSize: 25,
    search: params?.q?.trim() || undefined,
    plan: params?.plan && params.plan !== "all" ? params.plan : undefined,
    level: params?.level && params.level !== "all" ? params.level : undefined,
    sortBy: "created_at",
    order: "desc",
  });

  return (
    <WorkspacePage
      title="Utilisateurs"
      description="Consultez et gérez les utilisateurs. Cliquez sur une ligne pour ouvrir le détail."
      flushLeft
    >
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <UsersView
          initialUsers={users}
          total={total}
          currentPage={page}
          searchQuery={params?.q ?? ""}
          planFilter={params?.plan ?? "all"}
          levelFilter={params?.level ?? "all"}
        />
      </div>
    </WorkspacePage>
  );
}
