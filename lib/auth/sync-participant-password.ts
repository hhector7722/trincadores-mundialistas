import { createAdminClient } from "@/lib/supabase/admin";
import { normalizeUsername } from "@/lib/auth/validation";

/** Alinea la contraseña de Auth con el codigo de acceso esperado (idempotente). */
export async function syncParticipantPassword(
  usernameRaw: string,
  accessCode: string
): Promise<boolean> {
  const username = normalizeUsername(usernameRaw);
  if (!username || !accessCode.trim()) return false;

  const admin = createAdminClient();
  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("id")
    .eq("username", username)
    .maybeSingle();

  if (profileError || !profile) return false;

  const { error: updateError } = await admin.auth.admin.updateUserById(profile.id, {
    password: accessCode,
  });

  return !updateError;
}
