import { createAdminClient } from "@/lib/supabase/admin";
import {
  normalizePhone,
  ONBOARDING_PHONE_DIRECTORY,
  resolveParticipantByPhone,
} from "@/lib/pwa/onboarding-phones";

export type ProfilePhoneRow = {
  id: string;
  username: string;
  displayName: string;
  phone: string;
};

type ProfileSelectRow = {
  id: string;
  username: string;
  display_name: string | null;
};

function toProfilePhoneRow(row: ProfileSelectRow, phone: string): ProfilePhoneRow {
  return {
    id: row.id,
    username: row.username,
    displayName: row.display_name?.trim() || row.username,
    phone,
  };
}

async function lookupProfileByUsername(
  username: string,
  phone: string
): Promise<ProfilePhoneRow | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("profiles")
    .select("id, username, display_name")
    .eq("username", username)
    .maybeSingle();

  if (error || !data) return null;
  return toProfilePhoneRow(data, phone);
}

/** Busca participante por movil (BD + fallback directorio local). */
export async function lookupProfileByPhone(
  phoneRaw: string
): Promise<ProfilePhoneRow | null> {
  const phone = normalizePhone(phoneRaw);
  if (!phone) return null;

  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("profiles")
      .select("id, username, display_name")
      .eq("phone", phone)
      .maybeSingle();

    if (!error && data) {
      return toProfilePhoneRow(data, phone);
    }
  } catch {
    // Seguir al fallback por username.
  }

  const participant = resolveParticipantByPhone(phone);
  if (!participant) return null;

  try {
    return await lookupProfileByUsername(participant.username, phone);
  } catch {
    return null;
  }
}

/** Movil nacional guardado en profiles para un alias. */
export async function lookupPhoneByUsername(username: string): Promise<string | null> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("profiles")
      .select("phone")
      .eq("username", username)
      .maybeSingle();

    if (!error && data?.phone) return data.phone;
  } catch {
    // fallback abajo
  }

  return ONBOARDING_PHONE_DIRECTORY.find((row) => row.username === username)?.phone ?? null;
}
