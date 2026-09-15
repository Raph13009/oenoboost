import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * Server-side Supabase client with service role.
 * Use for admin/CMS and any server code that needs full DB access.
 */
export function getSupabaseAdmin() {
  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false },
  });
}
