import { createAdminClient } from "@/lib/supabase/admin";
import { normalizePhone } from "@/lib/pwa/onboarding-phones";

export type ProfilePhoneRow = {
  id: string;
  username: string;
  displayName: string;
  phone: string;
};

/** Busca participante por movil en profiles.phone (fuente de verdad en BD). */
export async function lookupProfileByPhone(
  phoneRaw: string
): Promise<ProfilePhoneRow | null> {
  const phone = normalizePhone(phoneRaw);
  if (!phone) return null;

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("profiles")
    .select("id, username, display_name, phone")
    .eq("phone", phone)
    .maybeSingle();

  if (error || !data?.phone) return null;

  return {
    id: data.id,
    username: data.username,
    displayName: data.display_name?.trim() || data.username,
    phone: data.phone,
  };
}

/** Movil nacional guardado en profiles para un alias. */
export async function lookupPhoneByUsername(username: string): Promise<string | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("profiles")
    .select("phone")
    .eq("username", username)
    .maybeSingle();

  if (error || !data?.phone) return null;
  return data.phone;
}
