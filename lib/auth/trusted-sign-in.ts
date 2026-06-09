import { toAuthEmail } from "@/lib/auth/credentials";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const OTP_TYPES = ["magiclink", "email"] as const;

/** Inicia sesion server-side tras validar identidad por telefono (sin codigo en env). */
export async function signInTrustedUserByUsername(
  username: string
): Promise<{ ok: true; userId: string } | { ok: false; error: string }> {
  const admin = createAdminClient();
  const email = toAuthEmail(username);

  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("id, is_active")
    .eq("username", username)
    .maybeSingle();

  if (profileError || !profile) {
    return { ok: false, error: "No se encontro el perfil del participante." };
  }

  if (!profile.is_active) {
    return { ok: false, error: "Cuenta desactivada. Contacta al administrador." };
  }

  const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email,
  });

  const hashedToken = linkData?.properties?.hashed_token;
  if (linkError || !hashedToken) {
    return {
      ok: false,
      error: "No hay acceso configurado para ese participante. Contacta al administrador.",
    };
  }

  const supabase = await createClient();

  for (const type of OTP_TYPES) {
    const { data, error: verifyError } = await supabase.auth.verifyOtp({
      token_hash: hashedToken,
      type,
    });

    if (verifyError || !data.user) {
      continue;
    }

    if (data.session) {
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      });
      if (sessionError) {
        continue;
      }
    }

    return { ok: true, userId: data.user.id };
  }

  return { ok: false, error: "No se pudo iniciar sesion." };
}
