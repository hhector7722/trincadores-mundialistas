/**
 * Añade un participante al pool existente (auth + profile + pool_member).
 * Uso: npx tsx --env-file=.env.local scripts/add-participant.ts <username>
 */
import { createClient } from "@supabase/supabase-js";
import { getPresetAvatarUrl } from "../lib/avatars/presets";
import { toAuthEmail } from "../lib/auth/credentials";
import {
  REAL_PARTICIPANTS,
  REAL_POOL_SLUG,
} from "../lib/auth/participants";
import { BUILT_IN_ONBOARDING_ACCESS_CODES } from "../lib/pwa/onboarding-access-codes-built-in";
import { ONBOARDING_PHONE_DIRECTORY } from "../lib/pwa/onboarding-phones";
import { assertServiceEnv } from "../lib/scripts/env-guard";

async function main() {
  assertServiceEnv();

  const username = process.argv[2]?.trim().toLowerCase();
  if (!username) {
    throw new Error("Uso: npx tsx --env-file=.env.local scripts/add-participant.ts <username>");
  }

  const participant = REAL_PARTICIPANTS.find((row) => row.username === username);
  if (!participant) {
    throw new Error(`Participante no definido en REAL_PARTICIPANTS: ${username}`);
  }

  const phone = ONBOARDING_PHONE_DIRECTORY.find((row) => row.username === username)?.phone;
  if (!phone) {
    throw new Error(`Telefono no definido en ONBOARDING_PHONE_DIRECTORY: ${username}`);
  }

  const code = BUILT_IN_ONBOARDING_ACCESS_CODES[username];
  if (!code) {
    throw new Error(`Codigo de acceso no definido: ${username}`);
  }

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { data: existingProfile } = await admin
    .from("profiles")
    .select("id")
    .eq("username", username)
    .maybeSingle();

  if (existingProfile) {
    throw new Error(`Ya existe un perfil con username ${username}.`);
  }

  const { data: pool, error: poolError } = await admin
    .from("pools")
    .select("id")
    .eq("slug", REAL_POOL_SLUG)
    .single();

  if (poolError || !pool) {
    throw poolError ?? new Error(`Pool no encontrado: ${REAL_POOL_SLUG}`);
  }

  const email = toAuthEmail(username);
  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password: code,
    phone: `+34${phone}`,
    phone_confirm: true,
    email_confirm: true,
    user_metadata: { username },
  });

  if (createError || !created.user) {
    throw createError ?? new Error(`No se pudo crear auth user: ${username}`);
  }

  const profileId = created.user.id;
  const avatarUrl = getPresetAvatarUrl(username);

  const { error: profileError } = await admin.from("profiles").insert({
    id: profileId,
    username,
    display_name: participant.displayName,
    phone,
    avatar_url: avatarUrl,
    is_active: true,
  });

  if (profileError) {
    await admin.auth.admin.deleteUser(profileId);
    throw profileError;
  }

  const { error: memberError } = await admin.from("pool_members").insert({
    pool_id: pool.id,
    profile_id: profileId,
    role: participant.role,
  });

  if (memberError) {
    await admin.from("profiles").delete().eq("id", profileId);
    await admin.auth.admin.deleteUser(profileId);
    throw memberError;
  }

  console.log(`Participante creado: ${participant.displayName} (${username})`);
  console.log(`Telefono: ${phone}`);
  console.log(`Avatar: ${avatarUrl}`);
  console.log(`Codigo de acceso: ${code}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
