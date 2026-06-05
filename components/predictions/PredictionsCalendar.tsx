"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { QuickPredictionModal } from "@/components/predictions/QuickPredictionModal";
import { TeamFlagBadge } from "@/components/predictions/TeamFlagBadge";
import type { MatchWithPrediction } from "@/lib/predictions/queries";
import {
  buildMonthGrid,
  compareMonth,
  formatKickoffTime,
  formatMonthYearLabel,
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

function CalendarMatchFlags({
  match,
  onOpen,
}: {
  match: MatchWithPrediction;
  onOpen: () => void;
}) {
  const time = formatKickoffTime(match.kickoff_at);
  const title = `${time} · ${match.home_team} vs ${match.away_team}`;

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
      <div className="flex items-center justify-center gap-px sm:gap-0.5">
        <TeamFlagBadge name={match.home_team} size="xxs" className="tm-cal-flag" />
        <span className="hidden text-[9px] leading-none text-[var(--tm-muted)] sm:inline">·</span>
        <TeamFlagBadge name={match.away_team} size="xxs" className="tm-cal-flag" />
      </div>
      <span className="hidden text-[9px] font-medium tabular-nums text-[var(--tm-accent)] sm:block">
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
          <CalendarMatchFlags key={match.id} match={match} onOpen={() => onOpenMatch(match)} />
        ))}
      </div>
    </div>
  );
}

export function PredictionsCalendar({ poolId, matches }: PredictionsCalendarProps) {
  const matchesByDate = useMemo(() => indexMatchesByDate(matches), [matches]);
  const monthRange = useMemo(() => getMonthRangeFromMatches(matches), [matches]);
  const [viewMonth, setViewMonth] = useState<MonthYear>(() => getInitialMonthYear(matches));
  const [activeMatch, setActiveMatch] = useState<MatchWithPrediction | null>(null);

  useEffect(() => {
    setViewMonth(getInitialMonthYear(matches));
  }, [matches]);

  const weeks = useMemo(
    () => buildMonthGrid(viewMonth.year, viewMonth.month, matchesByDate),
    [viewMonth, matchesByDate]
  );

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
          <div className="flex items-center justify-between border-b border-[var(--tm-border)] px-1 py-1 sm:px-3 sm:py-2">
            <button
              type="button"
              disabled={!canGoPrev}
              aria-label="Mes anterior"
              onClick={() => setViewMonth((m) => shiftMonth(m, -1))}
              className="tm-cal-nav-btn flex shrink-0 items-center justify-center rounded-full text-[var(--tm-muted)] transition-colors hover:bg-[rgba(111,43,255,0.12)] hover:text-[var(--tm-fg)] disabled:opacity-30 sm:h-10 sm:w-10"
            >
              <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
            <div className="min-w-0 text-center">
              <h2 className="tm-cal-month-title truncate font-display font-semibold uppercase tracking-wide text-[var(--tm-fg)] sm:text-base">
                {formatMonthYearLabel(viewMonth.year, viewMonth.month)}
              </h2>
              <p className="hidden text-[10px] text-[var(--tm-muted)] sm:block">
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

          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="tm-cal-week-row grid grid-cols-7 items-stretch">
              {week.cells.map((cell, cellIndex) => (
                <DayCell
                  key={`${weekIndex}-${cellIndex}-${cell.dateKey ?? "pad"}`}
                  cell={cell}
                  todayKey={todayKey}
                  onOpenMatch={setActiveMatch}
                />
              ))}
            </div>
          ))}
        </section>
      </div>

      <p className="hidden text-center text-[10px] text-[var(--tm-muted)] sm:block">
        Desliza horizontalmente si no ves todas las columnas. Toca las banderas para predecir.
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
