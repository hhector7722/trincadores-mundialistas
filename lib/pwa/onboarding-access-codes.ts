import { normalizeUsername } from "@/lib/auth/validation";
import { BUILT_IN_ONBOARDING_ACCESS_CODES } from "@/lib/pwa/onboarding-access-codes-built-in";

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

function readEnvAccessCodes(): Record<string, string> {
  const raw = process.env.ONBOARDING_ACCESS_CODES_JSON?.trim();
  if (!raw || raw === '""' || raw === "''") return {};

  try {
    const parsed = parseAccessCodesJson(raw);
    return Object.keys(parsed).length > 0 ? parsed : {};
  } catch {
    return {};
  }
}

export function getOnboardingAccessCodeMap(): Record<string, string> {
  return {
    ...BUILT_IN_ONBOARDING_ACCESS_CODES,
    ...readEnvAccessCodes(),
  };
}

export function getOnboardingAccessCode(username: string): string | null {
  const map = getOnboardingAccessCodeMap();
  return map[normalizeUsername(username)] ?? null;
}
