"use client";

import { CalendarGuidePreviewCell } from "@/components/predictions/CalendarGuidePreviewCell";
import { Modal } from "@/components/ui/modal";
import { resolveCalendarFinishedCard } from "@/lib/predictions/calendar-finished-card";
import { CALENDAR_GUIDE_ENTRIES } from "@/lib/predictions/calendar-guide-demos";

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

                <CalendarGuidePreviewCell entry={entry} finishedState={finishedState} />
              </li>
            );
          })}
        </ul>
      </div>
    </Modal>
  );
}
