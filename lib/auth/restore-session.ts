import { signInTrustedUserByUsername } from "@/lib/auth/trusted-sign-in";
import {
  isProfileOnboardingComplete,
  setOnboardedDeviceCookie,
  type OnboardingProfileRow,
} from "@/lib/auth/onboarding-device";
import { resolvePoolMemberships, setActivePoolCookie } from "@/lib/auth/session";
import { normalizeUsername } from "@/lib/auth/validation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type RestoreSessionResult =
  | { ok: true; username: string }
  | { ok: false; error: string; code: "not_found" | "inactive" | "incomplete" | "auth" };

async function applyPoolCookieForUser(userId: string): Promise<void> {
  const supabase = await createClient();
  const { data: memberships, error } = await supabase
    .from("pool_members")
    .select("pool_id")
    .eq("profile_id", userId);

  if (error) {
    throw new Error(error.message);
  }

  const resolution = resolvePoolMemberships(memberships);
  if (resolution.status === "single") {
    await setActivePoolCookie(resolution.poolId);
  }
}

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

  const trusted = await signInTrustedUserByUsername(username);
  if (!trusted.ok) {
    return { ok: false, error: trusted.error, code: "auth" };
  }

  try {
    await applyPoolCookieForUser(trusted.userId);
  } catch (e) {
    const supabase = await createClient();
    await supabase.auth.signOut();
    const msg = e instanceof Error ? e.message : "Error al resolver la porra.";
    return { ok: false, error: msg, code: "auth" };
  }

  await setOnboardedDeviceCookie(username);
  return { ok: true, username };
}
