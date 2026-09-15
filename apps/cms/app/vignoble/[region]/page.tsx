import Link from "next/link";
import { notFound } from "next/navigation";
import { VignoblePointsMap } from "@/components/vignoble/VignoblePointsMap";
import { getRegionBySlug, getSubregionsForRegion } from "@/lib/vignoble-data";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function VignobleSubregionsPage({
  params,
}: {
  params: { region: string };
}) {
  const region = await getRegionBySlug(params.region);
  if (!region) notFound();

  const subregions = await getSubregionsForRegion(region.id);
  const points = subregions.map((subregion) => ({
    id: subregion.id,
    name: subregion.name_fr,
    slug: subregion.slug,
    lat: subregion.centroid_lat as number,
    lng: subregion.centroid_lng as number,
    href: `/vignoble/${region.slug}/${subregion.slug}`,
  }));

  return (
    <main className="h-screen p-4">
      <div className="mb-3 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-slate-900">
          Vignoble - {region.name_fr} - Sous-regions
        </h1>
        <Link href="/vignoble" className="text-sm text-slate-600 hover:text-slate-900">
          Retour regions
        </Link>
      </div>
      <div className="h-[calc(100%-2.25rem)]">
        <VignoblePointsMap
          title={`Sous-regions - ${region.name_fr}`}
          subtitle="Clique une sous-region pour afficher les AOP"
          points={points}
          center={
            region.centroid_lng != null && region.centroid_lat != null
              ? [region.centroid_lng, region.centroid_lat]
              : [2.2, 46.2]
          }
          zoom={7}
        />
      </div>
    </main>
  );
}
