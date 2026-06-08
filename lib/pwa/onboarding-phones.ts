import { normalizeAlias } from "@/lib/text/normalize-alias";

export type PhoneParticipant = {
  username: string;
  displayName: string;
  phone: string;
};

/** Teléfonos del grupo — coincidencia exacta tras normalizar a dígitos. */
export const ONBOARDING_PHONE_DIRECTORY: PhoneParticipant[] = [
  { username: "teixeira", displayName: "Teixeira", phone: "605187355" },
  { username: "nacho", displayName: "Nacho", phone: "639485610" },
  { username: "damo", displayName: "Damo", phone: "649224147" },
  { username: "solskjaer", displayName: "Solskjær", phone: "601353725" },
  { username: "gabri", displayName: "Gabri", phone: "605442296" },
  { username: "oro", displayName: "Oro", phone: "626155719" },
  { username: "sanfe", displayName: "Sanfe", phone: "670658044" },
  { username: "gonza", displayName: "Gonza", phone: "606021566" },
  { username: "dani", displayName: "Dani", phone: "697989788" },
  { username: "hector", displayName: "Hector", phone: "647229309" },
];

export function normalizePhone(raw: string): string {
  let digits = raw.replace(/\D/g, "");
  if (digits.startsWith("34") && digits.length === 11) {
    digits = digits.slice(2);
  }
  return digits;
}

export const ONBOARDING_ELIGIBLE_USERNAMES = new Set(
  ONBOARDING_PHONE_DIRECTORY.map((row) => row.username)
);

export function isOnboardingEligibleUsername(username: string): boolean {
  return ONBOARDING_ELIGIBLE_USERNAMES.has(normalizeAlias(username));
}

export function resolveParticipantByAlias(raw: string): PhoneParticipant | null {
  const alias = normalizeAlias(raw);
  if (!alias) return null;
  return ONBOARDING_PHONE_DIRECTORY.find((row) => normalizeAlias(row.username) === alias) ?? null;
}

export function resolveParticipantByPhone(raw: string): PhoneParticipant | null {
  const phone = normalizePhone(raw);
  if (!phone) return null;
  return ONBOARDING_PHONE_DIRECTORY.find((row) => row.phone === phone) ?? null;
}
