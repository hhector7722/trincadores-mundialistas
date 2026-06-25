import { createAdminClient } from "@/lib/scripts/supabase-admin";
import { getTeamSquadByName } from "@/lib/worldcup-data/squad-queries";
import { getAllTournamentPlayers } from "@/lib/worldcup-data/all-squad-players-queries";
import { getAllWorldCupTeamsAlphabetically } from "@/lib/predictions/teams-picker-data";

async function main() {
  const admin = createAdminClient();

  // 1. Check all teams from group seeds
  const teams = getAllWorldCupTeamsAlphabetically();
  console.log("Teams from seeds:", teams.length);

  // 2. For each team, check if squad exists
  let found = 0;
  let notFound: string[] = [];
  for (const team of teams) {
    const squad = await getTeamSquadByName(admin, team);
    if (squad) {
      found++;
    } else {
      notFound.push(team);
    }
  }
  console.log("Squads found:", found);
  if (notFound.length > 0) {
    console.log("Squads NOT found:", notFound);
  }

  // 3. Check all tournament players
  const players = await getAllTournamentPlayers(admin);
  console.log("Total players:", players.length);
  if (players.length > 0) {
    const gks = players.filter((p) => p.position === "GK");
    console.log("Goalkeepers:", gks.length);
    console.log("Sample players:", players.slice(0, 3).map((p) => `${p.playerName} (${p.teamName}, ${p.position})`));
  }
}

main().catch(console.error);
