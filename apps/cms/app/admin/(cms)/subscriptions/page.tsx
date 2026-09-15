import { WorkspacePage } from "@/components/admin/WorkspacePage";
import { getSubscriptions } from "./actions";
import { SubscriptionsView } from "@/components/admin/subscriptions/SubscriptionsView";

type PageProps = {
  searchParams:
    | Promise<{ page?: string; q?: string; plan?: string; status?: string }>
    | { page?: string; q?: string; plan?: string; status?: string };
};

export default async function SubscriptionsPage({ searchParams }: PageProps) {
  const params =
    typeof (searchParams as Promise<unknown>).then === "function"
      ? await (searchParams as Promise<{ page?: string; q?: string; plan?: string; status?: string }>)
      : (searchParams as { page?: string; q?: string; plan?: string; status?: string });

  const page = Math.max(1, parseInt(params?.page ?? "1", 10) || 1);
  const { subscriptions, total } = await getSubscriptions({
    page,
    pageSize: 25,
    search: params?.q?.trim() || undefined,
    plan: params?.plan && params.plan !== "all" ? params.plan : undefined,
    status: params?.status && params.status !== "all" ? params.status : undefined,
    sortBy: "created_at",
    order: "desc",
  });

  return (
    <WorkspacePage
      title="Abonnements"
      description="Consultez les abonnements et la facturation. Stripe reste la source de vérité."
      flushLeft
    >
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <SubscriptionsView
          initialSubscriptions={subscriptions}
          total={total}
          currentPage={page}
          searchQuery={params?.q ?? ""}
          planFilter={params?.plan ?? "all"}
          statusFilter={params?.status ?? "all"}
        />
      </div>
    </WorkspacePage>
  );
}
