import { createClient } from "@/lib/supabase/server";

export type UserAopNote = {
  id: string;
  aop_id: number;
  body: string;
  updated_at: string;
};

export async function getUserAopNote(
  userId: string,
  aopId: number,
): Promise<UserAopNote | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("user_aop_notes")
    .select("id, aop_id, body, updated_at")
    .eq("user_id", userId)
    .eq("aop_id", aopId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch AOP note: ${error.message}`);
  }
  if (!data) return null;

  return {
    id: data.id as string,
    aop_id: data.aop_id as number,
    body: (data.body as string) ?? "",
    updated_at: data.updated_at as string,
  };
}
