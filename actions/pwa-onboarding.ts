"use server";

import { cookies } from "next/headers";
import { getPresetAvatarUrl } from "@/lib/avatars/presets";
import { getOnboardingAccessCode } from "@/lib/pwa/onboarding-access-codes";
import {
  PWA_ONBOARDING_COOKIE,
  PWA_ONBOARDING_MAX_AGE_SECONDS,
  PWA_STANDALONE_GATE_COOKIE,
  PWA_STANDALONE_GATE_MAX_AGE_SECONDS,
} from "@/lib/pwa/onboarding-cookie";
import { isKnownOnboardingParticipant } from "@/lib/pwa/onboarding-participants";
import { normalizeUsername } from "@/lib/auth/validation";
import { createAdminClient } from "@/lib/supabase/admin";

export type OnboardingCredentials = {
  username: string;
  displayName: string;
  accessCode: string;
};

type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string };

function hasStandaloneGate(cookieStore: Awaited<ReturnType<typeof cookies>>): boolean {
  return cookieStore.get(PWA_STANDALONE_GATE_COOKIE)?.value === "1";
}

export async function hasCompletedPwaOnboarding(): Promise<boolean> {
  const cookieStore = await cookies();
  return cookieStore.get(PWA_ONBOARDING_COOKIE)?.value === "1";
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

export async function revealParticipantCredentials(
  usernameRaw: string,
  displayName: string
): Promise<ActionResult<OnboardingCredentials>> {
  const cookieStore = await cookies();
  if (!hasStandaloneGate(cookieStore)) {
    return {
      ok: false,
      error: "Primero debes completar la comprobacion de instalacion en modo app.",
    };
  }

  const username = normalizeUsername(usernameRaw);
  if (!username) {
    return { ok: false, error: "Selecciona un participante valido." };
  }

  const known = await isKnownOnboardingParticipant(username);
  if (!known) {
    return { ok: false, error: "Ese participante no pertenece al grupo." };
  }

  const accessCode = getOnboardingAccessCode(username);
  if (!accessCode) {
    return {
      ok: false,
      error: "No hay codigo de acceso configurado para ese participante. Contacta al administrador.",
    };
  }

  return {
    ok: true,
    data: {
      username,
      displayName: displayName.trim() || username,
      accessCode,
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

  const known = await isKnownOnboardingParticipant(username);
  if (!known) {
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

export async function completePwaOnboarding(): Promise<ActionResult<null>> {
  const cookieStore = await cookies();
  cookieStore.set(PWA_ONBOARDING_COOKIE, "1", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: PWA_ONBOARDING_MAX_AGE_SECONDS,
  });
  cookieStore.delete(PWA_STANDALONE_GATE_COOKIE);
  return { ok: true, data: null };
}
