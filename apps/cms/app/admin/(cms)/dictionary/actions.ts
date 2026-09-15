"use server";

import { getSupabaseAdmin } from "@/lib/supabase";
import { revalidatePath } from "next/cache";

export type DictionaryTerm = {
  id: string;
  slug: string;
  term_fr: string;
  term_en: string | null;
  definition_fr: string | null;
  definition_en: string | null;
  examples_fr: string | null;
  examples_en: string | null;
  etymology_fr: string | null;
  etymology_en: string | null;
  related_modules: unknown;
  is_word_of_day: boolean;
  is_premium: boolean;
  free_order: number | null;
  status: string;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type DictionaryTermListItem = Pick<
  DictionaryTerm,
  "id" | "slug" | "term_fr" | "term_en" | "is_word_of_day" | "is_premium" | "status"
>;

const DICTIONARY_LIST_COLUMNS = "id,slug,term_fr,term_en,is_word_of_day,is_premium,status";
const DICTIONARY_DETAIL_COLUMNS =
  "id,slug,term_fr,term_en,definition_fr,definition_en,examples_fr,examples_en,etymology_fr,etymology_en,related_modules,is_word_of_day,is_premium,free_order,status,published_at,created_at,updated_at,deleted_at";

export async function getDictionaryTerms(): Promise<DictionaryTermListItem[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("dictionary_terms")
    .select(DICTIONARY_LIST_COLUMNS)
    .is("deleted_at", null)
    .order("term_fr", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as DictionaryTermListItem[];
}

export async function getDictionaryTerm(id: string): Promise<DictionaryTerm | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("dictionary_terms")
    .select(DICTIONARY_DETAIL_COLUMNS)
    .eq("id", id)
    .single();
  if (error || !data) return null;
  return data as DictionaryTerm;
}

type DictionaryTermForm = Omit<
  DictionaryTerm,
  "id" | "created_at" | "updated_at" | "deleted_at"
> & { id?: string };

function formToRow(form: DictionaryTermForm): Record<string, unknown> {
  let related_modules: unknown = form.related_modules ?? null;
  if (typeof related_modules === "string" && related_modules.trim()) {
    try {
      related_modules = JSON.parse(related_modules);
    } catch {
      related_modules = null;
    }
  }
  return {
    slug: form.slug || null,
    term_fr: form.term_fr || "",
    term_en: form.term_en || null,
    definition_fr: form.definition_fr || null,
    definition_en: form.definition_en || null,
    examples_fr: form.examples_fr || null,
    examples_en: form.examples_en || null,
    etymology_fr: form.etymology_fr || null,
    etymology_en: form.etymology_en || null,
    related_modules,
    is_word_of_day: !!form.is_word_of_day,
    is_premium: !!form.is_premium,
    free_order: form.free_order ?? null,
    status: form.status || "draft",
    published_at: form.published_at || null,
  };
}

/** Un seul "word of the day" à la fois : décoche les autres. */
async function clearOtherWordOfDay(supabase: ReturnType<typeof getSupabaseAdmin>, excludeId?: string) {
  let q = supabase
    .from("dictionary_terms")
    .update({ is_word_of_day: false })
    .eq("is_word_of_day", true)
    .is("deleted_at", null);
  if (excludeId) q = q.neq("id", excludeId);
  await q;
}

export async function createDictionaryTerm(
  form: DictionaryTermForm
): Promise<{ error?: string }> {
  const supabase = getSupabaseAdmin();
  if (form.is_word_of_day) await clearOtherWordOfDay(supabase);
  const row = formToRow(form);
  const { error } = await supabase.from("dictionary_terms").insert(row);
  if (error) return { error: error.message };
  revalidatePath("/admin/dictionary");
  return {};
}

export async function updateDictionaryTerm(
  id: string,
  form: DictionaryTermForm
): Promise<{ error?: string }> {
  const supabase = getSupabaseAdmin();
  if (form.is_word_of_day) await clearOtherWordOfDay(supabase, id);
  const row = formToRow(form);
  const { error } = await supabase.from("dictionary_terms").update(row).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/dictionary");
  return {};
}

export async function deleteDictionaryTerm(id: string): Promise<{ error?: string }> {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("dictionary_terms")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/dictionary");
  return {};
}
