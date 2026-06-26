import { PositionTrendIndicator } from "@/components/ranking/PositionTrendIndicator";
import { RankingMemberCells } from "@/components/ranking/RankingMemberCells";
import { QUIZ_RANKING_GRID } from "@/components/quiz/quiz-ranking-grid";
import { formatQuizReliabilityPct, formatQuizScore } from "@/lib/quiz/format";
import { formatAggregateStat } from "@/lib/ranking/format";
import type { QuizLeaderboardRow } from "@/lib/quiz/types";
import { cn } from "@/lib/utils";

export function QuizLeaderboardRow({
  row,
  isCurrentUser,
}: {
  row: QuizLeaderboardRow;
  isCurrentUser: boolean;
}) {
  const bonusText =
    row.position === 1
      ? "+5 pts"
      : row.position === 2
      ? "+3 pts"
      : row.position === 3
      ? "+2 pts"
      : row.position === 4
      ? "+1 pts"
      : "";

  return (
    <div
      className={cn(
        QUIZ_RANKING_GRID,
        "tm-ranking-row w-full px-3 text-left last:border-0",
        row.position === 4 ? "border-b-[3px] border-white" : "border-b border-[var(--tm-border)]",
        row.position > 4 ? "opacity-80" : ""
      )}
    >
      <PositionTrendIndicator trend={null} />
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
      <span className="font-display w-full shrink-0 text-right text-[10px] whitespace-nowrap tabular-nums text-[#34C759]">
        {bonusText}
      </span>
      <span className="font-display w-full shrink-0 text-center text-xs tabular-nums text-[var(--tm-fg)]">
        {formatQuizScore(row.totalScore, row.hasParticipated)}
      </span>
      <span className="w-full shrink-0 text-center text-[10px] tabular-nums text-[var(--tm-muted)]">
        {formatQuizReliabilityPct(row.reliabilityPct, row.hasParticipated)}
      </span>
    </div>
  );
}
