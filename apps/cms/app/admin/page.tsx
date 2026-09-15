import { redirect } from "next/navigation";
import { getAdminUser, createAdminSession } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

const isDev = process.env.NODE_ENV === "development";

function redirectInvalid(reason: string) {
  const params = new URLSearchParams({ error: "invalid" });
  if (isDev) params.set("reason", reason);
  redirect(`/admin?${params.toString()}`);
}

async function login(formData: FormData) {
  "use server";
  const email = String(formData.get("email") ?? "").toLowerCase().trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    console.error("[admin login] Champs email ou mot de passe vides.");
    redirectInvalid("empty");
  }

  try {
    const supabase = getSupabaseAdmin();
    const { data: user, error } = await supabase
      .from("users")
      .select("id, password_hash, role")
      .eq("email", email)
      .maybeSingle();

    if (error) {
      console.error("[admin login] Erreur Supabase:", error.message, error.code, error.details);
      redirectInvalid(`supabase: ${error.message}`);
    }
    if (!user) {
      console.error("[admin login] Aucun utilisateur trouvé pour email:", email);
      redirectInvalid("no_user");
    }
    if (!user.password_hash) {
      console.error("[admin login] Utilisateur sans password_hash (OAuth?) pour email:", email);
      redirectInvalid("no_password");
    }
    if (user.role !== "admin") {
      console.error("[admin login] Rôle non admin pour email:", email, "role:", user.role);
      redirectInvalid("not_admin");
    }

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      console.error("[admin login] Mot de passe incorrect pour email:", email);
      redirectInvalid("wrong_password");
    }

    await createAdminSession(user.id);
    redirect("/admin/dashboard");
  } catch (err) {
    // Next.js redirect() lance une exception ; ne pas la capturer
    const digest = err && typeof err === "object" && "digest" in err ? String((err as { digest?: string }).digest) : "";
    if (digest.startsWith("NEXT_REDIRECT")) throw err;
    console.error("[admin login] Exception:", err);
    redirectInvalid(err instanceof Error ? err.message : "exception");
  }
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams?: { error?: string; reason?: string };
}) {
  const user = await getAdminUser();
  const error = searchParams?.error;
  const reason = searchParams?.reason;

  if (user) redirect("/admin/dashboard");

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-sm rounded-lg border bg-white p-5 shadow-sm">
        <h1 className="text-lg font-semibold text-slate-900">OenoBoost CMS</h1>
        <p className="mt-1 text-xs text-slate-500">Connexion réservée aux administrateurs.</p>
        {error === "invalid" && (
          <p className="mt-3 text-xs text-red-600">
            Email ou mot de passe incorrect.
            {reason && (
              <span className="mt-1 block font-mono text-[10px] opacity-90">
                (dev) {reason}
              </span>
            )}
          </p>
        )}
        <form action={login} className="mt-4 space-y-3">
          <div>
            <label htmlFor="email" className="block text-xs font-medium text-slate-700">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-xs font-medium text-slate-700">
              Mot de passe
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            Se connecter
          </button>
        </form>
      </div>
    </main>
  );
}
