import type { CalendarMatchUnderScore } from "@/lib/predictions/calendar-match-under-score";
import { cn } from "@/lib/utils";

type CalendarMatchMvpLineProps = {
  underScore?: CalendarMatchUnderScore | null;
};

/** Nombre MVP anclado al borde inferior de la card del calendario. */
export function CalendarMatchMvpLine({ underScore }: CalendarMatchMvpLineProps) {
  if (!underScore) return null;

  return (
    <span
      className={cn(
        "tm-cal-match-mvp-line pointer-events-none absolute inset-x-0 z-[5] truncate text-center leading-none",
        underScore.tone === "official-mvp" &&
          "tm-cal-match-subtitle tm-cal-match-subtitle--official-mvp font-medium text-white",
        underScore.tone === "predicted-mvp" &&
          "tm-cal-match-subtitle tm-cal-match-subtitle--predicted-mvp font-medium text-[var(--tm-accent)]",
      )}
    >
      {underScore.label}
    </span>
  );
}
