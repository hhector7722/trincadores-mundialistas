"use client";

import { useLayoutEffect, useRef } from "react";
import { CalendarFinishedMatchCardVisual } from "@/components/predictions/CalendarFinishedMatchCardVisual";
import { Modal } from "@/components/ui/modal";
import { VIEWPORT_CHROME_SYNC_EVENT } from "@/lib/layout/viewport-chrome";
import { syncCalendarGuidePreview } from "@/lib/pool/calendar-layout";
import type { CalendarFinishedCardState } from "@/lib/predictions/calendar-finished-card";
import { resolveCalendarFinishedCard } from "@/lib/predictions/calendar-finished-card";
import { CALENDAR_GUIDE_ENTRIES, type CalendarGuideEntry } from "@/lib/predictions/calendar-guide-demos";

type CalendarGuideModalProps = {
  open: boolean;
  onClose: () => void;
  onBack?: () => void;
  stackElevated?: boolean;
};

type CalendarGuideMiniCardProps = {
  entry: CalendarGuideEntry;
  finishedState: CalendarFinishedCardState;
};

function CalendarGuideMiniCard({ entry, finishedState }: CalendarGuideMiniCardProps) {
  const rootRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const sync = () => syncCalendarGuidePreview(root);
    sync();
    const raf = requestAnimationFrame(() => requestAnimationFrame(sync));

    const observer = new ResizeObserver(sync);
    observer.observe(root);

    window.addEventListener("resize", sync);
    window.addEventListener(VIEWPORT_CHROME_SYNC_EVENT, sync);

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      window.removeEventListener("resize", sync);
      window.removeEventListener(VIEWPORT_CHROME_SYNC_EVENT, sync);
    };
  }, [entry.variant]);

  return (
    <div ref={rootRef} className="tm-porra-calendar tm-cal-guide-preview shrink-0">
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
  );
}

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
          Verde = marcador exacto · Azul = signo acertado · Rojo = fallo · ⭐ = MVP (se combina con
          cualquiera).
        </p>

        <ul className="space-y-2.5">
          {CALENDAR_GUIDE_ENTRIES.map((entry) => {
            const finishedState = resolveCalendarFinishedCard(entry.match);
            if (!finishedState) return null;

            return (
              <li
                key={entry.variant}
                className="flex items-center gap-3 rounded-xl border border-[var(--tm-border)] bg-[var(--tm-surface-elevated)]/40 px-2.5 py-2"
              >
                <CalendarGuideMiniCard entry={entry} finishedState={finishedState} />

                <p className="min-w-0 flex-1 text-sm font-semibold leading-snug text-[var(--tm-fg)]">
                  {entry.label}
                </p>

                <p className="shrink-0 text-xs font-medium tabular-nums text-[var(--tm-accent)]">
                  {entry.pointsLabel}
                </p>
              </li>
            );
          })}
        </ul>
      </div>
    </Modal>
  );
}
