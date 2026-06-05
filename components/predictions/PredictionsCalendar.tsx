"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState, type RefObject } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { QuickPredictionModal } from "@/components/predictions/QuickPredictionModal";
import type { MatchWithPrediction } from "@/lib/predictions/queries";
import { formatMatchCalendarAbbr, teamNameEs } from "@/lib/teams/display";
import {
  buildMonthGrid,
  compareMonth,
  formatKickoffTime,
  formatMonthLabel,
  getInitialMonthYear,
  getMonthRangeFromMatches,
  indexMatchesByDate,
  kickoffDateKey,
  shiftMonth,
  WEEKDAY_LABELS,
  type CalendarCell,
  type MonthYear,
} from "@/lib/pool/match-calendar";
import { cn } from "@/lib/utils";

const WEEKDAY_LABELS_MOBILE = ["L", "M", "X", "J", "V", "S", "D"] as const;

type PredictionsCalendarProps = {
  poolId: string;
  matches: MatchWithPrediction[];
};

function CalendarMatchLabels({
  match,
  onOpen,
}: {
  match: MatchWithPrediction;
  onOpen: () => void;
}) {
  const time = formatKickoffTime(match.kickoff_at);
  const matchLabel = formatMatchCalendarAbbr(match.home_team, match.away_team);
  const title = `${time} · ${teamNameEs(match.home_team)} vs ${teamNameEs(match.away_team)}`;

  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onOpen}
      className={cn(
        "tm-cal-match-btn flex min-h-0 w-full flex-1 flex-col items-center justify-center gap-0.5 rounded-sm px-0.5 py-0.5 transition-colors hover:bg-[rgba(111,43,255,0.2)]",
        match.status === "live" && "ring-1 ring-[var(--tm-live)]"
      )}
    >
      <span className="tm-cal-team-label text-center font-semibold leading-tight text-[var(--tm-fg)]">
        {matchLabel}
      </span>
      <span className="tm-cal-kickoff font-medium tabular-nums text-[var(--tm-accent)]">
        {time}
      </span>
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
      <div className="mt-0.5 flex flex-1 flex-col gap-px">
        {cell.matches.map((match) => (
          <CalendarMatchLabels key={match.id} match={match} onOpen={() => onOpenMatch(match)} />
        ))}
      </div>
    </div>
  );
}

function useCalendarViewportLayout(
  calendarRef: RefObject<HTMLElement | null>,
  gridRef: RefObject<HTMLDivElement | null>,
  rowCount: number,
  viewMonth: MonthYear
) {
  useLayoutEffect(() => {
    const calendar = calendarRef.current;
    const grid = gridRef.current;
    if (!calendar || !grid || rowCount === 0) return;

    const BASE_ROW_HEIGHT = 52;

    const syncLayout = () => {
      calendar.style.removeProperty("--tm-cal-row-height");
      calendar.style.removeProperty("--tm-cal-ui-scale");
      void calendar.offsetHeight;

      const cells = Array.from(grid.children) as HTMLElement[];
      let minContentRowHeight = 0;

      for (let row = 0; row < rowCount; row++) {
        let rowHeight = 0;
        for (let col = 0; col < 7; col++) {
          const cell = cells[row * 7 + col];
          if (!cell) continue;
          rowHeight = Math.max(rowHeight, cell.scrollHeight);
        }
        minContentRowHeight = Math.max(minContentRowHeight, rowHeight);
      }

      const availableGridHeight = grid.clientHeight;
      let rowHeight = minContentRowHeight;

      if (availableGridHeight > 0) {
        rowHeight = Math.max(minContentRowHeight, Math.floor(availableGridHeight / rowCount));
      }

      const scale = Math.max(0.85, Math.min(2.75, rowHeight / BASE_ROW_HEIGHT));

      calendar.style.setProperty("--tm-cal-row-height", `${rowHeight}px`);
      calendar.style.setProperty("--tm-cal-ui-scale", scale.toFixed(3));
    };

    syncLayout();

    const observer = new ResizeObserver(syncLayout);
    observer.observe(calendar);
    observer.observe(grid);

    return () => observer.disconnect();
  }, [calendarRef, gridRef, rowCount, viewMonth.month, viewMonth.year]);
}

