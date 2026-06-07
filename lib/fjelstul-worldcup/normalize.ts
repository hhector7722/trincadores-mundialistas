import { parseCsvContent, readBool, readInt, readOptionalText } from "./parse-csv";
import type {
  TeamSquadPlayerRow,
  TeamSquadRow,
  WcHistoricAwardWinnerRow,
  WcHistoricGender,
  WcHistoricGoalRow,
  WcHistoricMatchRow,
  WcHistoricStandingRow,
  WcHistoricStadiumRow,
  WcHistoricTeamRow,
  WcHistoricTournamentRow,
} from "@/lib/worldcup-data/types";
import { FJELSTUL_SOURCE } from "@/lib/worldcup-data/types";

/** IDs Fjelstul de Mundiales femeninos — excluidos deliberadamente en esta fase. */
export const WOMENS_WC_TOURNAMENT_IDS = [
  "WC-1991",
  "WC-1995",
  "WC-1999",
  "WC-2003",
  "WC-2007",
  "WC-2011",
  "WC-2015",
  "WC-2019",
] as const;

const WOMENS_TOURNAMENT_ID_SET = new Set<string>(WOMENS_WC_TOURNAMENT_IDS);

/** Detecta torneo femenino por ID canónico o nombre (sin campo gender en CSV). */
export function isWomenTournament(tournamentId: string, tournamentName?: string): boolean {
  if (WOMENS_TOURNAMENT_ID_SET.has(tournamentId)) return true;
  const name = (tournamentName ?? "").toLowerCase();
  return name.includes("women") || name.includes("femenin");
}

/** Solo Mundiales masculinos — criterio intencional del pipeline histórico/quiz. */
export function isMenTournament(
  tournamentId: string,
  opts?: { name?: string; gender?: WcHistoricGender }
): boolean {
  if (opts?.gender) return opts.gender === "men";
  return !isWomenTournament(tournamentId, opts?.name);
}

export function inferGender(tournamentId: string, tournamentName: string): WcHistoricGender {
  return isWomenTournament(tournamentId, tournamentName) ? "women" : "men";
}

export function onlyMenTournaments(rows: WcHistoricTournamentRow[]): WcHistoricTournamentRow[] {
  return rows.filter((t) => isMenTournament(t.external_id, { name: t.name, gender: t.gender }));
}

export function menTournamentExternalIds(tournaments: WcHistoricTournamentRow[]): Set<string> {
  return new Set(onlyMenTournaments(tournaments).map((t) => t.external_id));
}

export function filterByMenTournaments<T extends { tournament_external_id: string }>(
  rows: T[],
  menIds: Set<string>
): T[] {
  return rows.filter((r) => menIds.has(r.tournament_external_id));
}

export function playerDisplayName(family: string, given: string): string {
  const f = readOptionalText(family);
  const g = readOptionalText(given);
  if (!g && f) return f;
  if (f && g) return `${g} ${f}`.trim();
  return f ?? g ?? "Unknown";
}

export function normalizeTournaments(csv: string): WcHistoricTournamentRow[] {
  return parseCsvContent(csv)
    .map((r) => {
      const external_id = r.tournament_id?.trim();
      const year = readInt(r.year ?? "");
      const name = r.tournament_name?.trim();
      if (!external_id || !year || !name) return null;
      return {
        external_id,
        year,
        name,
        host_country: readOptionalText(r.host_country),
        winner: readOptionalText(r.winner),
        start_date: readOptionalText(r.start_date),
        end_date: readOptionalText(r.end_date),
        gender: inferGender(external_id, name),
      };
    })
    .filter((r): r is WcHistoricTournamentRow => r !== null);
}

export function normalizeTeams(csv: string): WcHistoricTeamRow[] {
  return parseCsvContent(csv)
    .map((r) => {
      const external_id = r.team_id?.trim();
      const name = r.team_name?.trim();
      if (!external_id || !name) return null;
      return {
        external_id,
        name,
        code: readOptionalText(r.team_code),
        confederation: readOptionalText(r.confederation_name),
      };
    })
    .filter((r): r is WcHistoricTeamRow => r !== null);
}

export function normalizeStadiums(csv: string): WcHistoricStadiumRow[] {
  return parseCsvContent(csv)
    .map((r) => {
      const external_id = r.stadium_id?.trim();
      const name = r.stadium_name?.trim();
      if (!external_id || !name) return null;
      return {
        external_id,
        name,
        city: readOptionalText(r.city_name),
        country: readOptionalText(r.country_name),
        capacity: readInt(r.capacity ?? ""),
      };
    })
    .filter((r): r is WcHistoricStadiumRow => r !== null);
}

