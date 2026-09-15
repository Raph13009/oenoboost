"use server";

import { getSupabaseAdmin } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { randomUUID } from "crypto";

export type SoilType = {
  id: string;
  slug: string;
  name_fr: string;
  name_en: string | null;
  photo_url: string | null;
  geological_origin_fr: string | null;
  geological_origin_en: string | null;
  regions_fr: string | null;
  regions_en: string | null;
  mineral_composition_fr: string | null;
  mineral_composition_en: string | null;
  wine_influence_fr: string | null;
  wine_influence_en: string | null;
  emblematic_aop_fr: string | null;
  emblematic_aop_en: string | null;
  carousel_order: number | null;
  is_premium: boolean;
  status: string;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type SoilTypeLinkedAppellation = {
  id: string;
  name: string;
  region_name_fr: string | null;
};

type AopRegionRelation = { name_fr: string | null } | { name_fr: string | null }[] | null;
type AopSubregionRelation =
  | {
      wine_regions: AopRegionRelation;
    }
  | {
      wine_regions: AopRegionRelation;
    }[]
  | null;
type AopSubregionLinkRelation = {
  subregions: AopSubregionRelation;
};
type AopJoinRow = {
  id: number;
  name: string;
  aop_subregion_link: AopSubregionLinkRelation[] | null;
};

function getFirstRelation<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function toAopId(id: string | number | null | undefined): number | null {
  if (id === null || id === undefined || id === "") return null;
  const n = typeof id === "number" ? id : Number(id);
  return Number.isFinite(n) ? n : null;
}

export type SoilTypeListItem = Pick<
  SoilType,
  "id" | "slug" | "name_fr" | "name_en" | "status" | "updated_at"
>;

const SOIL_TYPE_LIST_COLUMNS = "id,slug,name_fr,name_en,status,updated_at";
const SOIL_TYPE_DETAIL_COLUMNS =
  "id,slug,name_fr,name_en,photo_url,geological_origin_fr,geological_origin_en,regions_fr,regions_en,mineral_composition_fr,mineral_composition_en,wine_influence_fr,wine_influence_en,emblematic_aop_fr,emblematic_aop_en,carousel_order,is_premium,status,published_at,created_at,updated_at,deleted_at";

export async function getSoilTypesLite(): Promise<Array<Pick<SoilType, "id" | "name_fr" | "slug">>> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("soil_types")
    .select("id,name_fr,slug")
    .is("deleted_at", null)
    .order("name_fr", { ascending: true });
  if (error) throw new Error(error.message);
  return ((data ?? []) as Array<{ id: string; name_fr: string; slug: string }>).map((row) => ({
    id: row.id,
    name_fr: row.name_fr,
    slug: row.slug,
  }));
}

export async function getSoilTypes(): Promise<SoilTypeListItem[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("soil_types")
    .select(SOIL_TYPE_LIST_COLUMNS)
    .is("deleted_at", null)
    .order("name_fr", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as SoilTypeListItem[];
}

export async function getSoilType(id: string): Promise<SoilType | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("soil_types")
    .select(SOIL_TYPE_DETAIL_COLUMNS)
    .eq("id", id)
    .single();
  if (error || !data) return null;
  return data as SoilType;
}

type SoilTypeForm = Omit<SoilType, "id" | "created_at" | "updated_at" | "deleted_at"> & { id?: string };

function formToRow(form: SoilTypeForm): Record<string, unknown> {
  return {
    slug: form.slug || null,
    name_fr: form.name_fr || "",
    name_en: form.name_en || null,
    photo_url: form.photo_url || null,
    geological_origin_fr: form.geological_origin_fr || null,
    geological_origin_en: form.geological_origin_en || null,
    regions_fr: form.regions_fr || null,
    regions_en: form.regions_en || null,
    mineral_composition_fr: form.mineral_composition_fr || null,
    mineral_composition_en: form.mineral_composition_en || null,
    wine_influence_fr: form.wine_influence_fr || null,
    wine_influence_en: form.wine_influence_en || null,
    emblematic_aop_fr: form.emblematic_aop_fr || null,
    emblematic_aop_en: form.emblematic_aop_en || null,
    carousel_order: form.carousel_order ?? null,
    is_premium: !!form.is_premium,
    status: form.status || "draft",
    published_at: form.published_at || null,
  };
}

export async function createSoilType(form: SoilTypeForm): Promise<{ error?: string }> {
  const supabase = getSupabaseAdmin();
  const row = formToRow(form);
  const { error } = await supabase.from("soil_types").insert(row);
  if (error) return { error: error.message };
  revalidatePath("/admin/soil-types");
  return {};
}

export async function updateSoilType(id: string, form: SoilTypeForm): Promise<{ error?: string }> {
  const supabase = getSupabaseAdmin();
  const row = formToRow(form);
  const { error } = await supabase.from("soil_types").update(row).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/soil-types");
  return {};
}

export async function deleteSoilType(id: string): Promise<{ error?: string }> {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("soil_types")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/soil-types");
  return {};
}

