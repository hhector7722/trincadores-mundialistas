import { PositionTrendIndicator } from "@/components/ranking/PositionTrendIndicator";
import { RankingMemberCells } from "@/components/ranking/RankingMemberCells";
import { RANKING_GRID } from "@/components/ranking/ranking-grid";
import { formatQuizScore } from "@/lib/quiz/format";
import { formatAggregateStat } from "@/lib/ranking/format";
import { formatReliabilityPct } from "@/lib/ranking/reliability";
import type { LeaderboardRow } from "@/lib/ranking/queries";
import { cn } from "@/lib/utils";

export function RankingRow({
  row,
  isCurrentUser,
}: {
  row: LeaderboardRow;
  isCurrentUser: boolean;
}) {
  return (
    <div
      className={cn(
        RANKING_GRID,
        "tm-ranking-row w-full border-b border-[var(--tm-border)] px-3 text-left last:border-0"
      )}
    >
      <PositionTrendIndicator trend={row.positionTrend} />
      <span className="font-display shrink-0 text-xs tabular-nums text-[var(--tm-fg)]">
        {formatAggregateStat(row.position)}
      </span>
      <RankingMemberCells
        avatarUrl={row.avatarUrl}
        label={row.label}
        size="ranking"
        nameClassName={cn(
          "text-xs font-medium",
          isCurrentUser ? "text-[var(--tm-accent)]" : "text-[var(--tm-fg)]"
        )}
      />
      <span className="font-display w-full shrink-0 text-center text-xs tabular-nums text-[var(--tm-fg)]">
        {formatAggregateStat(row.cumulativePoints)}
      </span>
      <span className="w-full shrink-0 text-center text-[10px] tabular-nums text-[var(--tm-muted)]">
        {formatReliabilityPct(row.reliabilityPct)}
      </span>
      <span className="font-display w-full shrink-0 text-center text-xs tabular-nums text-[var(--tm-fg)]">
        {formatQuizScore(row.quizPoints, row.hasQuizParticipated)}
      </span>
    </div>
  );
}
