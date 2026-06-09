/**
 * Sincroniza contraseñas Auth con los codigos integrados del bootstrap.
 * Uso: npx tsx --env-file=.env.local scripts/sync-auth-passwords.ts
 */
import { createClient } from "@supabase/supabase-js";
import { toAuthEmail } from "../lib/auth/credentials";
import { BUILT_IN_ONBOARDING_ACCESS_CODES } from "../lib/pwa/onboarding-access-codes-built-in";
import { ONBOARDING_PHONE_DIRECTORY } from "../lib/pwa/onboarding-phones";

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY");
  }

  const admin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  for (const row of ONBOARDING_PHONE_DIRECTORY) {
    const code = BUILT_IN_ONBOARDING_ACCESS_CODES[row.username];
    if (!code) {
      console.warn(`Sin codigo para ${row.username}, omitido.`);
      continue;
    }

    const { data: profile, error: profileError } = await admin
      .from("profiles")
      .select("id")
      .eq("username", row.username)
      .maybeSingle();

    if (profileError || !profile) {
      console.error(`Perfil no encontrado: ${row.username}`, profileError?.message);
      continue;
    }

    const { error: updateError } = await admin.auth.admin.updateUserById(profile.id, {
      password: code,
      phone: `+34${row.phone}`,
      phone_confirm: true,
      email_confirm: true,
    });

    if (updateError) {
      console.error(`Error ${row.username}:`, updateError.message);
      continue;
    }

    const email = toAuthEmail(row.username);
    const anon = createClient(url, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
    const { error: signInError } = await anon.auth.signInWithPassword({
      email,
      password: code,
    });

    console.log(
      row.username,
      signInError ? `FALLO login: ${signInError.message}` : "OK"
    );
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
