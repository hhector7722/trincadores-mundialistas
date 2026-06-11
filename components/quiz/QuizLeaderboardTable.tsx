import { QuizLeaderboardRow } from "@/components/quiz/QuizLeaderboardRow";
import { QUIZ_RANKING_GRID } from "@/components/quiz/quiz-ranking-grid";
import type { QuizLeaderboardRow as QuizLeaderboardRowType } from "@/lib/quiz/types";
import { cn } from "@/lib/utils";

function QuizLeaderboardHeader() {
  return (
    <div
      className={cn(
        QUIZ_RANKING_GRID,
        "shrink-0 border-b border-[var(--tm-border)] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--tm-muted)]"
      )}
    >
      <span>Pos</span>
      <span className="text-center">Trincador</span>
      <span className="text-right">Quiz</span>
      <span className="text-right">Fiab</span>
    </div>
  );
}

type QuizLeaderboardTableProps = {
  rows: QuizLeaderboardRowType[];
  currentProfileId: string;
};

export function QuizLeaderboardTable({
  rows,
  currentProfileId,
}: QuizLeaderboardTableProps) {
  return (
    <div className="tm-quiz-leaderboard-table">
      <QuizLeaderboardHeader />
      <div className="tm-quiz-leaderboard-body">
        {rows.map((row) => (
          <QuizLeaderboardRow
            key={row.profileId}
            row={row}
            isCurrentUser={row.profileId === currentProfileId}
          />
        ))}
      </div>
    </div>
  );
}
