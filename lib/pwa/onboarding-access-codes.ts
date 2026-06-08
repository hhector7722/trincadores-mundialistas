import { normalizeUsername } from "@/lib/auth/validation";

function parseAccessCodesJson(raw: string): Record<string, string> {
  const parsed = JSON.parse(raw) as unknown;
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("ONBOARDING_ACCESS_CODES_JSON debe ser un objeto JSON.");
  }

  const map: Record<string, string> = {};
  for (const [key, value] of Object.entries(parsed)) {
    if (typeof value !== "string" || !value.trim()) continue;
    map[normalizeUsername(key)] = value.trim().toUpperCase();
  }
  return map;
}

export function getOnboardingAccessCodeMap(): Record<string, string> {
  const raw = process.env.ONBOARDING_ACCESS_CODES_JSON?.trim();
  if (!raw) return {};
  return parseAccessCodesJson(raw);
}

export function getOnboardingAccessCode(username: string): string | null {
  const map = getOnboardingAccessCodeMap();
  return map[normalizeUsername(username)] ?? null;
}
