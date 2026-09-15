"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseAdmin } from "@/lib/supabase";
import { QUIZ_GROUP_TYPE_OPTIONS } from "./constants";

export type QuizGroupType = (typeof QUIZ_GROUP_TYPE_OPTIONS)[number];

export type QuizGroupStatus = "draft" | "published";

export type QuizGroup = {
  id: string;
  title_fr: string;
  title_en: string | null;
  type: QuizGroupType;
  theme: string | null;
  duration_sec: number | null;
  is_premium: boolean;
  status: QuizGroupStatus;
  question_count: number;
  created_at: string;
  updated_at: string;
};

export type QuizGroupListItem = Pick<
  QuizGroup,
  "id" | "title_fr" | "type" | "theme" | "status" | "question_count" | "updated_at"
>;

export type QuizQuestionOption = {
  id: string;
  question_fr: string;
  theme: string | null;
  type: string;
  status: string;
};

export type QuizGroupQuestionLink = {
  question_id: string;
  position: number;
  question: QuizQuestionOption | null;
};

const QUIZ_GROUP_LIST_COLUMNS =
  "id,title_fr,type,theme,status,question_count,updated_at";
const QUIZ_GROUP_DETAIL_COLUMNS =
  "id,title_fr,title_en,type,theme,duration_sec,is_premium,status,question_count,created_at,updated_at";
const QUIZ_QUESTION_OPTION_COLUMNS = "id,question_fr,theme,type,status";

type QuizGroupForm = Omit<
  QuizGroup,
  "id" | "question_count" | "created_at" | "updated_at"
> & { id?: string };

type QuestionSearchFilters = {
  search?: string;
  theme?: string;
  type?: string;
  excludeIds?: string[];
};

function quizGroupFormToRow(form: QuizGroupForm): Record<string, unknown> {
  return {
    title_fr: form.title_fr?.trim() || "",
    title_en: form.title_en?.trim() || null,
    type: form.type || "beginner",
    theme: form.theme?.trim() || null,
    duration_sec:
      typeof form.duration_sec === "number" && Number.isFinite(form.duration_sec)
        ? Math.max(0, Math.round(form.duration_sec))
        : null,
    is_premium: !!form.is_premium,
    status: form.status || "draft",
  };
}

async function syncQuizQuestionCount(quizId: string) {
  const supabase = getSupabaseAdmin();
  const { count, error: countError } = await supabase
    .from("quiz_question_links")
    .select("question_id", { count: "exact", head: true })
    .eq("quiz_id", quizId);

  if (countError) {
    throw new Error(countError.message);
  }

  const { error: updateError } = await supabase
    .from("quizzes")
    .update({ question_count: count ?? 0 })
    .eq("id", quizId);

  if (updateError) {
    throw new Error(updateError.message);
  }
}

async function normalizeQuizQuestionPositions(quizId: string) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("quiz_question_links")
    .select("question_id,position")
    .eq("quiz_id", quizId)
    .order("position", { ascending: true })
    .order("question_id", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  const links = (data ?? []) as { question_id: string; position: number | null }[];
  for (let index = 0; index < links.length; index += 1) {
    const link = links[index];
    const nextPosition = index + 1;
    if (link.position === nextPosition) continue;
    const { error: updateError } = await supabase
      .from("quiz_question_links")
      .update({ position: nextPosition })
      .eq("quiz_id", quizId)
      .eq("question_id", link.question_id);
    if (updateError) {
      throw new Error(updateError.message);
    }
  }
}

export async function getQuizGroups(): Promise<QuizGroupListItem[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("quizzes")
    .select(QUIZ_GROUP_LIST_COLUMNS)
    .order("updated_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as QuizGroupListItem[];
}

export async function getQuizGroup(id: string): Promise<QuizGroup | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("quizzes")
    .select(QUIZ_GROUP_DETAIL_COLUMNS)
    .eq("id", id)
    .single();

  if (error || !data) return null;
  return data as QuizGroup;
}

export async function getQuizGroupQuestions(
  quizId: string
): Promise<QuizGroupQuestionLink[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("quiz_question_links")
    .select("question_id,position")
    .eq("quiz_id", quizId)
    .order("position", { ascending: true })
    .order("question_id", { ascending: true });

  if (error) throw new Error(error.message);

  const links = (data ?? []) as { question_id: string; position: number | null }[];
  const questionIds = links.map((link) => link.question_id);

  if (questionIds.length === 0) {
    return [];
  }

  const { data: questionRows, error: questionsError } = await supabase
    .from("quiz_questions")
    .select(QUIZ_QUESTION_OPTION_COLUMNS)
    .in("id", questionIds);

  if (questionsError) throw new Error(questionsError.message);

  const questionsById = new Map<string, QuizQuestionOption>(
    ((questionRows ?? []) as QuizQuestionOption[]).map((question) => [question.id, question])
  );

  return links.map((link, index) => ({
    question_id: link.question_id,
    position: link.position ?? index + 1,
    question: questionsById.get(link.question_id) ?? null,
  }));
}

