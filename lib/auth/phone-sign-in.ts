import type { SupabaseClient } from "@supabase/supabase-js";
import { toAuthEmail } from "@/lib/auth/credentials";
import { setOnboardedDeviceCookie } from "@/lib/auth/onboarding-device";
import { getOnboardingAccessCode } from "@/lib/pwa/onboarding-access-codes";
import { resolvePoolMemberships, setActivePoolCookie } from "@/lib/auth/session";
import { normalizeUsername } from "@/lib/auth/validation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { recordAppUsageEventWithClient } from "@/lib/usage/record";
import {
  normalizePhone,
  ONBOARDING_PHONE_DIRECTORY,
  resolveParticipantByPhone,
} from "@/lib/pwa/onboarding-phones";

export type PhoneSignInResult = { ok: true; username: string } | { ok: false; error: string };

async function finishSession(
  supabase: SupabaseClient,
  userId: string,
  username: string
): Promise<PhoneSignInResult> {
  try {
    await supabase.auth.signOut({ scope: "others" });
  } catch {
    // No bloquear login si falla cerrar otras sesiones.
  }

  const { data: memberships, error: membershipsError } = await supabase
    .from("pool_members")
    .select("pool_id")
    .eq("profile_id", userId);

  if (membershipsError) {
    await supabase.auth.signOut({ scope: "local" });
    return { ok: false, error: membershipsError.message };
  }

  const resolution = resolvePoolMemberships(memberships);
  if (resolution.status === "single") {
    await setActivePoolCookie(resolution.poolId);
  }

  await setOnboardedDeviceCookie(username);
  void recordAppUsageEventWithClient(supabase, userId, {
    eventType: "login",
    path: "/api/auth/phone-login",
    metadata: { source: "server" },
  });
  return { ok: true, username };
}

async function lookupProfileIdByUsername(username: string): Promise<string | null> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("profiles")
      .select("id")
      .eq("username", username)
      .maybeSingle();
    if (error || !data?.id) return null;
    return data.id;
  } catch {
    return null;
  }
}

async function syncAuthPassword(profileId: string, password: string, phone: string): Promise<boolean> {
  try {
    const admin = createAdminClient();
    const { error } = await admin.auth.admin.updateUserById(profileId, {
      password,
      phone: `+34${phone}`,
      phone_confirm: true,
    });
    return !error;
  } catch {
    return false;
  }
}

async function tryPasswordSignIn(
  supabase: SupabaseClient,
  email: string,
  password: string
): Promise<string | null> {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) return null;
  return data.user.id;
}

/**
 * Login solo con telefono: directorio local -> codigo integrado -> sync admin si hace falta.
 */
export async function signInUserByPhoneWithClient(
  phoneRaw: string,
  supabase: SupabaseClient
): Promise<PhoneSignInResult> {
  const phone = normalizePhone(phoneRaw);
  if (!phone) {
    return { ok: false, error: "Introduce tu numero de telefono." };
  }

  const participant = resolveParticipantByPhone(phone);
  if (!participant) {
    return { ok: false, error: "Telefono no reconocido." };
  }

  const username = participant.username;
  const email = toAuthEmail(username);
  const accessCode = getOnboardingAccessCode(username);
  const passwordsToTry = [accessCode, phone].filter(
    (value, index, list): value is string => Boolean(value) && list.indexOf(value) === index
  );

  for (const password of passwordsToTry) {
    const userId = await tryPasswordSignIn(supabase, email, password);
    if (userId) {
      return finishSession(supabase, userId, username);
    }
  }

  const profileId = await lookupProfileIdByUsername(username);
  if (!profileId) {
    return { ok: false, error: "No se pudo abrir la sesion." };
  }

  for (const password of passwordsToTry) {
    const synced = await syncAuthPassword(profileId, password, phone);
    if (!synced) continue;

    const userId = await tryPasswordSignIn(supabase, email, password);
    if (userId) {
      return finishSession(supabase, userId, username);
    }
  }

  return { ok: false, error: "No se pudo abrir la sesion." };
}

export async function signInUserByPhone(phoneRaw: string): Promise<PhoneSignInResult> {
  const supabase = await createClient();
  return signInUserByPhoneWithClient(phoneRaw, supabase);
}

export async function signInUserByUsernameWithClient(
  usernameRaw: string,
  supabase: SupabaseClient
): Promise<PhoneSignInResult> {
  const username = normalizeUsername(usernameRaw);
  if (!username) {
    return { ok: false, error: "Participante no reconocido." };
  }

  const phone = ONBOARDING_PHONE_DIRECTORY.find((row) => row.username === username)?.phone;
  if (!phone) {
    return { ok: false, error: "Participante no reconocido." };
  }

  return signInUserByPhoneWithClient(phone, supabase);
}

export async function signInUserByUsername(usernameRaw: string): Promise<PhoneSignInResult> {
  const supabase = await createClient();
  return signInUserByUsernameWithClient(usernameRaw, supabase);
}
