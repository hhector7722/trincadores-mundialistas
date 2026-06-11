import { MatchStatsTable } from "@/components/live/MatchStatsTable";
import type { MatchLiveStats } from "@/lib/live/types";
import { cn } from "@/lib/utils";

type MatchLiveStatsPanelProps = {
  stats: MatchLiveStats | null;
  className?: string;
};

export function MatchLiveStatsPanel({ stats, className }: MatchLiveStatsPanelProps) {
  if (!stats) return null;

  return <MatchStatsTable stats={stats} title="Estadísticas en directo" className={className} />;
}