export function PredictionsCalendar({ poolId, matches }: PredictionsCalendarProps) {
  const matchesByDate = useMemo(() => indexMatchesByDate(matches), [matches]);
  const monthRange = useMemo(() => getMonthRangeFromMatches(matches), [matches]);
  const [viewMonth, setViewMonth] = useState<MonthYear>(() => getInitialMonthYear(matches));
  const [activeMatch, setActiveMatch] = useState<MatchWithPrediction | null>(null);
  const calendarRef = useRef<HTMLElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setViewMonth(getInitialMonthYear(matches));
  }, [matches]);

  const weeks = useMemo(
    () => buildMonthGrid(viewMonth.year, viewMonth.month, matchesByDate),
    [viewMonth, matchesByDate]
  );

  useCalendarViewportLayout(calendarRef, gridRef, weeks.length, viewMonth);

  const todayKey = kickoffDateKey(new Date().toISOString());
  const monthMatchCount = useMemo(() => {
    const prefix = `${viewMonth.year}-${String(viewMonth.month).padStart(2, "0")}`;
    let count = 0;
    for (const [key, dayMatches] of matchesByDate) {
      if (key.startsWith(prefix)) count += dayMatches.length;
    }
    return count;
  }, [matchesByDate, viewMonth]);

  const canGoPrev = monthRange ? compareMonth(viewMonth, monthRange.min) > 0 : false;
  const canGoNext = monthRange ? compareMonth(viewMonth, monthRange.max) < 0 : false;

  if (!matches.length) {
    return (
      <p className="py-8 text-center text-sm text-[var(--tm-muted)]">No hay partidos cargados.</p>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="tm-porra-calendar-wrap flex min-h-0 flex-1 flex-col">
        <section
          ref={calendarRef}
          className="tm-porra-calendar tm-glass-card flex min-h-0 flex-1 flex-col p-0"
        >
          <div className="tm-cal-header flex shrink-0 justify-center border-b border-[var(--tm-border)] px-1 py-1 sm:px-3 sm:py-2">
            <div className="tm-cal-month-nav inline-flex max-w-full items-center gap-0.5 sm:gap-1.5">
              <button
                type="button"
                disabled={!canGoPrev}
                aria-label="Mes anterior"
                onClick={() => setViewMonth((m) => shiftMonth(m, -1))}
                className="tm-cal-nav-btn flex shrink-0 items-center justify-center rounded-full text-[var(--tm-muted)] transition-colors hover:bg-[rgba(111,43,255,0.12)] hover:text-[var(--tm-fg)] disabled:opacity-30"
              >
                <ChevronLeft className="h-full w-full max-h-full max-w-full" />
              </button>
              <div className="min-w-0 px-0.5 text-center">
                <h2 className="tm-cal-month-title whitespace-nowrap font-display font-semibold uppercase tracking-wide text-[var(--tm-fg)]">
                  {formatMonthLabel(viewMonth.year, viewMonth.month)}
                </h2>
                <p className="hidden whitespace-nowrap text-[10px] text-[var(--tm-muted)] sm:block">
                  {monthMatchCount} partido{monthMatchCount === 1 ? "" : "s"} este mes
                </p>
              </div>
              <button
                type="button"
                disabled={!canGoNext}
                aria-label="Mes siguiente"
                onClick={() => setViewMonth((m) => shiftMonth(m, 1))}
                className="tm-cal-nav-btn flex shrink-0 items-center justify-center rounded-full text-[var(--tm-muted)] transition-colors hover:bg-[rgba(111,43,255,0.12)] hover:text-[var(--tm-fg)] disabled:opacity-30"
              >
                <ChevronRight className="h-full w-full max-h-full max-w-full" />
              </button>
            </div>
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

      <p className="mt-2 hidden shrink-0 text-center text-[10px] text-[var(--tm-muted)] sm:block">
        Desliza horizontalmente si no ves todas las columnas. Toca un partido para predecir.
      </p>

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
