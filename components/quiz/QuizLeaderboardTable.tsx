import type { QuizLeaderboardRow } from "@/lib/quiz/types";
import { cn } from "@/lib/utils";

type QuizLeaderboardTableProps = {
  rows: QuizLeaderboardRow[];
  currentProfileId: string;
};

export function QuizLeaderboardTable({
  rows,
  currentProfileId,
}: QuizLeaderboardTableProps) {
  if (!rows.length) {
    return (
      <p className="py-8 text-center text-sm text-[var(--tm-muted)]">
        Aun no hay puntuacion competitiva en el quiz.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-[var(--tm-border)]">
      {rows.map((row, index) => {
        const isSelf = row.profileId === currentProfileId;
        return (
          <li
            key={row.profileId}
            className={cn(
              "flex min-h-12 items-center gap-3 px-4 py-3",
              isSelf && "bg-[var(--tm-highlight)]"
            )}
          >
            <span className="w-7 text-center font-display text-sm text-[var(--tm-fg)]">
              {index + 1}
            </span>
            <span
              className={cn(
                "min-w-0 flex-1 truncate text-sm font-medium",
                isSelf ? "text-[var(--tm-accent)]" : "text-[var(--tm-fg)]"
              )}
            >
              {row.label}
            </span>
            <span className="font-display text-sm text-[var(--tm-accent)]">
              {row.totalScore}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
