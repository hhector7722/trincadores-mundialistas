"use client";

import Link from "next/link";
import { useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type RefObject } from "react";
import { QuickPredictionModal } from "@/components/predictions/QuickPredictionModal";
import type { MatchWithPrediction } from "@/lib/predictions/queries";
import { GROUP_STAGE_CALENDAR_MONTH } from "@/lib/predictions/stage-filter";
import { TeamFlagBadge } from "@/components/predictions/TeamFlagBadge";
import { teamNameEs } from "@/lib/teams/display";
import { fitCalendarLayout, resetCalendarLayout } from "@/lib/pool/calendar-layout";
import {
  buildMonthGrid,
  formatCalendarKickoffHour,
  formatMonthLabel,
  indexMatchesByDate,
  kickoffDateKey,
  trimEmptyMatchWeeks,
  WEEKDAY_LABELS,
  type CalendarCell,
  type MonthYear,
} from "@/lib/pool/match-calendar";
import { cn } from "@/lib/utils";

const WEEKDAY_LABELS_MOBILE = ["L", "M", "X", "J", "V", "S", "D"] as const;
const GROUP_STAGE_VIEW: MonthYear = GROUP_STAGE_CALENDAR_MONTH;

type PredictionsCalendarProps = {
  poolId: string;
  matches: MatchWithPrediction[];
};

function CalendarMatchCard({
  match,
  onOpen,
}: {
  match: MatchWithPrediction;
  onOpen: () => void;
}) {
  const time = formatCalendarKickoffHour(match.kickoff_at);
  const title = `${time} · ${teamNameEs(match.home_team)} vs ${teamNameEs(match.away_team)}`;

  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onOpen}
      className={cn(
        "tm-cal-match-card flex min-w-0 w-full shrink-0 flex-col overflow-hidden transition-colors hover:bg-[rgba(111,43,255,0.22)]",
        match.status === "live" && "ring-1 ring-[var(--tm-live)]"
      )}
    >
      <span className="tm-cal-kickoff shrink-0 text-center font-medium leading-none text-white">
        {time}
      </span>
      <div className="tm-cal-flags relative w-full shrink-0">
        <div className="absolute left-[20%] top-1/2 -translate-x-1/2 -translate-y-1/2">
          <TeamFlagBadge name={match.home_team} size="cal" className="tm-cal-flag" />
        </div>
        <div className="absolute left-[80%] top-1/2 -translate-x-1/2 -translate-y-1/2">
          <TeamFlagBadge name={match.away_team} size="cal" className="tm-cal-flag" />
        </div>
      </div>
    </button>
  );
}

function DayCell({
  cell,
  todayKey,
  onOpenMatch,
}: {
  cell: CalendarCell<MatchWithPrediction>;
  todayKey: string;
  onOpenMatch: (match: MatchWithPrediction) => void;
}) {
  if (!cell.inMonth) {
    return (
      <div
        className="tm-cal-cell-pad h-full border border-[var(--tm-border)] bg-[rgba(0,0,0,0.12)]"
        aria-hidden="true"
      />
    );
  }

  const hasMatches = cell.matches.length > 0;
  const isToday = cell.dateKey === todayKey;

  return (
    <div
      className={cn(
        "tm-cal-cell relative flex h-full min-h-0 flex-col border border-[var(--tm-border)] bg-[var(--tm-glass)]",
        hasMatches && "tm-cal-cell--matches"
      )}
    >
      <span
        className={cn(
          "tm-cal-day-num shrink-0 font-semibold tabular-nums",
          isToday ? "text-[var(--tm-accent)]" : "text-[var(--tm-muted)]"
        )}
      >
        {cell.dayNumber}
      </span>
      <div className="tm-cal-match-list mt-0.5 flex min-h-0 min-w-0 flex-1 flex-col justify-start">
        {cell.matches.map((match) => (
          <CalendarMatchCard key={match.id} match={match} onOpen={() => onOpenMatch(match)} />
        ))}
      </div>
    </div>
  );
}

