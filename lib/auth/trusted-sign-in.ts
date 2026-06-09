import { signInUserByUsername } from "@/lib/auth/phone-sign-in";
import { createAdminClient } from "@/lib/supabase/admin";

/** Compat: restaurar sesion por alias del participante. */
export async function signInTrustedUserByUsername(
  username: string
): Promise<{ ok: true; userId: string } | { ok: false; error: string }> {
  const result = await signInUserByUsername(username);
  if (!result.ok) {
    return { ok: false, error: result.error };
  }

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("id")
    .eq("username", result.username)
    .maybeSingle();

  if (!profile) {
    return { ok: false, error: "No se encontro el perfil del participante." };
  }

  return { ok: true, userId: profile.id };
}
