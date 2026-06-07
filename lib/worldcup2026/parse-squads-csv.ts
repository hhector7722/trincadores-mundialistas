import { parseCsvContent, readInt, readOptionalText } from "@/lib/fjelstul-worldcup/parse-csv";
import { openFootballTeamName } from "@/lib/worldcup2026/squad-team-names";
import type { Wc2026SquadCsvRow } from "@/lib/worldcup2026/normalize-squads";

/** Parsea worldcup2026.squads.csv vendoreado en data/external/worldcup2026/. */
export function parseWc2026SquadsCsv(csv: string): Wc2026SquadCsvRow[] {
  return parseCsvContent(csv)
    .map((r) => {
      const rawTeam = readOptionalText(r.team_name ?? r.team_en ?? r.name_en);
      const playerName = readOptionalText(r.player_name ?? r.name);
      if (!rawTeam || !playerName) return null;

      return {
        team_name: openFootballTeamName(rawTeam),
        team_code: readOptionalText(r.team_code ?? r.fifa_code),
        player_name: playerName,
        shirt_number: readInt(r.shirt_number ?? r.jersey_number ?? ""),
        position: readOptionalText(r.position ?? r.position_name),
        club: readOptionalText(r.club),
        fifa_player_id: readOptionalText(r.fifa_player_id ?? r.player_id),
      };
    })
    .filter((r): r is Wc2026SquadCsvRow => r !== null);
}

/** Serializa filas a CSV para versionar en repo. */
export function serializeWc2026SquadsCsv(rows: Wc2026SquadCsvRow[]): string {
  const header =
    "team_name,team_code,player_name,shirt_number,position,club,fifa_player_id";
  const lines = rows.map((r) => {
    const esc = (v: string | number | null) => {
      if (v === null || v === undefined) return "";
      const s = String(v);
      return s.includes(",") || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s;
    };
    return [
      esc(r.team_name),
      esc(r.team_code),
      esc(r.player_name),
      esc(r.shirt_number),
      esc(r.position),
      esc(r.club),
      esc(r.fifa_player_id),
    ].join(",");
  });
  return [header, ...lines].join("\n") + "\n";
}
