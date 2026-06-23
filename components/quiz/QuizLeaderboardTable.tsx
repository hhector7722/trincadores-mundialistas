import { QuizLeaderboardRow } from "@/components/quiz/QuizLeaderboardRow";
import { QUIZ_RANKING_GRID } from "@/components/quiz/quiz-ranking-grid";
import type { QuizLeaderboardRow as QuizLeaderboardRowType } from "@/lib/quiz/types";
import { cn } from "@/lib/utils";

const EMPTY_ROW_COUNT = 11;

function QuizLeaderboardHeader() {
  return (
    <div
      className={cn(
        QUIZ_RANKING_GRID,
        "shrink-0 border-b border-[var(--tm-border)] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--tm-muted)]"
      )}
    >
      <span aria-hidden="true" />
      <span className="text-left">Pos</span>
      <span className="text-left">Trincador</span>
      <span />
      <span className="text-center">Quiz</span>
      <span className="text-center">Fiab</span>
    </div>
  );
}

function QuizLeaderboardEmptyRow() {
  return (
    <div
      className={cn(
        QUIZ_RANKING_GRID,
        "tm-ranking-row w-full border-b border-[var(--tm-border)] px-3 last:border-0"
      )}
      aria-hidden="true"
    >
      <span />
      <span />
      <div className="flex min-w-0 items-center gap-2.5">
        <span className="size-9 shrink-0 rounded-full bg-[var(--tm-border)]/35" />
        <span className="min-w-0 flex-1 truncate">&nbsp;</span>
      </div>
      <span />
      <span />
      <span />
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
    <div className="tm-ranking-table">
      <QuizLeaderboardHeader />
      <div className="tm-ranking-body">
        {rows.length === 0
          ? Array.from({ length: EMPTY_ROW_COUNT }, (_, index) => (
              <QuizLeaderboardEmptyRow key={`empty-${index}`} />
            ))
          : rows.map((row) => (
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
