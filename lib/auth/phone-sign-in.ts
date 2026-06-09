import type { SupabaseClient } from "@supabase/supabase-js";
import { toAuthEmail } from "@/lib/auth/credentials";
import { setOnboardedDeviceCookie } from "@/lib/auth/onboarding-device";
import { resolvePoolMemberships, setActivePoolCookie } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  normalizePhone,
  resolveParticipantByPhone,
  resolveParticipantByAlias,
} from "@/lib/pwa/onboarding-phones";
import { normalizeUsername } from "@/lib/auth/validation";

export type PhoneSignInResult = { ok: true; username: string } | { ok: false; error: string };

async function finishSession(
  supabase: SupabaseClient,
  userId: string,
  username: string
): Promise<PhoneSignInResult> {
  await supabase.auth.signOut({ scope: "others" });

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
  return { ok: true, username };
}

/**
 * Abre sesion solo con telefono: sincroniza password en Auth y entra.
 * Cierra el resto de sesiones activas del mismo usuario.
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

  const admin = createAdminClient();
  const email = toAuthEmail(participant.username);

  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("id")
    .eq("username", participant.username)
    .maybeSingle();

  if (profileError || !profile) {
    return { ok: false, error: "No se encontro el perfil del participante." };
  }

  const { error: passwordError } = await admin.auth.admin.updateUserById(profile.id, {
    password: phone,
  });

  if (passwordError) {
    return { ok: false, error: "No se pudo abrir la sesion." };
  }

  const { data, error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password: phone,
  });

  if (signInError || !data.user) {
    return { ok: false, error: "No se pudo abrir la sesion." };
  }

  return finishSession(supabase, data.user.id, participant.username);
}

export async function signInUserByPhone(phoneRaw: string): Promise<PhoneSignInResult> {
  const supabase = await createClient();
  return signInUserByPhoneWithClient(phoneRaw, supabase);
}

export async function signInUserByUsername(usernameRaw: string): Promise<PhoneSignInResult> {
  const username = normalizeUsername(usernameRaw);
  const participant = resolveParticipantByAlias(username);
  if (!participant) {
    return { ok: false, error: "Participante no reconocido." };
  }

  const supabase = await createClient();
  return signInUserByPhoneWithClient(participant.phone, supabase);
}
