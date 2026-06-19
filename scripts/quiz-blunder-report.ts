/**
 * Informe de respuestas incorrectas del quiz oficial (premio "fallos claros").
 *
 * npm run quiz:blunder-report
 * npm run quiz:blunder-report -- --pool=trincadores
 */
import { REAL_POOL_SLUG } from "@/lib/auth/participants";
import { createClient } from "@supabase/supabase-js";

function readArg(prefix: string): string | null {
  const match = process.argv.find((arg) => arg.startsWith(`${prefix}=`));
  return match ? match.slice(prefix.length + 1).trim() : null;
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    console.error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY.");
    process.exit(1);
  }

  const poolSlug = readArg("--pool") ?? process.env.POOL_SLUG?.trim() ?? REAL_POOL_SLUG;
  const admin = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: pool, error: poolError } = await admin
    .from("pools")
    .select("id, name")
    .eq("slug", poolSlug)
    .maybeSingle();

  if (poolError || !pool?.id) {
    console.error(`Pool no encontrado: ${poolSlug}`);
    process.exit(1);
  }

  const { data: rows, error } = await admin.rpc("get_pool_quiz_wrong_answers", {
    p_pool_id: pool.id,
  });

  if (error) {
    console.error(error.message);
    process.exit(1);
  }

  const blunders = rows ?? [];
  console.log(`# Fallos quiz — ${pool.name} (${blunders.length} respuestas incorrectas)\n`);

  if (!blunders.length) {
    console.log("Sin datos todavía.");
    return;
  }

  for (const row of blunders) {
    const who = row.display_name?.trim() || row.username;
    const date = row.quiz_date ?? "sin-fecha";
    console.log(`## ${who} — ${date}`);
    console.log(`Pregunta: ${row.question_prompt}`);
    console.log(`Respondió: ${row.selected_option_label}`);
    console.log(`Correcta: ${row.correct_option_label}`);
    console.log("");
  }

  const byUser = new Map<string, number>();
  for (const row of blunders) {
    const key = row.display_name?.trim() || row.username;
    byUser.set(key, (byUser.get(key) ?? 0) + 1);
  }

  console.log("# Ranking de fallos (más incorrectas primero)\n");
  [...byUser.entries()]
    .sort((a, b) => b[1] - a[1])
    .forEach(([name, count], index) => {
      console.log(`${index + 1}. ${name} — ${count} fallos`);
    });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
