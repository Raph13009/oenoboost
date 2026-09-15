import { WorkspacePage } from "@/components/admin/WorkspacePage";
import { getWineRegionsLite } from "@/app/admin/(cms)/wine-regions/actions";
import { getWineSubregionsPaginated } from "./actions";
import { WineSubregionsView } from "@/components/admin/wine-subregions/WineSubregionsView";

export default async function WineSubregionsPage({
  searchParams,
}: {
  searchParams?: { page?: string };
}) {
  const pageSize = 20;
  const pageNumRaw = searchParams?.page ?? "1";
  const pageNum = Number.parseInt(pageNumRaw, 10);
  const currentPage = Number.isFinite(pageNum) && pageNum >= 1 ? pageNum : 1;
  const offset = (currentPage - 1) * pageSize;

  let subregions: Awaited<ReturnType<typeof getWineSubregionsPaginated>>["subregions"] = [];
  let hasPrev = false;
  let hasNext = false;
  let regions: Awaited<ReturnType<typeof getWineRegionsLite>> = [];
  try {
    const [subregionsRes, regionsRes] = await Promise.all([
      getWineSubregionsPaginated({ limit: pageSize, offset }),
      getWineRegionsLite(),
    ]);
    ({ subregions, hasPrev, hasNext } = subregionsRes);
    regions = regionsRes;
  } catch {
    subregions = [];
    regions = [];
    hasPrev = false;
    hasNext = false;
  }

  return (
    <WorkspacePage
      title="Sous-régions"
      description="Gérez les sous-régions. Sélectionnez une ligne pour modifier le panneau."
      flushLeft
    >
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <WineSubregionsView
          subregions={subregions}
          regions={regions}
          currentPage={currentPage}
          hasPrev={hasPrev}
          hasNext={hasNext}
        />
      </div>
    </WorkspacePage>
  );
}
