import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getAppellationBySlug,
  getAppellationsForSubregion,
  getRegionBySlug,
  getSubregionBySlug,
} from "@/lib/vignoble-data";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function VignobleAopPage({
  params,
}: {
  params: { region: string; subregion: string; aop: string };
}) {
  const region = await getRegionBySlug(params.region);
  if (!region) notFound();

  const subregion = await getSubregionBySlug(region.id, params.subregion);
  if (!subregion) notFound();

  const appellation = await getAppellationBySlug(params.aop);
  if (!appellation) notFound();

  const subregionAppellations = await getAppellationsForSubregion({
    id: subregion.id,
    slug: subregion.slug,
    name_fr: subregion.name_fr,
    region_id: region.id,
    region_name_fr: region.name_fr,
  });
  const isInSubregion = subregionAppellations.some((aop) => aop.id === appellation.id);
  if (!isInSubregion) notFound();

  return (
    <main className="min-h-screen p-6">
      <div className="mx-auto max-w-3xl rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 text-sm text-slate-500">
          <Link href="/vignoble" className="hover:text-slate-800">
            Vignoble
          </Link>
          {" / "}
          <Link href={`/vignoble/${region.slug}`} className="hover:text-slate-800">
            {region.name_fr}
          </Link>
          {" / "}
          <Link href={`/vignoble/${region.slug}/${subregion.slug}`} className="hover:text-slate-800">
            {subregion.name_fr}
          </Link>
        </div>

        <h1 className="text-2xl font-semibold text-slate-900">{appellation.name_fr}</h1>
        <div className="mt-2 text-sm text-slate-600">Slug: {appellation.slug}</div>
        <div className="mt-2 text-sm text-slate-600">
          Centroid: {appellation.centroid_lat ?? "—"}, {appellation.centroid_lng ?? "—"}
        </div>
      </div>
    </main>
  );
}
