import { titleCasePlayerName } from "@/lib/worldcup2026/fifa-squads";
import type { MatchPlayerIncident } from "@/lib/live/types";

export type BsdPlayerIncidentRaw = {
  type?: string;
  minute?: number | string | null;
  is_home?: boolean;
  player?: string;
  player_name?: string;
  assist?: string;
  assist_player?: string;
  assist_name?: string;
  related_player?: string;
  card_type?: string;
};

type BsdPlayerStatRow = {
  player?: string;
  player_name?: string;
  name?: string;
  short_name?: string;
  goals?: number;
  goal_assist?: number;
  yellow_card?: number;
  red_card?: number;
  team_id?: number;
};

export type BsdPlayerStatsResponse = {
  player_stats?: BsdPlayerStatRow[];
};

function normalizePlayerName(raw: string): string {
  return titleCasePlayerName(raw.trim());
}

function incidentPlayerName(incident: BsdPlayerIncidentRaw): string | null {
  const name = incident.player_name?.trim() || incident.player?.trim();
  return name ? normalizePlayerName(name) : null;
}

function incidentAssistName(incident: BsdPlayerIncidentRaw): string | null {
  const name =
    incident.assist_name?.trim() ||
    incident.assist_player?.trim() ||
    incident.assist?.trim() ||
    incident.related_player?.trim();
  return name ? normalizePlayerName(name) : null;
}

function teamSideFromIncident(incident: BsdPlayerIncidentRaw): "home" | "away" {
  return incident.is_home === false ? "away" : "home";
}

function statPlayerName(row: BsdPlayerStatRow): string | null {
  const name = row.player_name?.trim() || row.player?.trim() || row.name?.trim() || row.short_name?.trim();
  return name ? normalizePlayerName(name) : null;
}

function pushCountedIncidents(
  rows: MatchPlayerIncident[],
  kind: MatchPlayerIncident["kind"],
  playerName: string,
  teamSide: "home" | "away",
  count: number,
): void {
  const safeCount = Math.max(0, Math.floor(count));
  for (let index = 0; index < safeCount; index += 1) {
    rows.push({ kind, playerName, teamSide });
  }
}

export function parseBsdIncidentsPlayerEvents(
  incidents: BsdPlayerIncidentRaw[],
  _homeTeam: string,
  _awayTeam: string,
): MatchPlayerIncident[] {
  const rows: MatchPlayerIncident[] = [];

  for (const incident of incidents) {
    const type = incident.type?.trim().toLowerCase();

    if (type === "goal") {
      const scorer = incidentPlayerName(incident);
      if (scorer) {
        rows.push({ kind: "goal", playerName: scorer, teamSide: teamSideFromIncident(incident) });
      }

      const assist = incidentAssistName(incident);
      if (assist) {
        rows.push({ kind: "assist", playerName: assist, teamSide: teamSideFromIncident(incident) });
      }
      continue;
    }

    if (type === "card") {
      const player = incidentPlayerName(incident);
      if (!player) continue;

      const cardType = incident.card_type?.trim().toLowerCase();
      const teamSide = teamSideFromIncident(incident);

      if (cardType === "yellow") {
        rows.push({ kind: "yellow_card", playerName: player, teamSide });
      } else if (cardType === "red") {
        rows.push({ kind: "red_card", playerName: player, teamSide });
      } else if (cardType === "yellowred") {
        rows.push({ kind: "yellow_card", playerName: player, teamSide });
        rows.push({ kind: "red_card", playerName: player, teamSide });
      }
    }
  }

  return rows;
}

export function parseBsdPlayerStatsIncidents(
  payload: BsdPlayerStatsResponse | null,
  homeTeamId: number | null,
  awayTeamId: number | null,
): MatchPlayerIncident[] {
  const rows: MatchPlayerIncident[] = [];

  for (const stat of payload?.player_stats ?? []) {
    const playerName = statPlayerName(stat);
    if (!playerName) continue;

    const teamSide =
      awayTeamId != null && stat.team_id === awayTeamId
        ? "away"
        : homeTeamId != null && stat.team_id === homeTeamId
          ? "home"
          : "home";

    pushCountedIncidents(rows, "goal", playerName, teamSide, stat.goals ?? 0);
    pushCountedIncidents(rows, "assist", playerName, teamSide, stat.goal_assist ?? 0);
    pushCountedIncidents(rows, "yellow_card", playerName, teamSide, stat.yellow_card ?? 0);
    pushCountedIncidents(rows, "red_card", playerName, teamSide, stat.red_card ?? 0);
  }

  return rows;
}

function countByKind(rows: MatchPlayerIncident[], kind: MatchPlayerIncident["kind"]): number {
  return rows.filter((row) => row.kind === kind).length;
}

export function mergePlayerIncidents(
  fromIncidents: MatchPlayerIncident[],
  fromPlayerStats: MatchPlayerIncident[],
): MatchPlayerIncident[] {
  const merged = [...fromIncidents];

  if (countByKind(fromIncidents, "goal") === 0) {
    merged.push(...fromPlayerStats.filter((row) => row.kind === "goal"));
  }
  if (countByKind(fromIncidents, "assist") === 0) {
    merged.push(...fromPlayerStats.filter((row) => row.kind === "assist"));
  }
  if (countByKind(fromIncidents, "yellow_card") === 0) {
    merged.push(...fromPlayerStats.filter((row) => row.kind === "yellow_card"));
  }
  if (countByKind(fromIncidents, "red_card") === 0) {
    merged.push(...fromPlayerStats.filter((row) => row.kind === "red_card"));
  }

  return merged;
}
