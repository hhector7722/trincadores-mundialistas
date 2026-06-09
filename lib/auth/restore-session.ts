import { signInUserByUsername } from "@/lib/auth/phone-sign-in";
import {
  isProfileOnboardingComplete,
  type OnboardingProfileRow,
} from "@/lib/auth/onboarding-device";
import { normalizeUsername } from "@/lib/auth/validation";
import { createAdminClient } from "@/lib/supabase/admin";

export type RestoreSessionResult =
  | { ok: true; username: string }
  | { ok: false; error: string; code: "not_found" | "inactive" | "incomplete" | "auth" };

export async function restoreSessionForUsername(
  usernameRaw: string
): Promise<RestoreSessionResult> {
  const username = normalizeUsername(usernameRaw);
  if (!username) {
    return { ok: false, error: "Dispositivo no vinculado.", code: "not_found" };
  }

  const admin = createAdminClient();
  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("username, is_active, onboarding_completed_at, avatar_url")
    .eq("username", username)
    .maybeSingle();

  if (profileError || !profile) {
    return { ok: false, error: "Perfil no encontrado.", code: "not_found" };
  }

  const row = profile as OnboardingProfileRow;
  if (!row.is_active) {
    return { ok: false, error: "Cuenta desactivada.", code: "inactive" };
  }

  if (!isProfileOnboardingComplete(row)) {
    return { ok: false, error: "Onboarding incompleto.", code: "incomplete" };
  }

  const restored = await signInUserByUsername(username);
  if (!restored.ok) {
    return { ok: false, error: restored.error, code: "auth" };
  }

  return { ok: true, username: restored.username };
}
