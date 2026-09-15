import { WorkspacePage } from "@/components/admin/WorkspacePage";
import { getWineRegionsPaginated } from "./actions";
import { WineRegionsView } from "@/components/admin/wine-regions/WineRegionsView";

export default async function WineRegionsPage({
  searchParams,
}: {
  searchParams?: { page?: string };
}) {
  const pageSize = 20;
  const pageNumRaw = searchParams?.page ?? "1";
  const pageNum = Number.parseInt(pageNumRaw, 10);
  const currentPage = Number.isFinite(pageNum) && pageNum >= 1 ? pageNum : 1;
  const offset = (currentPage - 1) * pageSize;

  let regions: Awaited<ReturnType<typeof getWineRegionsPaginated>>["regions"] = [];
  let hasPrev = false;
  let hasNext = false;
  try {
    const res = await getWineRegionsPaginated({ limit: pageSize, offset });
    ({ regions, hasPrev, hasNext } = res);
  } catch {
    regions = [];
    hasPrev = false;
    hasNext = false;
  }

  return (
    <WorkspacePage
      title="Régions"
      description="Gérez les régions. Sélectionnez une ligne pour modifier le panneau."
      flushLeft
    >
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <WineRegionsView
          regions={regions}
          currentPage={currentPage}
          hasPrev={hasPrev}
          hasNext={hasNext}
        />
      </div>
    </WorkspacePage>
  );
}
