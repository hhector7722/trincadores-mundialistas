import { createAdminClient } from "@/lib/scripts/supabase-admin";

async function main() {
  const admin = createAdminClient();

  const { data: matches } = await admin
    .from("matches")
    .select("id, match_number, home_team, away_team, kickoff_at")
    .in("match_number", [89, 90]);

  if (!matches || matches.length !== 2) {
    throw new Error("No se encontraron los partidos 89 y 90");
  }

  const match89 = matches.find((m) => m.match_number === 89)!;
  const match90 = matches.find((m) => m.match_number === 90)!;

  console.log("Antes:");
  console.log(`  Match 89 (${match89.home_team} vs ${match89.away_team}): ${match89.kickoff_at}`);
  console.log(`  Match 90 (${match90.home_team} vs ${match90.away_team}): ${match90.kickoff_at}`);

  const time89 = match89.kickoff_at;
  const time90 = match90.kickoff_at;

  const { error: err1 } = await admin
    .from("matches")
    .update({ kickoff_at: time90 })
    .eq("id", match89.id);

  if (err1) throw new Error(`Error actualizando match 89: ${err1.message}`);

  const { error: err2 } = await admin
    .from("matches")
    .update({ kickoff_at: time89 })
    .eq("id", match90.id);

  if (err2) throw new Error(`Error actualizando match 90: ${err2.message}`);

  console.log("Después:");
  console.log(`  Match 89: ahora ${time90}`);
  console.log(`  Match 90: ahora ${time89}`);
  console.log("Horarios corregidos correctamente.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