export async function getAvailableQuizQuestions(
  filters: QuestionSearchFilters = {}
): Promise<QuizQuestionOption[]> {
  const supabase = getSupabaseAdmin();
  let query = supabase
    .from("quiz_questions")
    .select(QUIZ_QUESTION_OPTION_COLUMNS)
    .eq("status", "published")
    .order("updated_at", { ascending: false })
    .limit(100);

  const trimmedSearch = filters.search?.trim();
  if (trimmedSearch) {
    const safe = trimmedSearch.replace(/,/g, " ");
    query = query.or(`question_fr.ilike.%${safe}%,question_en.ilike.%${safe}%`);
  }

  if (filters.theme && filters.theme !== "all") {
    query = query.eq("theme", filters.theme);
  }

  if (filters.type && filters.type !== "all") {
    query = query.eq("type", filters.type);
  }

  if (filters.excludeIds && filters.excludeIds.length > 0) {
    query = query.not("id", "in", `(${filters.excludeIds.map((id) => `"${id}"`).join(",")})`);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []) as QuizQuestionOption[];
}

export async function createQuizGroup(
  form: QuizGroupForm
): Promise<{ error?: string }> {
  const supabase = getSupabaseAdmin();
  const row = quizGroupFormToRow(form);
  const { error } = await supabase.from("quizzes").insert(row);
  if (error) return { error: error.message };
  revalidatePath("/admin/quizzes");
  return {};
}

export async function updateQuizGroup(
  id: string,
  form: QuizGroupForm
): Promise<{ error?: string }> {
  const supabase = getSupabaseAdmin();
  const row = quizGroupFormToRow(form);
  const { error } = await supabase.from("quizzes").update(row).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/quizzes");
  return {};
}

export async function deleteQuizGroup(id: string): Promise<{ error?: string }> {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("quizzes").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/quizzes");
  return {};
}

export async function addQuestionToQuiz(
  quizId: string,
  questionId: string
): Promise<{ error?: string }> {
  const supabase = getSupabaseAdmin();

  const { data: question, error: questionError } = await supabase
    .from("quiz_questions")
    .select("id,status")
    .eq("id", questionId)
    .single();

  if (questionError || !question) {
    return { error: "Question introuvable." };
  }

  if ((question as { status?: string }).status !== "published") {
    return { error: "Seules les questions publiées peuvent être ajoutées." };
  }

  const { data: existingLink, error: existingError } = await supabase
    .from("quiz_question_links")
    .select("question_id")
    .eq("quiz_id", quizId)
    .eq("question_id", questionId)
    .maybeSingle();

  if (existingError) {
    return { error: existingError.message };
  }

  if (existingLink) {
    return { error: "Cette question est déjà présente dans ce quizz." };
  }

  const { data: lastLink, error: lastError } = await supabase
    .from("quiz_question_links")
    .select("position")
    .eq("quiz_id", quizId)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (lastError) {
    return { error: lastError.message };
  }

  const nextPosition =
    typeof lastLink?.position === "number" ? lastLink.position + 1 : 1;

  const { error: insertError } = await supabase
    .from("quiz_question_links")
    .insert({
      quiz_id: quizId,
      question_id: questionId,
      position: nextPosition,
    });

  if (insertError) {
    return { error: insertError.message };
  }

  try {
    await normalizeQuizQuestionPositions(quizId);
    await syncQuizQuestionCount(quizId);
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Impossible de synchroniser le quizz.",
    };
  }

  revalidatePath("/admin/quizzes");
  return {};
}

export async function removeQuestionFromQuiz(
  quizId: string,
  questionId: string
): Promise<{ error?: string }> {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("quiz_question_links")
    .delete()
    .eq("quiz_id", quizId)
    .eq("question_id", questionId);

  if (error) return { error: error.message };

  try {
    await normalizeQuizQuestionPositions(quizId);
    await syncQuizQuestionCount(quizId);
  } catch (syncError) {
    return {
      error:
        syncError instanceof Error
          ? syncError.message
          : "Impossible de synchroniser le quizz.",
    };
  }

  revalidatePath("/admin/quizzes");
  return {};
}

export async function reorderQuizQuestions(
  quizId: string,
  orderedQuestionIds: string[]
): Promise<{ error?: string }> {
  const supabase = getSupabaseAdmin();
  const uniqueQuestionIds = Array.from(new Set(orderedQuestionIds));

  for (let index = 0; index < uniqueQuestionIds.length; index += 1) {
    const questionId = uniqueQuestionIds[index];
    const { error } = await supabase
      .from("quiz_question_links")
      .update({ position: index + 1 })
      .eq("quiz_id", quizId)
      .eq("question_id", questionId);
    if (error) return { error: error.message };
  }

  try {
    await normalizeQuizQuestionPositions(quizId);
    await syncQuizQuestionCount(quizId);
  } catch (syncError) {
    return {
      error:
        syncError instanceof Error
          ? syncError.message
          : "Impossible de synchroniser le quizz.",
    };
  }

  revalidatePath("/admin/quizzes");
  return {};
}
