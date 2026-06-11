"use client";

import { useLayoutEffect, useRef } from "react";
import { CalendarFinishedMatchCardVisual } from "@/components/predictions/CalendarFinishedMatchCardVisual";
import { VIEWPORT_CHROME_SYNC_EVENT } from "@/lib/layout/viewport-chrome";
import type { CalendarFinishedCardState } from "@/lib/predictions/calendar-finished-card";
import type { CalendarGuideEntry } from "@/lib/predictions/calendar-guide-demos";
import { syncCalendarGuidePreview } from "@/lib/pool/calendar-layout";

type CalendarGuidePreviewCellProps = {
  entry: CalendarGuideEntry;
  finishedState: CalendarFinishedCardState;
};

export function CalendarGuidePreviewCell({ entry, finishedState }: CalendarGuidePreviewCellProps) {
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
