import Link from "next/link";
import { notFound } from "next/navigation";
import { VignoblePointsMap } from "@/components/vignoble/VignoblePointsMap";
import { getAppellationsForSubregion, getRegionBySlug, getSubregionBySlug } from "@/lib/vignoble-data";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function VignobleAppellationsPage({
  params,
}: {
  params: { region: string; subregion: string };
}) {
  const region = await getRegionBySlug(params.region);
  if (!region) notFound();

  const subregion = await getSubregionBySlug(region.id, params.subregion);
  if (!subregion) notFound();

  const appellations = await getAppellationsForSubregion({
    id: subregion.id,
    slug: subregion.slug,
    name_fr: subregion.name_fr,
    region_id: region.id,
    region_name_fr: region.name_fr,
  });

  const points = appellations.map((appellation) => ({
    id: appellation.id,
    name: appellation.name_fr,
    slug: appellation.slug,
    lat: appellation.centroid_lat as number,
    lng: appellation.centroid_lng as number,
    href: `/vignoble/${region.slug}/${subregion.slug}/${appellation.slug}`,
  }));

  return (
    <main className="h-screen p-4">
      <div className="mb-3 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-slate-900">
          Vignoble - {region.name_fr} - {subregion.name_fr} - AOP
        </h1>
        <Link
          href={`/vignoble/${region.slug}`}
          className="text-sm text-slate-600 hover:text-slate-900"
        >
          Retour sous-regions
        </Link>
      </div>
      <div className="h-[calc(100%-2.25rem)]">
        <VignoblePointsMap
          title={`AOP - ${subregion.name_fr}`}
          subtitle="Clique une AOP pour ouvrir sa fiche"
          points={points}
          center={
            subregion.centroid_lng != null && subregion.centroid_lat != null
              ? [subregion.centroid_lng, subregion.centroid_lat]
              : [2.2, 46.2]
          }
          zoom={9}
        />
      </div>
    </main>
  );
}
