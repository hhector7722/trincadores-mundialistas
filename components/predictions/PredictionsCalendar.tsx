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
        "tm-cal-match-btn flex w-full min-w-0 flex-col items-center justify-center gap-0.5 rounded-sm px-0.5 py-0.5 transition-colors hover:bg-[rgba(111,43,255,0.2)]",
        match.status === "live" && "ring-1 ring-[var(--tm-live)]"
      )}
    >
      <span className="tm-cal-team-label text-center font-semibold leading-tight text-[var(--tm-fg)]">
        {matchLabel}
      </span>
      <span className="tm-cal-kickoff hidden font-medium tabular-nums text-[var(--tm-accent)] sm:block">
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
        "tm-cal-cell relative flex h-full min-h-0 flex-col border border-[var(--tm-border)] sm:p-1",
        hasMatches ? "bg-[rgba(212,255,0,0.05)]" : "bg-[rgba(111,43,255,0.04)]"
      )}
    >
      <span
        className={cn(
          "tm-cal-day-num shrink-0 font-semibold tabular-nums sm:text-xs",
          isToday ? "text-[var(--tm-accent)]" : "text-[var(--tm-muted)]"
        )}
      >
        {cell.dayNumber}
      </span>
      <div className="mt-0.5 flex flex-1 flex-col gap-px sm:mt-1 sm:gap-1">
        {cell.matches.map((match) => (
          <CalendarMatchLabels key={match.id} match={match} onOpen={() => onOpenMatch(match)} />
        ))}
      </div>
    </div>
  );
}

function useEqualCalendarRowHeights(
  gridRef: RefObject<HTMLDivElement | null>,
  rowCount: number,
  viewMonth: MonthYear
) {
  useLayoutEffect(() => {
    const grid = gridRef.current;
    if (!grid || rowCount === 0) return;

    const syncRowHeights = () => {
      grid.style.removeProperty("--tm-cal-row-height");
      void grid.offsetHeight;

      const cells = Array.from(grid.children) as HTMLElement[];
      let maxRowHeight = 0;

      for (let row = 0; row < rowCount; row++) {
        let rowHeight = 0;
        for (let col = 0; col < 7; col++) {
          const cell = cells[row * 7 + col];
          if (!cell) continue;
          rowHeight = Math.max(rowHeight, cell.getBoundingClientRect().height);
        }
        maxRowHeight = Math.max(maxRowHeight, rowHeight);
      }

      if (maxRowHeight > 0) {
        grid.style.setProperty("--tm-cal-row-height", `${Math.ceil(maxRowHeight)}px`);
      }
    };

    syncRowHeights();

    const observer = new ResizeObserver(syncRowHeights);
    observer.observe(grid);

    return () => observer.disconnect();
  }, [gridRef, rowCount, viewMonth.month, viewMonth.year]);
}

export function PredictionsCalendar({ poolId, matches }: PredictionsCalendarProps) {
  const matchesByDate = useMemo(() => indexMatchesByDate(matches), [matches]);
  const monthRange = useMemo(() => getMonthRangeFromMatches(matches), [matches]);
  const [viewMonth, setViewMonth] = useState<MonthYear>(() => getInitialMonthYear(matches));
  const [activeMatch, setActiveMatch] = useState<MatchWithPrediction | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setViewMonth(getInitialMonthYear(matches));
  }, [matches]);

  const weeks = useMemo(
    () => buildMonthGrid(viewMonth.year, viewMonth.month, matchesByDate),
    [viewMonth, matchesByDate]
  );

  useEqualCalendarRowHeights(gridRef, weeks.length, viewMonth);

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
    <>
      <div className="tm-porra-calendar-wrap pb-1">
        <section className="tm-porra-calendar tm-glass-card p-0">
          <div className="flex justify-center border-b border-[var(--tm-border)] px-1 py-1 sm:px-3 sm:py-2">
            <div className="tm-cal-month-nav inline-flex max-w-full items-center gap-0.5 sm:gap-1.5">
              <button
                type="button"
                disabled={!canGoPrev}
                aria-label="Mes anterior"
                onClick={() => setViewMonth((m) => shiftMonth(m, -1))}
                className="tm-cal-nav-btn flex shrink-0 items-center justify-center rounded-full text-[var(--tm-muted)] transition-colors hover:bg-[rgba(111,43,255,0.12)] hover:text-[var(--tm-fg)] disabled:opacity-30 sm:h-10 sm:w-10"
              >
                <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
              <div className="min-w-0 px-0.5 text-center">
                <h2 className="tm-cal-month-title whitespace-nowrap font-display font-semibold uppercase tracking-wide text-[var(--tm-fg)] sm:text-base">
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
                className="tm-cal-nav-btn flex shrink-0 items-center justify-center rounded-full text-[var(--tm-muted)] transition-colors hover:bg-[rgba(111,43,255,0.12)] hover:text-[var(--tm-fg)] disabled:opacity-30 sm:h-10 sm:w-10"
              >
                <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 border-b border-[var(--tm-border)] bg-[rgba(111,43,255,0.08)]">
            {WEEKDAY_LABELS.map((label, index) => (
              <div
                key={label}
                className="tm-cal-weekday text-center font-semibold uppercase tracking-wide text-[var(--tm-fg)] sm:py-2 sm:text-xs"
              >
                <span className="sm:hidden">{WEEKDAY_LABELS_MOBILE[index]}</span>
                <span className="hidden sm:inline">{label}</span>
              </div>
            ))}
          </div>

          <div ref={gridRef} className="tm-cal-body grid grid-cols-7">
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

      <p className="hidden text-center text-[10px] text-[var(--tm-muted)] sm:block">
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
    </>
  );
}
