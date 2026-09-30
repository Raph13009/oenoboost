"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { isPremiumPlan } from "@/lib/favorites/constants";

const MAX_NOTE_LENGTH = 5000;

export type SaveAopNoteResult =
  | { ok: true; body: string }
  | {
      ok: false;
      error: string;
      code?: "unauthorized" | "premium_required" | "validation";
    };

export async function saveAopNoteAction(
  aopId: number,
  body: string,
  revalidatePaths: string[] = [],
): Promise<SaveAopNoteResult> {
  if (!Number.isInteger(aopId) || aopId <= 0) {
    return { ok: false, error: "invalid_aop", code: "validation" };
  }

  const trimmed = body.trim();
  if (trimmed.length > MAX_NOTE_LENGTH) {
    return {
      ok: false,
      error: `Note too long (max ${MAX_NOTE_LENGTH})`,
      code: "validation",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { ok: false, error: "unauthorized", code: "unauthorized" };
  }

  const { data: profile } = await supabase
    .from("users")
    .select("plan")
    .eq("id", user.id)
    .maybeSingle();

  if (!isPremiumPlan(profile?.plan)) {
    return { ok: false, error: "premium_required", code: "premium_required" };
  }

  if (trimmed.length === 0) {
    const { error: delError } = await supabase
      .from("user_aop_notes")
      .delete()
      .eq("user_id", user.id)
      .eq("aop_id", aopId);

    if (delError) {
      return { ok: false, error: delError.message };
    }

    for (const path of revalidatePaths) {
      revalidatePath(path);
    }
    return { ok: true, body: "" };
  }

  const { error: upsertError } = await supabase.from("user_aop_notes").upsert(
    {
      user_id: user.id,
      aop_id: aopId,
      body: trimmed,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,aop_id" },
  );

  if (upsertError) {
    return { ok: false, error: upsertError.message };
  }

  for (const path of revalidatePaths) {
    revalidatePath(path);
  }
  return { ok: true, body: trimmed };
}
