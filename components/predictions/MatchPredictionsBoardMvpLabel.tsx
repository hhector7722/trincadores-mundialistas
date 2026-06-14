import { goalScorerDisplayName } from "@/lib/live/goal-scorers";
import { cn } from "@/lib/utils";

type MatchPredictionsBoardMvpLabelProps = {
  playerName: string | null | undefined;
  emptyValue?: string;
  className?: string;
};

/** Celda MVP del tablero: solo nombre del jugador, sin sufijo ni color destacado. */
export function MatchPredictionsBoardMvpLabel({
  playerName,
  emptyValue = "—",
  className,
}: MatchPredictionsBoardMvpLabelProps) {
  const trimmed = playerName?.trim();
  if (!trimmed) {
    return (
      <span
        className={cn(
          "flex h-full w-full items-center justify-center whitespace-nowrap text-center text-[10px] leading-none text-[var(--tm-fg)]",
          className,
        )}
      >
        {emptyValue}
      </span>
    );
  }

  return (
    <span
      className={cn(
        "flex h-full w-full items-center justify-center whitespace-nowrap text-center text-[10px] leading-none text-[var(--tm-fg)]",
        className,
      )}
    >
      {goalScorerDisplayName(trimmed)}
    </span>
  );
}
