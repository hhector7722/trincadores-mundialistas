import { cookies } from "next/headers";
import { normalizeUsername } from "@/lib/auth/validation";
import { PWA_ONBOARDING_COOKIE } from "@/lib/pwa/onboarding-cookie";

/** Usuario que ya completó onboarding en este dispositivo (persistente). */
export const ONBOARDED_USER_COOKIE = "tm_onboarded_user";

/** 5 años — el dispositivo recuerda al jugador tras el primer onboarding. */
export const ONBOARDED_USER_MAX_AGE_SECONDS = 60 * 60 * 24 * 365 * 5;

export function readOnboardedUsernameFromCookieValue(
  onboardedUser: string | undefined,
  legacyPwaVerified: string | undefined
): string | null {
  const raw = onboardedUser?.trim();
  if (raw) {
    const username = normalizeUsername(raw);
    return username || null;
  }
  if (legacyPwaVerified === "1") {
    return null;
  }
  return null;
}

export async function getOnboardedDeviceUsername(): Promise<string | null> {
  const store = await cookies();
  return readOnboardedUsernameFromCookieValue(
    store.get(ONBOARDED_USER_COOKIE)?.value,
    store.get(PWA_ONBOARDING_COOKIE)?.value
  );
}

export async function clearOnboardedDeviceCookie(): Promise<void> {
  const store = await cookies();
  store.delete(ONBOARDED_USER_COOKIE);
  store.delete(PWA_ONBOARDING_COOKIE);
}

export async function setOnboardedDeviceCookie(username: string): Promise<void> {
  const normalized = normalizeUsername(username);
  if (!normalized) return;

  const store = await cookies();
  store.set(ONBOARDED_USER_COOKIE, normalized, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ONBOARDED_USER_MAX_AGE_SECONDS,
  });
  store.set(PWA_ONBOARDING_COOKIE, "1", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ONBOARDED_USER_MAX_AGE_SECONDS,
  });
}

export type OnboardingProfileRow = {
  username: string;
  is_active: boolean | null;
  onboarding_completed_at: string | null;
  avatar_url: string | null;
};

export function isProfileOnboardingComplete(
  profile: Pick<OnboardingProfileRow, "onboarding_completed_at" | "avatar_url">
): boolean {
  return Boolean(profile.onboarding_completed_at?.trim() || profile.avatar_url?.trim());
}
