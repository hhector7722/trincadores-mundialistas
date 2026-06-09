import { createAdminClient } from "@/lib/supabase/admin";

type ProfileActivationRow = {
  onboarding_completed_at: string | null;
  avatar_url: string | null;
};

/** Persiste la activacion si el perfil ya tiene avatar pero falta la marca temporal. */
export async function stampOnboardingCompletedIfNeeded(
  profileId: string,
  profile: ProfileActivationRow
): Promise<void> {
  if (profile.onboarding_completed_at?.trim() || !profile.avatar_url?.trim()) {
    return;
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("profiles")
    .update({ onboarding_completed_at: new Date().toISOString() })
    .eq("id", profileId)
    .is("onboarding_completed_at", null);

  if (error) {
    throw new Error(error.message);
  }
}
