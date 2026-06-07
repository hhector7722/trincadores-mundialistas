import { parseCsvContent, readBool, readInt, readOptionalText } from "@/lib/fjelstul-worldcup/parse-csv";
import type { Wc2026GameRow, Wc2026StadiumRow, Wc2026TeamRow } from "@/lib/worldcup-data/types";

export function parseWc2026TeamsCsv(csv: string): Wc2026TeamRow[] {
  return parseCsvContent(csv)
    .map((r) => {
      const sourceId = r.id?.trim();
      const nameEn = r.name_en?.trim();
      if (!sourceId || !nameEn) return null;
      const fifaCode = readOptionalText(r.fifa_code);
      return {
        sourceId,
        nameEn,
        fifaCode: fifaCode === "TBD" ? null : fifaCode,
        iso2: readOptionalText(r.iso2),
        groupCode: readOptionalText(r.groups),
      };
    })
    .filter((r): r is Wc2026TeamRow => r !== null);
}

export function parseWc2026StadiaCsv(csv: string): Wc2026StadiumRow[] {
  return parseCsvContent(csv)
    .map((r) => {
      const sourceId = r.id?.trim();
      const nameEn = r.name_en?.trim();
      if (!sourceId || !nameEn) return null;
      return {
        sourceId,
        nameEn,
        fifaName: readOptionalText(r.fifa_name),
        cityEn: readOptionalText(r.city_en),
        countryEn: readOptionalText(r.country_en),
        capacity: readInt(r.capacity ?? ""),
      };
    })
    .filter((r): r is Wc2026StadiumRow => r !== null);
}

export function parseWc2026GamesCsv(csv: string): Wc2026GameRow[] {
  return parseCsvContent(csv)
    .map((r) => {
      const sourceId = r.id?.trim();
      const homeTeamSourceId = r.home_team_id?.trim();
      const awayTeamSourceId = r.away_team_id?.trim();
      if (!sourceId || !homeTeamSourceId || !awayTeamSourceId) return null;

      const kickoffRaw = readOptionalText(r.date) ?? readOptionalText(r.createdAt);
      return {
        sourceId,
        homeTeamSourceId,
        awayTeamSourceId,
        homeScore: readInt(r.home_score ?? "0") ?? 0,
        awayScore: readInt(r.away_score ?? "0") ?? 0,
        groupCode: readOptionalText(r.group),
        matchday: readInt(r.matchday ?? ""),
        kickoffIso: kickoffRaw,
        stadiumSourceId: readOptionalText(r.stadium_id),
        finished: (r.finished ?? "").trim().toUpperCase() === "TRUE",
        timeElapsed: r.time_elapsed?.trim() || "notstarted",
        type: r.type?.trim() || "group",
      };
    })
    .filter((r): r is Wc2026GameRow => r !== null);
}

export function parseWc2026GroupsCsv(csv: string): Array<{ groupCode: string; teamSourceIds: string[] }> {
  return parseCsvContent(csv)
    .map((r) => {
      const groupCode = r.name?.trim();
      if (!groupCode) return null;
      const teamSourceIds = [0, 1, 2, 3]
        .map((i) => r[`teams[${i}].team_id`]?.trim())
        .filter((id): id is string => Boolean(id));
      return { groupCode, teamSourceIds };
    })
    .filter((g): g is { groupCode: string; teamSourceIds: string[] } => g !== null);
}

export function wc2026ExternalKey(entity: "team" | "stadium" | "group" | "game", id: string): string {
  return `worldcup2026:${entity}:${id}`;
}
