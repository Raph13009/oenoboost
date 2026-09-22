import { redirect } from "next/navigation";
import { buildAopDetailHref, decodeRouteSlug } from "@/features/vignoble/lib/aop-slug";

type Props = {
  params: Promise<{ region: string; subregion: string; aop: string }>;
};

export default async function AppellationPage({ params }: Props) {
  const { region: regionSlug, subregion: subregionSlug, aop: aopSlug } =
    await params;
  redirect(
    buildAopDetailHref(decodeRouteSlug(regionSlug), decodeRouteSlug(aopSlug), {
      subregion: decodeRouteSlug(subregionSlug),
    }),
  );
}
