import { cookies } from "next/headers";
import { getSupabaseAdmin } from "./supabase";

const COOKIE_NAME = "ob_admin";
const SECRET = process.env.ADMIN_SESSION_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || "dev-secret-change-in-prod";

async function sign(value: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  return Buffer.from(sig).toString("base64url");
}

async function verify(value: string, signature: string): Promise<boolean> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"]
  );
  return crypto.subtle.verify(
    "HMAC",
    key,
    Buffer.from(signature, "base64url"),
    new TextEncoder().encode(value)
  );
}

export async function createAdminSession(userId: string): Promise<void> {
  const sig = await sign(userId);
  (await cookies()).set(COOKIE_NAME, `${userId}.${sig}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function destroyAdminSession(): Promise<void> {
  (await cookies()).set(COOKIE_NAME, "", { path: "/", maxAge: 0 });
}

const TEST_USER = {
  id: "test",
  email: "test@oenoboost.local",
  first_name: "Mode",
  last_name: "Test",
};

export async function createTestAdminSession(): Promise<void> {
  const sig = await sign("test");
  (await cookies()).set(COOKIE_NAME, `test.${sig}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function getAdminUser(): Promise<{ id: string; email: string; first_name: string | null; last_name: string | null } | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(COOKIE_NAME)?.value;
  if (!raw) return null;
  const [userId, signature] = raw.split(".");
  if (!userId || !signature) return null;
  const ok = await verify(userId, signature).catch(() => false);
  if (!ok) return null;
  if (userId === "test") return TEST_USER;
  try {
    const supabase = getSupabaseAdmin();
    const { data: user, error } = await supabase
      .from("users")
      .select("id, email, first_name, last_name, role")
      .eq("id", userId)
      .single();
    if (error || !user || user.role !== "admin") return null;
    return { id: user.id, email: user.email, first_name: user.first_name, last_name: user.last_name };
  } catch {
    return null;
  }
}
