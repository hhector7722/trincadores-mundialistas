import { teamExternalKey } from "@/lib/openfootball/slug";
import type {
  OpenFootballHostCityRef,
  OpenFootballMatchRef,
  OpenFootballTeamRef,
  Wc2026GameRow,
  Wc2026TeamRow,
} from "@/lib/worldcup-data/types";

export type MatchMappingResult = {
  game: Wc2026GameRow;
  matchId: string | null;
  status: "mapped" | "pending";
  reason?: string;
};

function kickoffDatePart(iso: string | null): string | null {
  if (!iso) return null;
  const m = iso.match(/^(\d{4}-\d{2}-\d{2})/);
  return m?.[1] ?? null;
}

function normalizeTeamName(name: string): string {
  return name.trim().toLowerCase();
}

/** Mapa fifa_code / nombre worldcup2026 → teams OpenFootball */
export function buildTeamLookup(
  wc26Teams: Wc2026TeamRow[],
  ofTeams: OpenFootballTeamRef[]
): Map<string, OpenFootballTeamRef> {
  const byKey = new Map(ofTeams.map((t) => [t.external_key, t]));
  const byName = new Map(ofTeams.map((t) => [normalizeTeamName(t.name), t]));
  const byFifa = new Map(
    ofTeams
      .filter((t) => t.fifa_name)
      .map((t) => [normalizeTeamName(t.fifa_name!), t])
  );

  const lookup = new Map<string, OpenFootballTeamRef>();

  for (const t of wc26Teams) {
    if (!t.fifaCode) continue;
    const slug = teamExternalKey(t.nameEn);
    const hit = byKey.get(slug) ?? byName.get(normalizeTeamName(t.nameEn)) ?? byFifa.get(normalizeTeamName(t.nameEn));
    if (hit) lookup.set(t.sourceId, hit);
  }

  return lookup;
}

export function mapGamesToOpenFootball(
  games: Wc2026GameRow[],
  wc26Teams: Wc2026TeamRow[],
  ofMatches: OpenFootballMatchRef[],
  teamLookup: Map<string, OpenFootballTeamRef>
): MatchMappingResult[] {
  const teamById = new Map(wc26Teams.map((t) => [t.sourceId, t]));

  return games.map((game) => {
    const homeOf = teamLookup.get(game.homeTeamSourceId);
    const awayOf = teamLookup.get(game.awayTeamSourceId);
    const homeName = homeOf?.name ?? teamById.get(game.homeTeamSourceId)?.nameEn;
    const awayName = awayOf?.name ?? teamById.get(game.awayTeamSourceId)?.nameEn;

    if (!homeName || !awayName) {
      return {
        game,
        matchId: null,
        status: "pending",
        reason: "equipo sin mapear (TBD o sin match OpenFootball)",
      };
    }

    const gameDate = kickoffDatePart(game.kickoffIso);
    const candidates = ofMatches.filter((m) => {
      const mDate = kickoffDatePart(m.kickoff_at);
      if (gameDate && mDate && gameDate !== mDate) return false;

      const homeMatch =
        normalizeTeamName(m.home_team) === normalizeTeamName(homeName) ||
        (homeOf && m.home_team.toLowerCase().includes(homeOf.name.toLowerCase().split(" ")[0]));
      const awayMatch =
        normalizeTeamName(m.away_team) === normalizeTeamName(awayName) ||
        (awayOf && m.away_team.toLowerCase().includes(awayOf.name.toLowerCase().split(" ")[0]));

      if (!homeMatch || !awayMatch) return false;

      if (game.groupCode && m.group_code) {
        return game.groupCode.toUpperCase() === m.group_code.toUpperCase();
      }
      return true;
    });

    if (candidates.length === 1) {
      return { game, matchId: candidates[0].id, status: "mapped" };
    }

    if (candidates.length > 1) {
      return {
        game,
        matchId: null,
        status: "pending",
        reason: `ambiguo: ${candidates.length} candidatos`,
      };
    }

    return {
      game,
      matchId: null,
      status: "pending",
      reason: "sin candidato OpenFootball",
    };
  });
}

export function mapStadiumsToHostCities(
  wc26Stadiums: Array<{ sourceId: string; fifaName: string | null; cityEn: string | null }>,
  hostCities: OpenFootballHostCityRef[]
): Array<{ sourceId: string; hostCityId: string | null }> {
  const byCity = new Map(hostCities.map((c) => [normalizeTeamName(c.city), c]));
  const byStadium = new Map(hostCities.map((c) => [normalizeTeamName(c.stadium_name), c]));

  return wc26Stadiums.map((s) => {
    const hit =
      (s.fifaName && byStadium.get(normalizeTeamName(s.fifaName))) ||
      (s.cityEn && byCity.get(normalizeTeamName(s.cityEn.split("(")[0].trim()))) ||
      null;
    return { sourceId: s.sourceId, hostCityId: hit?.id ?? null };
  });
}
