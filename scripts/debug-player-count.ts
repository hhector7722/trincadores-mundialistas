import { createAdminClient } from "@/lib/scripts/supabase-admin";
import { getAllTournamentPlayers } from "@/lib/worldcup-data/all-squad-players-queries";

async function main() {
  const client = createAdminClient();
  const players = await getAllTournamentPlayers(client);
  console.log("Total jugadores:", players.length);

  // Check for Unai Simon
  const unai = players.filter(
    (p) => p.playerName.toLowerCase().includes("unai")
  );
  console.log('Unai*s:', unai.map((p) => `${p.playerName} (${p.teamName}, ${p.position})`));
}

main().catch(console.error);
