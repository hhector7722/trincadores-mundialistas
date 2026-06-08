import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { generateAccessCode } from "../lib/auth/access-code";
import { toAuthEmail } from "../lib/auth/credentials";
import {
  REAL_PARTICIPANTS,
  REAL_POOL_NAME,
  REAL_POOL_SLUG,
} from "../lib/auth/participants";
import {
  assertBootstrapAllowed,
  assertServiceEnv,
} from "../lib/scripts/env-guard";

type DeliveredCode = {
  username: string;
  displayName: string;
  role: string;
  code: string;
};

async function main() {
  assertServiceEnv();
  assertBootstrapAllowed();

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { data: existingPools, error: existingError } = await admin
    .from("pools")
    .select("id")
    .eq("slug", REAL_POOL_SLUG);

  if (existingError) throw existingError;
  if ((existingPools ?? []).length > 0) {
    throw new Error(`Ya existe un pool con slug ${REAL_POOL_SLUG}. Abortando.`);
  }

  const { data: pool, error: poolError } = await admin
    .from("pools")
    .insert({
      slug: REAL_POOL_SLUG,
      name: REAL_POOL_NAME,
      settings_json: { prediction_visibility: "kickoff" },
    })
    .select("id")
    .single();

  if (poolError || !pool) {
    throw poolError ?? new Error("No se pudo crear el pool.");
  }

  const poolId = pool.id;
  console.log(`Pool creado: ${REAL_POOL_NAME} (${poolId})`);

  const delivered: DeliveredCode[] = [];
  const onboardingCodes: Record<string, string> = {};

  for (const participant of REAL_PARTICIPANTS) {
    const code = generateAccessCode();
    const email = toAuthEmail(participant.username);

    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email,
      password: code,
      email_confirm: true,
      user_metadata: { username: participant.username },
    });

    if (createError || !created.user) {
      throw createError ?? new Error(`No se pudo crear auth user: ${participant.username}`);
    }

    const profileId = created.user.id;

    const { error: profileError } = await admin.from("profiles").insert({
      id: profileId,
      username: participant.username,
      display_name: participant.displayName,
      is_active: true,
    });

    if (profileError) {
      throw profileError;
    }

    const { error: memberError } = await admin.from("pool_members").insert({
      pool_id: poolId,
      profile_id: profileId,
      role: participant.role,
    });

    if (memberError) {
      throw memberError;
    }

    delivered.push({
      username: participant.username,
      displayName: participant.displayName,
      role: participant.role,
      code,
    });
    onboardingCodes[participant.username] = code;

    console.log(`Participante creado: ${participant.username} (${participant.role})`);
  }

  const outputPath = resolve(process.cwd(), "access-codes.local.txt");
  const lines = delivered.map(
    (row) => `${row.displayName} (${row.username}) [${row.role}]: ${row.code}`
  );
  writeFileSync(outputPath, `${lines.join("\n")}\n`, "utf8");

  const onboardingJsonPath = resolve(process.cwd(), "onboarding-codes.local.json");
  writeFileSync(onboardingJsonPath, `${JSON.stringify(onboardingCodes)}\n`, "utf8");

  const siteOrigin = process.env.NEXT_PUBLIC_SITE_URL?.trim() ?? "http://localhost:3000";

  console.log(`\nCodigos guardados en ${outputPath} (gitignored).`);
  console.log(`JSON onboarding guardado en ${onboardingJsonPath} (gitignored).`);
  console.log(`Copia el contenido de onboarding-codes.local.json a ONBOARDING_ACCESS_CODES_JSON en Vercel.`);
  console.log(`Enlace generico de onboarding: ${siteOrigin}/bienvenida`);
  console.log("Bootstrap completado.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
