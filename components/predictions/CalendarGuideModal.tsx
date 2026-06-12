"use client";

import { useLayoutEffect, useRef, type RefObject } from "react";
import { CalendarFinishedMatchCardVisual } from "@/components/predictions/CalendarFinishedMatchCardVisual";
import { Modal } from "@/components/ui/modal";
import { VIEWPORT_CHROME_SYNC_EVENT } from "@/lib/layout/viewport-chrome";
import { syncAllCalendarGuidePreviews } from "@/lib/pool/calendar-layout";
import {
  CAL_FINISHED_OUTER_MUTED_CLASS,
  resolveCalendarFinishedCard,
  type CalendarFinishedCardState,
} from "@/lib/predictions/calendar-finished-card";
import { CALENDAR_GUIDE_ENTRIES, type CalendarGuideEntry } from "@/lib/predictions/calendar-guide-demos";

type CalendarGuideModalProps = {
  open: boolean;
  onClose: () => void;
  onBack?: () => void;
  stackElevated?: boolean;
};

const GUIDE_PREVIEW_METRIC_VARS = [
  "--tm-cal-guide-preview-w",
  "--tm-cal-match-card-h",
  "--tm-cal-ui-scale",
  "--tm-cal-match-gap",
  "--tm-cal-sidebar-heading-fs",
] as const;

function CalendarGuideMiniCard({
  entry,
  finishedState,
}: {
  entry: CalendarGuideEntry;
  finishedState: CalendarFinishedCardState;
}) {
  return (
    <div className="tm-porra-calendar tm-cal-guide-preview shrink-0" aria-hidden>
      <CalendarFinishedMatchCardVisual
        className={CAL_FINISHED_OUTER_MUTED_CLASS}
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

function useSyncGuidePreviewMetrics(listRef: RefObject<HTMLUListElement | null>, active: boolean) {
  useLayoutEffect(() => {
    if (!active) return;

    const list = listRef.current;
    if (!list) return;

    const applyMetrics = () => {
      syncAllCalendarGuidePreviews(list);

      const probe = list.querySelector<HTMLElement>(".tm-cal-guide-preview");
      if (!probe) return;

      for (const varName of GUIDE_PREVIEW_METRIC_VARS) {
        const value = probe.style.getPropertyValue(varName).trim();
        if (value) list.style.setProperty(varName, value);
      }
    };

    applyMetrics();
    const raf = requestAnimationFrame(() => requestAnimationFrame(applyMetrics));

    const observer = new ResizeObserver(applyMetrics);
    observer.observe(list);

    window.addEventListener("resize", applyMetrics);
    window.addEventListener(VIEWPORT_CHROME_SYNC_EVENT, applyMetrics);

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      window.removeEventListener("resize", applyMetrics);
      window.removeEventListener(VIEWPORT_CHROME_SYNC_EVENT, applyMetrics);
    };
  }, [active, listRef]);
}

export function CalendarGuideModal({
  open,
  onClose,
  onBack,
  stackElevated = false,
}: CalendarGuideModalProps) {
  const listRef = useRef<HTMLUListElement>(null);
  useSyncGuidePreviewMetrics(listRef, open);

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
      <ul ref={listRef} className="tm-cal-guide-entries space-y-2.5 p-4 pt-2">
        {CALENDAR_GUIDE_ENTRIES.map((entry) => {
          const finishedState = resolveCalendarFinishedCard(entry.match);
          if (!finishedState) return null;

          return (
            <li key={entry.variant} className="flex min-h-12 items-center gap-3">
              <p className="min-w-0 flex-1 text-sm font-semibold leading-snug text-[var(--tm-fg)]">
                {entry.label}
              </p>

              <p className="shrink-0 text-xs font-medium tabular-nums text-[var(--tm-accent)]">
                {entry.pointsLabel}
              </p>

              <CalendarGuideMiniCard entry={entry} finishedState={finishedState} />
            </li>
          );
        })}
      </ul>
    </Modal>
  );
}