function useCalendarViewportLayout(
  rootRef: RefObject<HTMLElement | null>,
  calendarRef: RefObject<HTMLElement | null>,
  gridRef: RefObject<HTMLDivElement | null>,
  rowCount: number
) {
  useLayoutEffect(() => {
    const calendar = calendarRef.current;
    const grid = gridRef.current;
    if (!calendar || !grid || rowCount === 0) return;

    const layout =
      rootRef.current?.closest(".tm-porra-layout") ??
      rootRef.current ??
      calendar.parentElement;

    const syncLayout = () => {
      calendar.style.setProperty("--tm-cal-weeks", String(rowCount));
      resetCalendarLayout(calendar);
      void calendar.offsetHeight;
      fitCalendarLayout(calendar, grid, rowCount);
    };

    syncLayout();

    const observer = new ResizeObserver(syncLayout);
    if (layout instanceof HTMLElement) observer.observe(layout);
    observer.observe(calendar);
    observer.observe(grid);
    window.addEventListener("resize", syncLayout);
    window.visualViewport?.addEventListener("resize", syncLayout);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", syncLayout);
      window.visualViewport?.removeEventListener("resize", syncLayout);
      resetCalendarLayout(calendar);
    };
  }, [rootRef, calendarRef, gridRef, rowCount]);
}

export function PredictionsCalendar({ poolId, matches }: PredictionsCalendarProps) {
  const matchesByDate = useMemo(() => indexMatchesByDate(matches), [matches]);
  const [activeMatch, setActiveMatch] = useState<MatchWithPrediction | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const calendarRef = useRef<HTMLElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  const weeks = useMemo(() => {
    const grid = buildMonthGrid(
      GROUP_STAGE_VIEW.year,
      GROUP_STAGE_VIEW.month,
      matchesByDate
    );
    const trimmed = trimEmptyMatchWeeks(grid, GROUP_STAGE_VIEW);
    return trimmed.length > 0 ? trimmed : grid;
  }, [matchesByDate]);

  useCalendarViewportLayout(rootRef, calendarRef, gridRef, weeks.length);

  const todayKey = kickoffDateKey(new Date().toISOString());
  const monthLabel = formatMonthLabel(GROUP_STAGE_VIEW.year, GROUP_STAGE_VIEW.month);

  if (!matches.length) {
    return (
      <p className="py-8 text-center text-sm text-[var(--tm-muted)]">
        No hay partidos de fase de grupos cargados.
      </p>
    );
  }

  return (
    <div ref={rootRef} className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
      <section
        ref={calendarRef}
        style={{ "--tm-cal-weeks": weeks.length } as CSSProperties}
        className="tm-porra-calendar tm-porra-calendar--fullbleed flex h-full min-h-0 flex-1 flex-col overflow-hidden p-0"
      >
        <div className="tm-cal-header grid shrink-0 grid-cols-[1fr_auto_1fr] items-center border-b border-[var(--tm-border)] px-2 py-1 sm:px-3">
          <div aria-hidden="true" />
          <h2 className="tm-cal-month-title text-center font-display font-semibold uppercase tracking-wide text-[var(--tm-fg)]">
            {monthLabel}
          </h2>
          <Link href="/predictions/knockout" className="tm-cal-ko-link justify-self-end">
            VER ELIMINATORIAS
          </Link>
        </div>

        <div className="tm-cal-weekdays grid shrink-0 grid-cols-7 border-b border-[var(--tm-border)]">
          {WEEKDAY_LABELS.map((label, index) => (
            <div
              key={label}
              className="tm-cal-weekday text-center font-semibold uppercase tracking-wide text-[var(--tm-fg)]"
            >
              <span className="sm:hidden">{WEEKDAY_LABELS_MOBILE[index]}</span>
              <span className="hidden sm:inline">{label}</span>
            </div>
          ))}
        </div>

        <div ref={gridRef} className="tm-cal-body min-h-0">
          {weeks.flatMap((week, weekIndex) =>
            week.cells.map((cell, cellIndex) => (
              <DayCell
                key={`${weekIndex}-${cellIndex}-${cell.dateKey ?? "pad"}`}
                cell={cell}
                todayKey={todayKey}
                onOpenMatch={setActiveMatch}
              />
            ))
          )}
        </div>
      </section>

      {activeMatch && (
        <QuickPredictionModal
          key={`${activeMatch.id}:${activeMatch.prediction?.updated_at ?? "none"}`}
          open
          onClose={() => setActiveMatch(null)}
          poolId={poolId}
          match={activeMatch}
        />
      )}
    </div>
  );
}
