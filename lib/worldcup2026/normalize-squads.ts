import type { TeamSquadPlayerRow, TeamSquadRow } from "@/lib/worldcup-data/types";
import { WC2026_FEED_SOURCE } from "@/lib/worldcup-data/types";
import type { FifaCalendarTeamRef, FifaSquadPlayerRaw } from "@/lib/worldcup2026/fifa-squads";
import { openFootballNameFromFifaCode } from "@/lib/worldcup2026/squad-team-names";

export const WC2026_SQUAD_YEAR = 2026;
export const WC2026_SQUAD_COMPETITION = "WC2026";

export type Wc2026SquadCsvRow = {
  team_name: string;
  team_code: string | null;
  player_name: string;
  shirt_number: number | null;
  position: string | null;
  club: string | null;
  fifa_player_id: string | null;
};

export function normalizePositionForStorage(position: string | null): string | null {
  const raw = (position ?? "").toLowerCase().trim();
  if (!raw) return null;
  if (raw.includes("goal")) return "GK";
  if (raw.includes("def")) return "DF";
  if (raw.includes("mid")) return "MF";
  if (raw.includes("for") || raw.includes("offence") || raw.includes("offense")) return "FW";
  return position?.trim() ?? null;
}

export function squadExternalKey(teamCode: string): string {
  return `WC2026:${teamCode}`;
}

export function normalizeFifaSquadsToRows(
  teams: FifaCalendarTeamRef[],
  playersByTeamId: Map<string, FifaSquadPlayerRaw[]>
): { squads: TeamSquadRow[]; players: TeamSquadPlayerRow[] } {
  const squads: TeamSquadRow[] = [];
  const players: TeamSquadPlayerRow[] = [];

  for (const team of teams) {
    const teamName = openFootballNameFromFifaCode(team.fifaCode);
    if (!teamName) continue;

    const extKey = squadExternalKey(team.fifaCode);
    squads.push({
      source_code: WC2026_FEED_SOURCE,
      external_key: extKey,
      team_name: teamName,
      team_code: team.fifaCode,
      year: WC2026_SQUAD_YEAR,
      tournament_external_id: WC2026_SQUAD_COMPETITION,
      competition_code: WC2026_SQUAD_COMPETITION,
      label: `${teamName} — FIFA World Cup 2026`,
    });

    for (const p of playersByTeamId.get(team.idTeam) ?? []) {
      players.push({
        squad_external_key: extKey,
        external_player_key: p.idPlayer,
        player_name: p.name,
        position: normalizePositionForStorage(p.position),
        shirt_number: p.shirtNumber,
        club: null,
        status: "called_up",
        metadata: { fifa_player_id: p.idPlayer, source: "fifa_api" },
      });
    }
  }

  return { squads, players };
}

export function normalizeCsvSquadsToRows(rows: Wc2026SquadCsvRow[]): {
  squads: TeamSquadRow[];
  players: TeamSquadPlayerRow[];
} {
  const squadsByKey = new Map<string, TeamSquadRow>();
  const players: TeamSquadPlayerRow[] = [];

  for (const r of rows) {
    const teamName = r.team_name.trim();
    const teamCode = r.team_code?.trim().toUpperCase() ?? teamName.slice(0, 3).toUpperCase();
    const extKey = squadExternalKey(teamCode);

    if (!squadsByKey.has(extKey)) {
      squadsByKey.set(extKey, {
        source_code: WC2026_FEED_SOURCE,
        external_key: extKey,
        team_name: teamName,
        team_code: teamCode,
        year: WC2026_SQUAD_YEAR,
        tournament_external_id: WC2026_SQUAD_COMPETITION,
        competition_code: WC2026_SQUAD_COMPETITION,
        label: `${teamName} — FIFA World Cup 2026`,
      });
    }

    players.push({
      squad_external_key: extKey,
      external_player_key: r.fifa_player_id,
      player_name: r.player_name.trim(),
      position: normalizePositionForStorage(r.position),
      shirt_number: r.shirt_number,
      club: r.club?.trim() || null,
      status: "called_up",
      metadata: { source: "worldcup2026.squads.csv" },
    });
  }

  return { squads: [...squadsByKey.values()], players };
}
