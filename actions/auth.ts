"use server";

import { redirect } from "next/navigation";
import { normalizeAccessCode, validateAccessCode } from "@/lib/auth/access-code";
import { toAuthEmail } from "@/lib/auth/credentials";
import {
  clearActivePoolCookie,
  resolvePoolMemberships,
  setActivePoolCookie,
} from "@/lib/auth/session";
import { normalizeUsername, validateUsername } from "@/lib/auth/validation";
import { signInTrustedUserByUsername } from "@/lib/auth/trusted-sign-in";
import { getOnboardingAccessCode } from "@/lib/pwa/onboarding-access-codes";
import { normalizePhone, resolveParticipantByPhone } from "@/lib/pwa/onboarding-phones";
import { assertPoolMembership } from "@/lib/pool/active-pool";
import { createClient } from "@/lib/supabase/server";

export type AuthActionResult = { ok: true } | { ok: false; error: string };

const LOGIN_ERROR = "Alias o codigo incorrectos.";

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

export async function signIn(
  usernameRaw: string,
  accessCodeRaw: string
): Promise<AuthActionResult> {
  const username = normalizeUsername(usernameRaw);
  const accessCode = normalizeAccessCode(accessCodeRaw);

  const userError = validateUsername(username);
  const codeError = validateAccessCode(accessCode);
  if (userError) return { ok: false, error: userError };
  if (codeError) return { ok: false, error: codeError };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: toAuthEmail(username),
    password: accessCode,
  });

  if (error || !data.user) {
    return { ok: false, error: LOGIN_ERROR };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("is_active")
    .eq("id", data.user.id)
    .maybeSingle();

  if (profileError) {
    await supabase.auth.signOut();
    return { ok: false, error: "No se pudo validar el perfil." };
  }

  if (!profile?.is_active) {
    await supabase.auth.signOut();
    return { ok: false, error: "Cuenta desactivada. Contacta al administrador." };
  }

  try {
    await applyPoolCookieForUser(data.user.id);
  } catch (e) {
    await supabase.auth.signOut();
    const msg = e instanceof Error ? e.message : "Error al resolver la porra.";
    return { ok: false, error: msg };
  }

  return { ok: true };
}

export async function signInWithPhone(phoneRaw: string): Promise<AuthActionResult> {
  const phone = normalizePhone(phoneRaw);
  if (!phone) {
    return { ok: false, error: "Introduce tu numero de telefono." };
  }

  const participant = resolveParticipantByPhone(phone);
  if (!participant) {
    return { ok: false, error: "Telefono no reconocido." };
  }

  const accessCode = getOnboardingAccessCode(participant.username);
  if (accessCode) {
    return signIn(participant.username, accessCode);
  }

  const trusted = await signInTrustedUserByUsername(participant.username);
  if (!trusted.ok) {
    return trusted;
  }

  const supabase = await createClient();
  try {
    await applyPoolCookieForUser(trusted.userId);
  } catch (e) {
    await supabase.auth.signOut();
    const msg = e instanceof Error ? e.message : "Error al resolver la porra.";
    return { ok: false, error: msg };
  }

  return { ok: true };
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  await clearActivePoolCookie();
  redirect("/login");
}

export async function setActivePool(poolId: string): Promise<AuthActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "Sesion no valida." };
  }

  const allowed = await assertPoolMembership(user.id, poolId);
  if (!allowed) {
    return { ok: false, error: "No perteneces a esa porra." };
  }

  await setActivePoolCookie(poolId);
  return { ok: true };
}
