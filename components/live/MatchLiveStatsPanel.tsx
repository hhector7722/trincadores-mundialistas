import type { MatchLiveStats } from "@/lib/live/types";
import { cn } from "@/lib/utils";

type MatchLiveStatsPanelProps = {
  stats: MatchLiveStats | null;
  className?: string;
};

type StatRow = {
  label: string;
  home: string;
  away: string;
};

function formatPair(home: number | null, away: number | null, suffix = ""): StatRow | null {
  if (home == null && away == null) return null;
  return {
    label: "",
    home: home == null ? " " : `${home}${suffix}`,
    away: away == null ? " " : `${away}${suffix}`,
  };
}

function buildRows(stats: MatchLiveStats): StatRow[] {
  const rows: StatRow[] = [];

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

export function MatchLiveStatsPanel({ stats, className }: MatchLiveStatsPanelProps) {
  if (!stats) return null;

  const rows = buildRows(stats);
  if (!rows.length) return null;

  return (
    <div className={cn("rounded-xl border border-[var(--tm-border)] bg-black/20 px-3 py-2.5", className)}>
      <p className="mb-2 text-center text-[9px] font-semibold uppercase tracking-[0.14em] text-white/55">
        Estadísticas en directo
      </p>
      <div className="space-y-1.5">
        {rows.map((row) => (
          <div key={row.label} className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 text-[11px]">
            <span className="text-right font-display font-semibold tabular-nums text-white/90">
              {row.home}
            </span>
            <span className="text-center text-[9px] font-medium uppercase tracking-wide text-white/45">
              {row.label}
            </span>
            <span className="text-left font-display font-semibold tabular-nums text-white/90">
              {row.away}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
