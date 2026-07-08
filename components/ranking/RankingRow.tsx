import { PositionTrendIndicator } from "@/components/ranking/PositionTrendIndicator";
import { RankingMemberCells } from "@/components/ranking/RankingMemberCells";
import { RANKING_GRID } from "@/components/ranking/ranking-grid";
import { useQuizBonusActive } from "@/components/ranking/quiz-bonus-store";
import { formatAggregateStat, formatPoints } from "@/lib/ranking/format";
import { MATCH_SCORE_POINTS, MVP_PREDICTION_POINTS } from "@/lib/predictions/scoring";
import type { LeaderboardRow } from "@/lib/ranking/queries";
import { cn } from "@/lib/utils";

export function RankingRow({
  row,
  isCurrentUser,
}: {
  row: LeaderboardRow;
  isCurrentUser: boolean;
}) {
  const quizBonusActive = useQuizBonusActive();
  const groupSignHits = row.exactHits - row.koExactHits + row.signHits;
  const exactoHits = row.exactHits + row.koExactOnlyHits;

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
      <div className="flex items-center justify-center gap-0.5">
        {quizBonusActive && row.quizFinalBonus > 0 && (
          <span className="text-[10px] whitespace-nowrap tabular-nums text-[#34C759] leading-none">
            +{row.quizFinalBonus}
          </span>
        )}
        <span className="font-display text-xs tabular-nums text-[var(--tm-fg)]">
          {formatPoints(row.cumulativePoints)}
        </span>
      </div>
      <span className="w-full shrink-0 text-center text-[10px] tabular-nums text-[var(--tm-muted)]" title={`${groupSignHits} signos acertados en fase de grupos (${MATCH_SCORE_POINTS.sign} pts c/u)`}>
        {formatAggregateStat(groupSignHits)}
      </span>
      <span className="w-full shrink-0 text-center text-[10px] tabular-nums text-[var(--tm-muted)]" title={`${row.clasifHits} clasificados correctos en eliminatorias (${MATCH_SCORE_POINTS.sign} pts c/u)`}>
        {formatAggregateStat(row.clasifHits)}
      </span>
      <span className="w-full shrink-0 text-center text-[10px] tabular-nums text-[var(--tm-muted)]" title={`${exactoHits} marcadores exactos (${MATCH_SCORE_POINTS.exact} pts c/u)`}>
        {formatAggregateStat(exactoHits)}
      </span>
      <span className="w-full shrink-0 text-center text-[10px] tabular-nums text-[var(--tm-muted)]" title={`${row.mvpHits} MVP (${MVP_PREDICTION_POINTS} pt c/u)`}>
        {formatAggregateStat(row.mvpHits)}
      </span>
      <span />
    </div>
  );
}
