"use server";

import { cookies } from "next/headers";
import { getPresetAvatarUrl } from "@/lib/avatars/presets";
import {
  clearOnboardedDeviceCookie,
  getOnboardedDeviceUsername,
  isProfileOnboardingComplete,
  setOnboardedDeviceCookie,
} from "@/lib/auth/onboarding-device";
import { createClient } from "@/lib/supabase/server";
import {
  PWA_ONBOARDING_COOKIE,
  PWA_STANDALONE_GATE_COOKIE,
  PWA_STANDALONE_GATE_MAX_AGE_SECONDS,
} from "@/lib/pwa/onboarding-cookie";
import { isKnownOnboardingParticipant } from "@/lib/pwa/onboarding-participants";
import { REAL_PARTICIPANTS } from "@/lib/auth/participants";
import { hasOnboardingAccessCode } from "@/lib/pwa/onboarding-access-codes";
import { lookupProfileByPhone } from "@/lib/auth/profile-phone";
import { isOnboardingEligibleUsername, normalizePhone } from "@/lib/pwa/onboarding-phones";
import { normalizeUsername, validateUsername } from "@/lib/auth/validation";
import { createAdminClient } from "@/lib/supabase/admin";

type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string };

function hasStandaloneGate(cookieStore: Awaited<ReturnType<typeof cookies>>): boolean {
  return cookieStore.get(PWA_STANDALONE_GATE_COOKIE)?.value === "1";
}

export type PwaEntryRoute = "restore" | "login" | "onboard";

/** Decide cómo entrar en PWA: restaurar sesión, re-vincular teléfono o onboarding completo. */
export async function resolvePwaEntryRoute(): Promise<PwaEntryRoute> {
  const deviceUsername = await getOnboardedDeviceUsername();
  if (deviceUsername) {
    try {
      const admin = createAdminClient();
      const { data: profile, error } = await admin
        .from("profiles")
        .select("username, is_active, onboarding_completed_at, avatar_url")
        .eq("username", deviceUsername)
        .maybeSingle();

      if (!error && profile?.is_active && isProfileOnboardingComplete(profile)) {
        return "restore";
      }
    } catch {
      // Cookie de dispositivo obsoleta: seguir al onboarding.
    }
    await clearOnboardedDeviceCookie();
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("username, is_active, onboarding_completed_at, avatar_url")
      .eq("id", user.id)
      .maybeSingle();

    if (!error && profile?.is_active && isProfileOnboardingComplete(profile)) {
      await setOnboardedDeviceCookie(profile.username);
      return "restore";
    }
  }

  return "onboard";
}

export async function hasCompletedPwaOnboarding(): Promise<boolean> {
  const route = await resolvePwaEntryRoute();
  return route !== "onboard";
}

export async function confirmStandaloneInstallation(): Promise<ActionResult<null>> {
  const cookieStore = await cookies();
  cookieStore.set(PWA_STANDALONE_GATE_COOKIE, "1", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: PWA_STANDALONE_GATE_MAX_AGE_SECONDS,
  });
  return { ok: true, data: null };
}

function resolveParticipantDisplayName(username: string): string {
  const fromSeed = REAL_PARTICIPANTS.find((row) => row.username === username);
  if (fromSeed) return fromSeed.displayName;
  if (username === "paco") return "Paco";
  return username;
}

export async function identifyParticipantByUsername(
  usernameRaw: string
): Promise<ActionResult<{ username: string; displayName: string }>> {
  const cookieStore = await cookies();
  if (!hasStandaloneGate(cookieStore)) {
    return {
      ok: false,
      error: "Primero debes completar la comprobacion de instalacion en modo app.",
    };
  }

  const username = normalizeUsername(usernameRaw);
  const userError = validateUsername(username);
  if (userError) {
    return { ok: false, error: userError };
  }

  if (!hasOnboardingAccessCode(username)) {
    return { ok: false, error: "Alias no reconocido. Comprueba que es tu alias del grupo." };
  }

  return {
    ok: true,
    data: {
      username,
      displayName: resolveParticipantDisplayName(username),
    },
  };
}

