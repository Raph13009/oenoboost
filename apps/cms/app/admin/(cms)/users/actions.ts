"use server";

import { getSupabaseAdmin } from "@/lib/supabase";
import { revalidatePath } from "next/cache";

export type User = {
  id: string;
  email: string;
  password_hash: string | null;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  role: string;
  plan: string;
  plan_expires_at: string | null;
  level: string;
  streak_days: number;
  is_verified: boolean;
  locale: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export async function getUsers(options?: {
  page?: number;
  pageSize?: number;
  search?: string;
  plan?: string;
  level?: string;
  sortBy?: "created_at";
  order?: "asc" | "desc";
}): Promise<{ users: User[]; total: number }> {
  const supabase = getSupabaseAdmin();
  const page = options?.page ?? 1;
  const pageSize = Math.min(Math.max(options?.pageSize ?? 25, 1), 100);
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("users")
    .select("id, email, first_name, last_name, avatar_url, role, plan, plan_expires_at, level, streak_days, is_verified, locale, created_at, updated_at, deleted_at", { count: "exact" })
    .is("deleted_at", null);

  if (options?.search?.trim()) {
    const q = options.search.trim().replace(/'/g, "''").toLowerCase();
    query = query.or(
      `email.ilike.%${q}%,first_name.ilike.%${q}%,last_name.ilike.%${q}%`
    );
  }
  if (options?.plan && options.plan !== "all") {
    query = query.eq("plan", options.plan);
  }
  if (options?.level && options.level !== "all") {
    query = query.eq("level", options.level);
  }

  const sortBy = options?.sortBy ?? "created_at";
  const order = options?.order ?? "desc";
  query = query.order(sortBy, { ascending: order === "asc" });

  const { data, error, count } = await query.range(from, to);

  if (error) throw new Error(error.message);
  const users = (data ?? []) as User[];
  const total = count ?? 0;
  return { users, total };
}

export async function getUser(id: string): Promise<User | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("users")
    .select(
      "id, email, password_hash, first_name, last_name, avatar_url, role, plan, plan_expires_at, level, streak_days, is_verified, locale, created_at, updated_at, deleted_at"
    )
    .eq("id", id)
    .single();
  if (error || !data) return null;
  return data as User;
}

type UserForm = Partial<
  Pick<
    User,
    | "first_name"
    | "last_name"
    | "email"
    | "avatar_url"
    | "role"
    | "plan"
    | "plan_expires_at"
    | "level"
    | "streak_days"
    | "is_verified"
    | "locale"
  >
>;

function formToRow(form: UserForm): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if (form.first_name !== undefined) row.first_name = form.first_name || null;
  if (form.last_name !== undefined) row.last_name = form.last_name || null;
  if (form.email !== undefined) row.email = (form.email ?? "").trim().toLowerCase() || null;
  if (form.avatar_url !== undefined) row.avatar_url = form.avatar_url || null;
  if (form.role !== undefined) row.role = form.role || "user";
  if (form.plan !== undefined) row.plan = form.plan || "free";
  if (form.plan_expires_at !== undefined) row.plan_expires_at = form.plan_expires_at || null;
  if (form.level !== undefined) row.level = form.level || "beginner";
  if (form.streak_days !== undefined) row.streak_days = form.streak_days ?? 0;
  if (form.is_verified !== undefined) row.is_verified = !!form.is_verified;
  if (form.locale !== undefined) row.locale = form.locale || "fr";
  return row;
}

export async function updateUser(id: string, form: UserForm): Promise<{ error?: string }> {
  const supabase = getSupabaseAdmin();
  const row = formToRow(form);
  const { error } = await supabase.from("users").update(row).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/users");
  return {};
}

export async function deleteUser(id: string): Promise<{ error?: string }> {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("users").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/users");
  return {};
}

export async function deactivateUser(id: string): Promise<{ error?: string }> {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("users")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/users");
  return {};
}