export function normalizeMatches(csv: string): WcHistoricMatchRow[] {
  return parseCsvContent(csv)
    .map((r) => {
      const external_id = r.match_id?.trim();
      const tournament_external_id = r.tournament_id?.trim();
      if (!external_id || !tournament_external_id) return null;
      return {
        external_id,
        tournament_external_id,
        home_team_external_id: readOptionalText(r.home_team_id),
        away_team_external_id: readOptionalText(r.away_team_id),
        stadium_external_id: readOptionalText(r.stadium_id),
        match_date: readOptionalText(r.match_date),
        match_time: readOptionalText(r.match_time),
        stage_name: readOptionalText(r.stage_name),
        group_name: readOptionalText(r.group_name),
        home_score: readInt(r.home_team_score ?? ""),
        away_score: readInt(r.away_team_score ?? ""),
        extra_time: readBool(r.extra_time ?? "0"),
        penalty_shootout: readBool(r.penalty_shootout ?? "0"),
      };
    })
    .filter((r): r is WcHistoricMatchRow => r !== null);
}

export function normalizeGoals(csv: string): WcHistoricGoalRow[] {
  return parseCsvContent(csv)
    .map((r) => {
      const external_id = r.goal_id?.trim();
      const match_external_id = r.match_id?.trim();
      const tournament_external_id = r.tournament_id?.trim();
      if (!external_id || !match_external_id || !tournament_external_id) return null;
      const player_name = playerDisplayName(r.family_name ?? "", r.given_name ?? "");
      return {
        external_id,
        match_external_id,
        tournament_external_id,
        team_external_id: readOptionalText(r.player_team_id ?? r.team_id),
        player_name,
        minute_label: readOptionalText(r.minute_label),
        own_goal: readBool(r.own_goal ?? "0"),
        penalty: readBool(r.penalty ?? "0"),
      };
    })
    .filter((r): r is WcHistoricGoalRow => r !== null);
}

export function normalizeAwardWinners(csv: string): WcHistoricAwardWinnerRow[] {
  return parseCsvContent(csv)
    .map((r) => {
      const tournament_external_id = r.tournament_id?.trim();
      const award_id = r.award_id?.trim();
      const player_id = r.player_id?.trim();
      if (!tournament_external_id || !award_id || !player_id) return null;
      const player_name = playerDisplayName(r.family_name ?? "", r.given_name ?? "");
      return {
        external_key: `${tournament_external_id}:${award_id}:${player_id}`,
        tournament_external_id,
        award_name: r.award_name?.trim() ?? "Award",
        player_name,
        team_name: readOptionalText(r.team_name),
        shared: readBool(r.shared ?? "0"),
      };
    })
    .filter((r): r is WcHistoricAwardWinnerRow => r !== null);
}

export function normalizeStandings(csv: string): WcHistoricStandingRow[] {
  return parseCsvContent(csv)
    .map((r) => {
      const tournament_external_id = r.tournament_id?.trim();
      const position = readInt(r.position ?? "");
      const team_name = r.team_name?.trim();
      if (!tournament_external_id || !position || !team_name) return null;
      return {
        external_key: `${tournament_external_id}:${position}`,
        tournament_external_id,
        team_name,
        position,
      };
    })
    .filter((r): r is WcHistoricStandingRow => r !== null);
}

/** squads.csv: plantilla histórica por torneo+equipo */
export function normalizeSquads(csv: string): {
  squads: TeamSquadRow[];
  players: TeamSquadPlayerRow[];
} {
  const squadsByKey = new Map<string, TeamSquadRow>();
  const players: TeamSquadPlayerRow[] = [];

  for (const r of parseCsvContent(csv)) {
    const tournamentId = r.tournament_id?.trim();
    const teamId = r.team_id?.trim();
    const teamName = r.team_name?.trim();
    const playerId = r.player_id?.trim();
    if (!tournamentId || !teamId || !teamName || !playerId) continue;

    const squadKey = `${tournamentId}:${teamId}`;
    if (!squadsByKey.has(squadKey)) {
      const yearMatch = tournamentId.match(/WC-(\d{4})/);
      const year = readInt(r.year ?? "") ?? (yearMatch ? Number(yearMatch[1]) : null);
      squadsByKey.set(squadKey, {
        source_code: FJELSTUL_SOURCE,
        external_key: squadKey,
        team_name: teamName,
        team_code: readOptionalText(r.team_code),
        year,
        tournament_external_id: tournamentId,
        competition_code: null,
        label: `${teamName} — ${r.tournament_name?.trim() ?? tournamentId}`,
      });
    }

    const playerName = playerDisplayName(r.family_name ?? "", r.given_name ?? "");
    players.push({
      squad_external_key: squadKey,
      external_player_key: playerId,
      player_name: playerName,
      position: readOptionalText(r.position_name ?? r.position),
      shirt_number: readInt(r.shirt_number ?? ""),
      club: null,
      status: "called_up",
      metadata: { tournament_id: tournamentId, team_id: teamId },
    });
  }

  return { squads: [...squadsByKey.values()], players };
}

export type NormalizeStats = { table: string; total: number; skipped: number };

export function assertErrorRate(
  stats: NormalizeStats[],
  maxRate = 0.05
): void {
  for (const s of stats) {
    if (s.total === 0) continue;
    const rate = s.skipped / s.total;
    if (rate > maxRate) {
      throw new Error(
        `${s.table}: ${s.skipped}/${s.total} filas omitidas (${(rate * 100).toFixed(1)}% > ${maxRate * 100}%)`
      );
    }
  }
}
