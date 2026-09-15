"use server";

import { getSupabaseAdmin } from "@/lib/supabase";
import { revalidatePath } from "next/cache";

export type QuizQuestion = {
  id: string;
  type: string;
  theme: string | null;
  question_fr: string;
  question_en: string;
  option_a_fr: string;
  option_a_en: string;
  option_b_fr: string;
  option_b_en: string;
  option_c_fr: string | null;
  option_c_en: string | null;
  option_d_fr: string | null;
  option_d_en: string | null;
  correct_option: "a" | "b" | "c" | "d";
  explanation_fr: string | null;
  explanation_en: string | null;
  related_module: string | null;
  scheduled_date: string | null; // YYYY-MM-DD
  is_premium: boolean;
  status: string;
  created_at: string;
  updated_at: string;
};

export type QuizQuestionListItem = Pick<
  QuizQuestion,
  "id" | "question_fr" | "question_en" | "theme" | "type" | "status" | "updated_at"
>;

const QUIZ_LIST_COLUMNS = "id,question_fr,question_en,theme,type,status,updated_at";
const QUIZ_DETAIL_COLUMNS =
  "id,type,theme,question_fr,question_en,option_a_fr,option_a_en,option_b_fr,option_b_en,option_c_fr,option_c_en,option_d_fr,option_d_en,correct_option,explanation_fr,explanation_en,related_module,scheduled_date,is_premium,status,created_at,updated_at";

export async function getQuizQuestions(): Promise<QuizQuestionListItem[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("quiz_questions")
    .select(QUIZ_LIST_COLUMNS)
    .order("updated_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as QuizQuestionListItem[];
}

export async function getQuizQuestion(id: string): Promise<QuizQuestion | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("quiz_questions")
    .select(QUIZ_DETAIL_COLUMNS)
    .eq("id", id)
    .single();
  if (error || !data) return null;
  return data as QuizQuestion;
}

type QuizQuestionForm = Omit<QuizQuestion, "id" | "created_at" | "updated_at"> & { id?: string };

function formToRow(form: QuizQuestionForm): Record<string, unknown> {
  return {
    type: form.type || "daily",
    theme: form.theme || null,
    question_fr: form.question_fr || "",
    question_en: form.question_en || "",
    option_a_fr: form.option_a_fr || "",
    option_a_en: form.option_a_en || "",
    option_b_fr: form.option_b_fr || "",
    option_b_en: form.option_b_en || "",
    option_c_fr: form.option_c_fr || null,
    option_c_en: form.option_c_en || null,
    option_d_fr: form.option_d_fr || null,
    option_d_en: form.option_d_en || null,
    correct_option: form.correct_option || "a",
    explanation_fr: form.explanation_fr || null,
    explanation_en: form.explanation_en || null,
    related_module: form.related_module || null,
    scheduled_date: form.scheduled_date || null,
    is_premium: !!form.is_premium,
    status: form.status || "draft",
  };
}

export async function createQuizQuestion(form: QuizQuestionForm): Promise<{ error?: string }> {
  const supabase = getSupabaseAdmin();
  const row = formToRow(form);
  const { error } = await supabase.from("quiz_questions").insert(row);
  if (error) return { error: error.message };
  revalidatePath("/admin/quiz");
  return {};
}

export async function updateQuizQuestion(
  id: string,
  form: QuizQuestionForm
): Promise<{ error?: string }> {
  const supabase = getSupabaseAdmin();
  const row = formToRow(form);
  const { error } = await supabase.from("quiz_questions").update(row).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/quiz");
  return {};
}

export async function deleteQuizQuestion(id: string): Promise<{ error?: string }> {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("quiz_questions").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/quiz");
  return {};
}

