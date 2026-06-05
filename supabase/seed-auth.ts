import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { toAuthEmail } from "../lib/auth/credentials";
import {
  DEV_SEED_PASSWORD,
  SEED_USER_IDS,
  SEED_USERNAMES,
} from "../lib/dev/seed-ids";

async function ensureAuthUsers() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error("Faltan NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY");
  }
  const admin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  for (const key of Object.keys(SEED_USER_IDS) as (keyof typeof SEED_USER_IDS)[]) {
    const id = SEED_USER_IDS[key];
    const username = SEED_USERNAMES[key];
    const email = toAuthEmail(username);
    const { data: existing } = await admin.auth.admin.getUserById(id);
    if (existing?.user) {
      await admin.auth.admin.updateUserById(id, {
        email,
        password: DEV_SEED_PASSWORD,
        email_confirm: true,
      });
      console.log(`Usuario actualizado: ${username}`);
      continue;
    }
    const { error } = await admin.auth.admin.createUser({
      id,
      email,
      password: DEV_SEED_PASSWORD,
      email_confirm: true,
      user_metadata: { username },
    });
    if (error) throw error;
    console.log(`Usuario creado: ${username} (${id})`);
  }
}

async function runSeedSql() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.log("DATABASE_URL no definida. Ejecuta manualmente:");
    console.log("  supabase db execute -f supabase/seed.sql");
    console.log("  o psql $DATABASE_URL -f supabase/seed.sql");
    return;
  }
  const { Client } = await import("pg");
  const sql = readFileSync(resolve(process.cwd(), "supabase/seed.sql"), "utf8");
  const client = new Client({ connectionString: dbUrl });
  await client.connect();
  try {
    await client.query(sql);
    console.log("seed.sql aplicado correctamente.");
  } finally {
    await client.end();
  }
}

async function main() {
  await ensureAuthUsers();
  await runSeedSql();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