export async function identifyParticipantByPhone(
  phoneRaw: string
): Promise<ActionResult<{ username: string; displayName: string }>> {
  const cookieStore = await cookies();
  if (!hasStandaloneGate(cookieStore)) {
    return {
      ok: false,
      error: "Primero debes completar la comprobacion de instalacion en modo app.",
    };
  }

  const phone = normalizePhone(phoneRaw);
  if (!phone) {
    return { ok: false, error: "Introduce tu numero de telefono." };
  }

  const profile = await lookupProfileByPhone(phone);
  if (!profile) {
    return {
      ok: false,
      error: "Numero no reconocido. Comprueba que es el movil registrado en el grupo.",
    };
  }

  const known = await isKnownOnboardingParticipant(profile.username);
  if (!known) {
    return { ok: false, error: "Ese participante no pertenece al grupo." };
  }

  return {
    ok: true,
    data: {
      username: profile.username,
      displayName: profile.displayName,
    },
  };
}

export async function assignParticipantAvatar(
  usernameRaw: string
): Promise<ActionResult<{ avatarUrl: string }>> {
  const cookieStore = await cookies();
  if (!hasStandaloneGate(cookieStore)) {
    return {
      ok: false,
      error: "Primero debes completar la comprobacion de instalacion en modo app.",
    };
  }

  const username = normalizeUsername(usernameRaw);
  if (!username) {
    return { ok: false, error: "Participante no valido." };
  }

  if (!hasOnboardingAccessCode(username)) {
    return { ok: false, error: "Ese participante no pertenece al grupo." };
  }

  const presetUrl = getPresetAvatarUrl(username);
  const admin = createAdminClient();

  const { data: profile, error: fetchError } = await admin
    .from("profiles")
    .select("id, avatar_url")
    .eq("username", username)
    .maybeSingle();

  if (fetchError || !profile) {
    return { ok: false, error: "No se encontro el perfil del participante." };
  }

  if (profile.avatar_url) {
    return { ok: true, data: { avatarUrl: profile.avatar_url } };
  }

  const { error: updateError } = await admin
    .from("profiles")
    .update({ avatar_url: presetUrl })
    .eq("id", profile.id)
    .is("avatar_url", null);

  if (updateError) {
    return { ok: false, error: "No se pudo guardar el avatar." };
  }

  return { ok: true, data: { avatarUrl: presetUrl } };
}

export async function completePwaOnboarding(
  usernameRaw: string
): Promise<ActionResult<null>> {
  const cookieStore = await cookies();
  if (!hasStandaloneGate(cookieStore)) {
    return {
      ok: false,
      error: "Primero debes completar la comprobacion de instalacion en modo app.",
    };
  }

  const username = normalizeUsername(usernameRaw);
  if (!username || !hasOnboardingAccessCode(username)) {
    return { ok: false, error: "Participante no valido para activacion." };
  }

  const admin = createAdminClient();
  const { data: profile, error: fetchError } = await admin
    .from("profiles")
    .select("id, avatar_url, onboarding_completed_at")
    .eq("username", username)
    .maybeSingle();

  if (fetchError || !profile) {
    return { ok: false, error: "No se encontro el perfil del participante." };
  }

  if (!profile.avatar_url) {
    return {
      ok: false,
      error: "Debes generar tu avatar antes de activar el acceso.",
    };
  }

  if (!profile.onboarding_completed_at) {
    const { error: activateError } = await admin
      .from("profiles")
      .update({ onboarding_completed_at: new Date().toISOString() })
      .eq("id", profile.id)
      .is("onboarding_completed_at", null);

    if (activateError) {
      return { ok: false, error: "No se pudo activar tu perfil." };
    }
  }

  await setOnboardedDeviceCookie(username);
  cookieStore.delete(PWA_STANDALONE_GATE_COOKIE);
  return { ok: true, data: null };
}
