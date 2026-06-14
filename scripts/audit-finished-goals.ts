import { fetchBsdLiveBundle } from "@/lib/live/sources/bsd-live";
import { extractGoalScorersByTeam } from "@/lib/live/goal-scorers";

const matches = [
  { event: 8287, home: "Mexico", away: "South Africa" },
  { event: 8288, home: "South Korea", away: "Czech Republic" },
  { event: 8289, home: "Canada", away: "Bosnia & Herzegovina" },
  { event: 8290, home: "USA", away: "Paraguay" },
  { event: 8292, home: "Qatar", away: "Switzerland" },
  { event: 8293, home: "Brazil", away: "Morocco" },
  { event: 8294, home: "Haiti", away: "Scotland" },
  { event: 8291, home: "Australia", away: "Turkey" },
];

function formatGoals(goals: ReturnType<typeof extractGoalScorersByTeam>["home"]) {
  return goals.map((g) => `${g.playerName}${g.minute != null ? ` ${g.minute}'` : " (sin min)"}`).join(" | ");
}

async function main() {
  for (const m of matches) {
    const bundle = await fetchBsdLiveBundle(m.event, m.home, m.away);
    const goals = extractGoalScorersByTeam(bundle.payload.playerIncidents);
    console.log(`--- ${m.home} vs ${m.away} (${bundle.homeScore}-${bundle.awayScore})`);
    console.log(`HOME: ${formatGoals(goals.home)}`);
    console.log(`AWAY: ${formatGoals(goals.away)}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
