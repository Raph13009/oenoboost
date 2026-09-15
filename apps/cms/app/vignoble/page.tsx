import Link from "next/link";
import { VignoblePointsMap } from "@/components/vignoble/VignoblePointsMap";
import { getVignobleRegions } from "@/lib/vignoble-data";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function VignobleRegionsPage() {
  const regions = await getVignobleRegions();
  const points = regions.map((region) => ({
    id: region.id,
    name: region.name_fr,
    slug: region.slug,
    lat: region.centroid_lat as number,
    lng: region.centroid_lng as number,
    href: `/vignoble/${region.slug}`,
  }));

  return (
    <main className="h-screen p-4">
      <div className="mb-3 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-slate-900">Vignoble - Regions</h1>
        <Link href="/admin" className="text-sm text-slate-600 hover:text-slate-900">
          Retour CMS
        </Link>
      </div>
      <div className="h-[calc(100%-2.25rem)]">
        <VignoblePointsMap
          title="Vue Regions"
          subtitle="Clique une region pour ouvrir ses sous-regions"
          points={points}
          center={[2.2, 46.2]}
          zoom={5}
        />
      </div>
    </main>
  );
}
