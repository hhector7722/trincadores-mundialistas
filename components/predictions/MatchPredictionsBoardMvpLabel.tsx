import {
  findGroupedGoalScorerForPlayer,
  formatGroupedGoalScorerLabel,
  goalScorerDisplayName,
} from "@/lib/live/goal-scorers";
import type { MatchPlayerIncident } from "@/lib/live/types";
import { cn } from "@/lib/utils";

const HEADER_MVP_TEXT_CLASS =
  "max-w-full whitespace-nowrap font-sans text-[8px] leading-tight";

type MatchPredictionsBoardMvpLabelProps = {
  playerName: string | null | undefined;
  playerIncidents: MatchPlayerIncident[];
  variant?: "header" | "cell";
  align?: "left" | "right" | "center";
  emptyValue?: string;
  className?: string;
};

/** MVP en tablero: nombre amarillo; si no marcó, sufijo « MVP» en color normal. */
export function MatchPredictionsBoardMvpLabel({
  playerName,
  playerIncidents,
  variant = "cell",
  align = "center",
  emptyValue = "—",
  className,
}: MatchPredictionsBoardMvpLabelProps) {
  const trimmed = playerName?.trim();
  if (!trimmed) {
    if (variant === "header") return null;
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

  const scorerGroup = findGroupedGoalScorerForPlayer(trimmed, playerIncidents);
  const scored = scorerGroup != null;
  const displayName = goalScorerDisplayName(trimmed);
  const isHeader = variant === "header";

  const alignClass =
    align === "left"
      ? "text-left"
      : align === "right"
        ? "text-right"
        : "text-center";

  if (scored) {
    const label = formatGroupedGoalScorerLabel(scorerGroup);
    return (
      <span
        className={cn(
          isHeader
            ? cn(HEADER_MVP_TEXT_CLASS, alignClass)
            : "flex h-full w-full items-center justify-center whitespace-nowrap text-center text-[10px] leading-none",
          "text-[var(--tm-primary)]",
          className,
        )}
      >
        {label}
      </span>
    );
  }

  return (
    <span
      className={cn(
        isHeader
          ? cn(HEADER_MVP_TEXT_CLASS, alignClass)
          : "flex h-full w-full items-center justify-center whitespace-nowrap text-center text-[10px] leading-none",
        className,
      )}
    >
      <span className="text-[var(--tm-primary)]">{displayName}</span>
      <span className={isHeader ? "text-white/50" : "text-[var(--tm-fg)]"}> MVP</span>
    </span>
  );
}