export async function getSoilTypeAppellationLinks(
  soilTypeId: string
): Promise<SoilTypeLinkedAppellation[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("aop_soil_link")
    .select(
      `
      aop_id,
      aop!aop_id(
        id,
        name,
        aop_subregion_link(
          subregions!subregion_id(
            wine_regions!region_id(name_fr)
          )
        )
      )
    `
    )
    .eq("soil_type_id", soilTypeId);
  if (error) throw new Error(error.message);

  const results = (data ?? [])
    .map((row) => {
      const aop = getFirstRelation(
        ((row as { aop: AopJoinRow | AopJoinRow[] | null }).aop)
      );

      if (aop?.id == null || !aop.name) return null;

      const firstLink = aop.aop_subregion_link?.[0];
      const subregion = getFirstRelation(firstLink?.subregions);
      const region = getFirstRelation(subregion?.wine_regions);

      return {
        id: String(aop.id),
        name: aop.name,
        region_name_fr: region?.name_fr ?? null,
      };
    })
    .filter((row): row is SoilTypeLinkedAppellation => row !== null);

  return results.sort((a, b) => a.name.localeCompare(b.name, "fr", { sensitivity: "base" }));
}

export async function searchAppellationsForSoilLinks(
  query: string
): Promise<SoilTypeLinkedAppellation[]> {
  const supabase = getSupabaseAdmin();
  const trimmed = query.trim();

  let request = supabase
    .from("aop")
    .select(
      `
      id,
      name,
      aop_subregion_link(
        subregions!subregion_id(
          wine_regions!region_id(name_fr)
        )
      )
    `
    )
    .is("deleted_at", null)
    .order("name", { ascending: true })
    .limit(10);

  if (trimmed) {
    const escaped = trimmed.replaceAll(",", " ");
    request = request.ilike("name", `%${escaped}%`);
  }

  const { data, error } = await request;
  if (error) throw new Error(error.message);

  return ((data ?? []) as Array<{
    id: number;
    name: string;
    aop_subregion_link: AopSubregionLinkRelation[] | null;
  }>).map((row) => {
    const firstLink = row.aop_subregion_link?.[0];
    const subregion = getFirstRelation(firstLink?.subregions);
    const region = getFirstRelation(subregion?.wine_regions);

    return {
      id: String(row.id),
      name: row.name,
      region_name_fr: region?.name_fr ?? null,
    };
  });
}

export async function addSoilTypeAppellationLink(
  soilTypeId: string,
  appellationId: string
): Promise<{ error?: string }> {
  const aopId = toAopId(appellationId);
  if (aopId === null) return { error: "Identifiant AOP invalide." };
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("aop_soil_link")
    .upsert(
      {
        aop_id: aopId,
        soil_type_id: soilTypeId,
      },
      { onConflict: "aop_id,soil_type_id", ignoreDuplicates: true }
    );
  if (error) return { error: error.message };
  revalidatePath("/admin/soil-types");
  return {};
}

export async function removeSoilTypeAppellationLink(
  soilTypeId: string,
  appellationId: string
): Promise<{ error?: string }> {
  const aopId = toAopId(appellationId);
  if (aopId === null) return { error: "Identifiant AOP invalide." };
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("aop_soil_link")
    .delete()
    .eq("soil_type_id", soilTypeId)
    .eq("aop_id", aopId);
  if (error) return { error: error.message };
  revalidatePath("/admin/soil-types");
  return {};
}

const SOIL_PHOTOS_BUCKET = "soil-photos";

function sanitizeFileSegment(value: string | null | undefined) {
  return (value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export async function uploadSoilTypePhoto(
  formData: FormData
): Promise<{ url?: string; path?: string; error?: string }> {
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return { error: "Aucun fichier recadre fourni." };
  }

  if (!file.type.startsWith("image/")) {
    return { error: "Le fichier doit etre une image." };
  }

  const maxBytes = 10 * 1024 * 1024;
  if (file.size > maxBytes) {
    return { error: "Image trop lourde. Maximum 10 Mo." };
  }

  const supabase = getSupabaseAdmin();
  const arrayBuffer = await file.arrayBuffer();
  const soilTypeId = formData.get("soilTypeId");
  const slugInput = formData.get("slug");
  const folder = typeof soilTypeId === "string" && soilTypeId ? soilTypeId : "drafts";
  const slug = sanitizeFileSegment(typeof slugInput === "string" ? slugInput : null) || "soil";
  const filePath = `${folder}/${slug}-${randomUUID()}.jpg`;

  const { error: uploadError } = await supabase.storage
    .from(SOIL_PHOTOS_BUCKET)
    .upload(filePath, arrayBuffer, {
      contentType: "image/jpeg",
      cacheControl: "31536000",
      upsert: false,
    });

  if (uploadError) {
    return { error: uploadError.message };
  }

  const { data } = supabase.storage.from(SOIL_PHOTOS_BUCKET).getPublicUrl(filePath);

  revalidatePath("/admin/soil-types");
  return { url: data.publicUrl, path: filePath };
}
