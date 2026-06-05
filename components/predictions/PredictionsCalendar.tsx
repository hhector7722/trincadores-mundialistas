"use client";

import Link from "next/link";
import { useLayoutEffect, useMemo, useRef, useState, type RefObject } from "react";
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

function CalendarMatchFlags({
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
        "tm-cal-match-btn flex min-h-0 min-w-0 w-full flex-1 items-center justify-center rounded-sm transition-colors hover:bg-[rgba(111,43,255,0.2)]",
        match.status === "live" && "ring-1 ring-[var(--tm-live)]"
      )}
    >
      <div className="tm-cal-match-row relative w-full min-w-0">
        <span className="tm-cal-kickoff absolute left-0 top-1/2 z-10 -translate-y-1/2 font-medium leading-none text-white">
          {time}
        </span>
        <div className="tm-cal-flags relative w-full shrink-0">
          <div className="absolute left-[50%] top-1/2 -translate-x-1/2 -translate-y-1/2">
            <TeamFlagBadge name={match.home_team} size="cal" className="tm-cal-flag" />
          </div>
          <div className="absolute left-[85%] top-1/2 -translate-x-1/2 -translate-y-1/2">
            <TeamFlagBadge name={match.away_team} size="cal" className="tm-cal-flag" />
          </div>
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
        className="tm-cal-cell-pad h-full border border-[var(--tm-border)] bg-[rgba(0,0,0,0.18)]"
        aria-hidden="true"
      />
    );
  }

  const hasMatches = cell.matches.length > 0;
  const isToday = cell.dateKey === todayKey;

  return (
    <div
      className={cn(
        "tm-cal-cell relative flex h-full min-h-0 flex-col border border-[var(--tm-border)]",
        hasMatches ? "bg-[rgba(212,255,0,0.05)]" : "bg-[rgba(111,43,255,0.04)]"
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
      <div className="tm-cal-match-list mt-0.5 flex min-h-0 min-w-0 flex-1 flex-col">
        {cell.matches.map((match) => (
          <CalendarMatchFlags key={match.id} match={match} onOpen={() => onOpenMatch(match)} />
        ))}
      </div>
    </div>
  );
}

function useCalendarViewportLayout(
  calendarRef: RefObject<HTMLElement | null>,
  gridRef: RefObject<HTMLDivElement | null>,
  rowCount: number
) {
  useLayoutEffect(() => {
    const calendar = calendarRef.current;
    const grid = gridRef.current;
    if (!calendar || !grid || rowCount === 0) return;

    const syncLayout = () => {
      resetCalendarLayout(calendar);
      void calendar.offsetHeight;
      fitCalendarLayout(calendar, grid, rowCount);
    };

    syncLayout();

    const observer = new ResizeObserver(syncLayout);
    observer.observe(calendar);
    observer.observe(grid);

    return () => {
      observer.disconnect();
      resetCalendarLayout(calendar);
    };
  }, [calendarRef, gridRef, rowCount]);
}

export function PredictionsCalendar({ poolId, matches }: PredictionsCalendarProps) {
  const matchesByDate = useMemo(() => indexMatchesByDate(matches), [matches]);
  const [activeMatch, setActiveMatch] = useState<MatchWithPrediction | null>(null);
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

  useCalendarViewportLayout(calendarRef, gridRef, weeks.length);

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
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="tm-porra-calendar-wrap flex min-h-0 flex-1 flex-col">
        <section
          ref={calendarRef}
          className="tm-porra-calendar tm-porra-calendar--fullbleed tm-glass-card flex min-h-0 flex-1 flex-col p-0"
        >
          <div className="tm-cal-header flex shrink-0 items-center justify-between gap-2 border-b border-[var(--tm-border)] px-3 py-1.5 sm:py-2">
            <h2 className="tm-cal-month-title font-display font-semibold uppercase tracking-wide text-[var(--tm-fg)]">
              {monthLabel}
            </h2>
            <Link href="/predictions/knockout" className="tm-cal-ko-link shrink-0">
              ver fase eliminatoria
            </Link>
          </div>

          <div className="tm-cal-weekdays grid shrink-0 grid-cols-7 border-b border-[var(--tm-border)] bg-[rgba(111,43,255,0.08)]">
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

          <div ref={gridRef} className="tm-cal-body grid min-h-0 flex-1 grid-cols-7">
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
      </div>

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
