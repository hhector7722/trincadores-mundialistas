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
import { setOnboardedDeviceCookie } from "@/lib/auth/onboarding-device";
import { signInUserByPhone } from "@/lib/auth/phone-sign-in";
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

  await setOnboardedDeviceCookie(username);
  return { ok: true };
}

export async function signInWithPhone(phoneRaw: string): Promise<AuthActionResult> {
  const result = await signInUserByPhone(phoneRaw);
  if (!result.ok) {
    return { ok: false, error: result.error };
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
