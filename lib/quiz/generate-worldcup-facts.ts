import { isMenTournament } from "@/lib/fjelstul-worldcup/normalize";
import type { AdminClient } from "@/lib/scripts/supabase-admin";
import {
  FJELSTUL_SOURCE_LABEL,
  FJELSTUL_SOURCE_URL,
  type QuizFactWorldcupRow,
} from "@/lib/worldcup-data/types";

const COUNTRY_ES: Record<string, string> = {
  Uruguay: "Uruguay",
  Argentina: "Argentina",
  Brazil: "Brasil",
  Germany: "Alemania",
  Italy: "Italia",
  France: "Francia",
  Spain: "España",
  England: "Inglaterra",
  Mexico: "México",
  "United States": "Estados Unidos",
  Netherlands: "Países Bajos",
  Croatia: "Croacia",
};

const FACT_ORIGIN = "fjelstul_historic";

function esCountry(name: string): string {
  return COUNTRY_ES[name] ?? name;
}

function poolFrom<T>(items: T[], pick: (t: T) => string, exclude: Set<string>, n = 6): string[] {
  const out: string[] = [];
  for (const item of items) {
    const label = pick(item);
    if (!label || exclude.has(label)) continue;
    if (!out.includes(label)) out.push(label);
    if (out.length >= n) break;
  }
  return out;
}

function withOrigin(metadata: Record<string, unknown>): Record<string, unknown> {
  return { ...metadata, fact_origin: FACT_ORIGIN };
}

/** Genera facts masculinos desde wc_historic_* (solo torneos masculinos). */
export async function buildWorldcupFactsFromHistoric(
  admin: AdminClient
): Promise<QuizFactWorldcupRow[]> {
  const facts: QuizFactWorldcupRow[] = [];

  const { data: tournaments, error: tErr } = await admin
    .from("wc_historic_tournaments")
    .select("external_id, year, name, host_country, winner, gender")
    .order("year", { ascending: true });
  if (tErr) throw tErr;

  const men = (tournaments ?? []).filter((t) =>
    isMenTournament(t.external_id, { name: t.name, gender: t.gender })
  );
  const menIds = new Set(men.map((t) => t.external_id));
  const winners = men.filter((t) => t.winner);
  const hosts = men.filter((t) => t.host_country);

  for (const t of men) {
    if (!t.winner) continue;
    const value = esCountry(t.winner);
    facts.push({
      id: `fj-wc${t.year}-winner`,
      category: "history",
      fact_type: "first_winner",
      subject: `Mundial ${t.year}`,
      value,
      year: t.year,
      difficulty: t.year < 1980 ? "hard" : "easy",
      option_semantic_type: "country",
      distractor_pool: poolFrom(
        winners.filter((w) => w.year !== t.year && w.winner),
        (w) => esCountry(w.winner!),
        new Set([value])
      ),
      metadata: withOrigin({ tournament_id: t.external_id }),
      source_url: FJELSTUL_SOURCE_URL,
      source_label: FJELSTUL_SOURCE_LABEL,
      enabled: true,
    });
  }

  for (const t of hosts) {
    if (!t.host_country || !t.year) continue;
    const value = esCountry(t.host_country);
    facts.push({
      id: `fj-wc${t.year}-host`,
      category: "hosts",
      fact_type: "host_country",
      subject: `Mundial ${t.year}`,
      value,
      year: t.year,
      difficulty: "medium",
      option_semantic_type: "country",
      distractor_pool: poolFrom(
        hosts.filter((h) => h.year !== t.year && h.host_country),
        (h) => esCountry(h.host_country!),
        new Set([value])
      ),
      metadata: withOrigin({ tournament_id: t.external_id }),
      source_url: FJELSTUL_SOURCE_URL,
      source_label: FJELSTUL_SOURCE_LABEL,
      enabled: true,
    });
  }

  const { data: goldenBoots, error: aErr } = await admin
    .from("wc_historic_award_winners")
    .select("tournament_external_id, award_name, player_name, team_name")
    .eq("award_name", "Golden Boot")
    .eq("shared", false);
  if (aErr) throw aErr;

  const menGoldenBoots = (goldenBoots ?? []).filter((a) => menIds.has(a.tournament_external_id));

  const bootByTournament = new Map<string, string>();
  for (const a of menGoldenBoots) {
    if (!bootByTournament.has(a.tournament_external_id)) {
      bootByTournament.set(a.tournament_external_id, a.player_name);
    }
  }

  const allBootPlayers = [...new Set(menGoldenBoots.map((a) => a.player_name))];

  for (const t of men) {
    const player = bootByTournament.get(t.external_id);
    if (!player) continue;
    facts.push({
      id: `fj-wc${t.year}-golden-boot`,
      category: "players",
      fact_type: "top_scorer",
      subject: `Máximo goleador del Mundial ${t.year}`,
      value: player,
      year: t.year,
      difficulty: "hard",
      option_semantic_type: "player",
      distractor_pool: allBootPlayers.filter((p) => p !== player).slice(0, 6),
      metadata: withOrigin({ tournament_id: t.external_id, award: "Golden Boot" }),
      source_url: FJELSTUL_SOURCE_URL,
      source_label: FJELSTUL_SOURCE_LABEL,
      enabled: true,
    });
  }

  const titleCounts = new Map<string, number>();
  for (const t of men) {
    if (!t.winner) continue;
    titleCounts.set(t.winner, (titleCounts.get(t.winner) ?? 0) + 1);
  }

  for (const [team, count] of titleCounts) {
    if (count < 2) continue;
    const subject = esCountry(team);
    facts.push({
      id: `fj-titles-${team.toLowerCase().replace(/\s+/g, "-")}`,
      category: "teams",
      fact_type: "titles_count",
      subject,
      value: String(count),
      year: null,
      difficulty: "medium",
      option_semantic_type: "title_count",
      distractor_pool: [...titleCounts.entries()]
        .filter(([name]) => name !== team)
        .map(([, c]) => String(c))
        .slice(0, 6),
      metadata: withOrigin({ team }),
      source_url: FJELSTUL_SOURCE_URL,
      source_label: FJELSTUL_SOURCE_LABEL,
      enabled: true,
    });
  }

  const { data: finals, error: fErr } = await admin
    .from("wc_historic_matches")
    .select("external_id, tournament_external_id, home_score, away_score, stage_name, match_date")
    .ilike("stage_name", "%final%")
    .not("home_score", "is", null)
    .not("away_score", "is", null);
  if (fErr) throw fErr;

  const finalRows = (finals ?? []).filter((m) => {
    if (!menIds.has(m.tournament_external_id)) return false;
    const s = (m.stage_name ?? "").toLowerCase();
    return s.includes("final") && !s.includes("third");
  });

  if (finalRows.length) {
    const top = [...finalRows].sort(
      (a, b) => b.home_score! + b.away_score! - (a.home_score! + a.away_score!)
    )[0];
    const total = top.home_score! + top.away_score!;
    facts.push({
      id: "fj-record-highest-scoring-final",
      category: "records",
      fact_type: "record_value",
      subject: "Goles en una final de Mundial",
      value: `${total} goles`,
      year: top.match_date ? Number(top.match_date.slice(0, 4)) : null,
      difficulty: "hard",
      option_semantic_type: "record_stat",
      distractor_pool: ["2 goles", "3 goles", "5 goles", "6 goles", "8 goles"],
      metadata: withOrigin({ match_id: top.external_id }),
      source_url: FJELSTUL_SOURCE_URL,
      source_label: FJELSTUL_SOURCE_LABEL,
      enabled: true,
    });
  }

  return facts;
}
