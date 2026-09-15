/**
 * Définit le mot de passe d'un utilisateur admin (une seule fois).
 * Usage: node scripts/set-admin-password.js
 * Variables d'environnement: ADMIN_EMAIL, ADMIN_PASSWORD (ou depuis .env)
 *
 * Charge .env depuis la racine du projet si dotenv est installé.
 */
require("dotenv").config({ path: require("path").resolve(__dirname, "..", ".env") });
const { createClient } = require("@supabase/supabase-js");
const bcrypt = require("bcryptjs");

const email = (process.env.ADMIN_EMAIL || "").toLowerCase().trim();
const password = process.env.ADMIN_PASSWORD || "";

if (!email || !password) {
  console.error("Usage: ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD=tonMotDePasse node scripts/set-admin-password.js");
  process.exit(1);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error("Manque NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY dans .env");
  process.exit(1);
}

const supabase = createClient(url, serviceKey);

async function main() {
  const { data: user, error: fetchError } = await supabase
    .from("users")
    .select("id, email, role")
    .eq("email", email)
    .maybeSingle();

  if (fetchError) {
    console.error("Erreur Supabase:", fetchError.message);
    process.exit(1);
  }
  if (!user) {
    console.error("Aucun utilisateur trouvé pour:", email);
    process.exit(1);
  }

  const password_hash = await bcrypt.hash(password, 10);
  const { error: updateError } = await supabase
    .from("users")
    .update({
      password_hash,
      role: "admin",
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (updateError) {
    console.error("Erreur mise à jour:", updateError.message);
    process.exit(1);
  }

  console.log("OK — Mot de passe défini et rôle mis à 'admin' pour:", email);
}

main();
