import { PredictionOutcomeIcon } from "@/components/predictions/PredictionOutcomeIcon";
import { cn } from "@/lib/utils";

type CalendarGroupRowBadgeProps = {
  groupCode?: string | null;
  showGroupLetterBadge?: boolean;
  icon?: "tick" | "cross" | null;
  showMvpLabel?: boolean;
};

export function CalendarGroupRowBadge({
  groupCode,
  showGroupLetterBadge = false,
  icon,
  showMvpLabel = false,
}: CalendarGroupRowBadgeProps) {
  if (!groupCode && !icon && !showMvpLabel) return null;

  return (
    <div className="tm-cal-match-group-row pointer-events-none absolute inset-x-0 top-0 z-[4] flex items-center justify-between px-0.5">
      {groupCode ? (
        <span
          className={cn(
            "tm-cal-match-group uppercase leading-none text-[var(--tm-accent)]",
            showGroupLetterBadge && "tm-cal-match-group--badge",
          )}
        >
          {groupCode.toUpperCase()}
        </span>
      ) : (
        <span />
      )}

      {showMvpLabel ? (
        <span className="tm-cal-outline-label tm-cal-outline-label--mvp shrink-0 leading-none">
          MVP
        </span>
      ) : icon ? (
        <span className="tm-cal-group-row-icon inline-flex shrink-0 leading-none">
          <PredictionOutcomeIcon variant={icon === "tick" ? "success" : "error"} />
        </span>
      ) : null}
    </div>
  );
}
