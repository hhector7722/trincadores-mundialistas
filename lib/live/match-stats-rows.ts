import type { MatchLiveStats } from "@/lib/live/types";

export type MatchStatRow = {
  label: string;
  home: string;
  away: string;
};

function formatPair(home: number | null, away: number | null, suffix = ""): MatchStatRow | null {
  if (home == null && away == null) return null;
  return {
    label: "",
    home: home == null ? " " : `${home}${suffix}`,
    away: away == null ? " " : `${away}${suffix}`,
  };
}

export function buildMatchStatRows(stats: MatchLiveStats): MatchStatRow[] {
  const rows: MatchStatRow[] = [];

  const possession = formatPair(stats.possessionHome, stats.possessionAway, "%");
  if (possession) rows.push({ ...possession, label: "Posesión" });

  const shots = formatPair(stats.shotsHome, stats.shotsAway);
  if (shots) rows.push({ ...shots, label: "Disparos" });

  const onTarget = formatPair(stats.shotsOnTargetHome, stats.shotsOnTargetAway);
  if (onTarget) rows.push({ ...onTarget, label: "A puerta" });

  const xg = formatPair(
    stats.xgHome != null ? Number(stats.xgHome.toFixed(2)) : null,
    stats.xgAway != null ? Number(stats.xgAway.toFixed(2)) : null,
  );
  if (xg) rows.push({ ...xg, label: "xG" });

  const yellow = formatPair(stats.yellowCardsHome, stats.yellowCardsAway);
  if (yellow) rows.push({ ...yellow, label: "Amarillas" });

  const red = formatPair(stats.redCardsHome, stats.redCardsAway);
  if (red) rows.push({ ...red, label: "Rojas" });

  return rows;
}
