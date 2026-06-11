"use client";

import { CalendarFinishedMatchCardVisual } from "@/components/predictions/CalendarFinishedMatchCardVisual";
import { Modal } from "@/components/ui/modal";
import { resolveCalendarFinishedCard } from "@/lib/predictions/calendar-finished-card";
import { CALENDAR_GUIDE_ENTRIES } from "@/lib/predictions/calendar-guide-demos";
import { cn } from "@/lib/utils";

type CalendarGuideModalProps = {
  open: boolean;
  onClose: () => void;
  onBack?: () => void;
  stackElevated?: boolean;
};

export function CalendarGuideModal({
  open,
  onClose,
  onBack,
  stackElevated = false,
}: CalendarGuideModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      onBack={onBack}
      backButtonPlain={Boolean(onBack)}
      title="Guía del calendario"
      ariaLabel="Guía del calendario"
      opaque
      stackElevated={stackElevated}
      className="max-w-md"
      panelHostClassName="max-w-md"
      containerClassName="p-3 sm:p-4"
    >
      <div className="space-y-3 p-4 pt-2">
        <p className="text-xs leading-relaxed text-[var(--tm-muted)]">
          Así se ve cada card de partido finalizado en el calendario según lo que hayas acertado.
        </p>

        <ul className="space-y-3">
          {CALENDAR_GUIDE_ENTRIES.map((entry) => {
            const finishedState = resolveCalendarFinishedCard(entry.match);
            if (!finishedState) return null;

            return (
              <li
                key={entry.variant}
                className="flex items-center gap-3 rounded-xl border border-[var(--tm-border)] bg-[var(--tm-surface-elevated)]/40 p-2.5"
              >
                <div className="min-w-0 flex-1 text-left">
                  <p className="text-sm font-semibold leading-snug text-[var(--tm-fg)]">
                    {entry.label}
                  </p>
                  <p className="mt-0.5 text-xs tabular-nums text-[var(--tm-accent)]">
                    {entry.pointsLabel}
                  </p>
                </div>

                <div
                  className={cn(
                    "tm-porra-calendar tm-cal-guide-preview shrink-0",
                    "w-[9.5rem] max-w-[42vw] rounded-md bg-[#f5f5f7] p-1"
                  )}
                >
                  <CalendarFinishedMatchCardVisual
                    homeTeam={entry.match.home_team}
                    awayTeam={entry.match.away_team}
                    groupCode={entry.match.group_code}
                    predictionHome={entry.match.prediction!.home_goals}
                    predictionAway={entry.match.prediction!.away_goals}
                    officialHome={entry.match.officialHome!}
                    officialAway={entry.match.officialAway!}
                    finishedState={finishedState}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </Modal>
  );
}
