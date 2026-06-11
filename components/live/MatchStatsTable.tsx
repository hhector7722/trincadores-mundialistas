import { buildMatchStatRows } from "@/lib/live/match-stats-rows";
import type { MatchLiveStats } from "@/lib/live/types";
import { cn } from "@/lib/utils";

type MatchStatsTableProps = {
  stats: MatchLiveStats;
  title: string;
  className?: string;
};

export function MatchStatsTable({ stats, title, className }: MatchStatsTableProps) {
  const rows = buildMatchStatRows(stats);
  if (!rows.length) return null;

  return (
    <div className={cn("rounded-xl border border-[var(--tm-border)] bg-black/20 px-3 py-2.5", className)}>
      <p className="mb-2 text-center text-[9px] font-semibold uppercase tracking-[0.14em] text-white/55">
        {title}
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
