import { REAL_PARTICIPANTS, REAL_POOL_SLUG } from "@/lib/auth/participants";
import { createAdminClient } from "@/lib/supabase/admin";

export type OnboardingParticipant = {
  username: string;
  displayName: string;
};

type ProfileRow = {
  username: string;
  display_name: string | null;
  is_active: boolean;
};

function pickJoinedProfile(profiles: unknown): ProfileRow | null {
  if (!profiles) return null;
  const row = Array.isArray(profiles) ? profiles[0] : profiles;
  if (!row || typeof row !== "object" || !("username" in row)) return null;
  return row as ProfileRow;
}

function fallbackParticipants(): OnboardingParticipant[] {
  return REAL_PARTICIPANTS.map((participant) => ({
    username: participant.username,
    displayName: participant.displayName,
  })).sort((a, b) => a.displayName.localeCompare(b.displayName, "es"));
}

export async function getOnboardingParticipants(): Promise<OnboardingParticipant[]> {
  try {
    const admin = createAdminClient();
    const { data: pool, error: poolError } = await admin
      .from("pools")
      .select("id")
      .eq("slug", REAL_POOL_SLUG)
      .maybeSingle();

    if (poolError || !pool) {
      return fallbackParticipants();
    }

    const { data: members, error: membersError } = await admin
      .from("pool_members")
      .select("profiles!inner(username, display_name, is_active)")
      .eq("pool_id", pool.id);

    if (membersError || !members?.length) {
      return fallbackParticipants();
    }

    return members
      .map((row) => pickJoinedProfile(row.profiles))
      .filter((profile): profile is ProfileRow => profile !== null && profile.is_active)
      .map((profile) => ({
        username: profile.username,
        displayName: profile.display_name?.trim() || profile.username,
      }))
      .sort((a, b) => a.displayName.localeCompare(b.displayName, "es"));
  } catch {
    return fallbackParticipants();
  }
}

export async function isKnownOnboardingParticipant(username: string): Promise<boolean> {
  const participants = await getOnboardingParticipants();
  const normalized = username.trim().toLowerCase();
  return participants.some((participant) => participant.username === normalized);
}
