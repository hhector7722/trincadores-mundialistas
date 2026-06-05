"use client";

import { useMemo, useState } from "react";
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
  shiftMonth,
  WEEKDAY_LABELS,
  type CalendarCell,
  type MonthYear,
} from "@/lib/pool/match-calendar";
import { cn } from "@/lib/utils";

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
        "flex w-full min-w-0 items-center justify-center gap-0.5 rounded-md px-0.5 py-0.5 transition-colors hover:bg-[rgba(111,43,255,0.16)]",
        match.status === "live" && "ring-1 ring-[var(--tm-live)]",
        !match.prediction && match.serverEditable && "opacity-100",
        match.prediction && "opacity-100"
      )}
    >
      <TeamFlagBadge name={match.home_team} size="xs" />
      <span className="text-[8px] leading-none text-[var(--tm-muted)]">·</span>
      <TeamFlagBadge name={match.away_team} size="xs" />
    </button>
  );
}

function DayCell({
  cell,
  onOpenMatch,
}: {
  cell: CalendarCell;
  onOpenMatch: (match: MatchWithPrediction) => void;
}) {
  if (!cell.inMonth) {
    return <div className="min-h-[4.5rem] border border-[var(--tm-border)] bg-[rgba(0,0,0,0.12)] sm:min-h-[5.5rem]" />;
  }

  return (
    <div className="relative flex min-h-[4.5rem] flex-col border border-[var(--tm-border)] bg-[rgba(111,43,255,0.04)] p-1 sm:min-h-[5.5rem]">
      <span className="absolute left-1 top-0.5 text-[10px] font-semibold tabular-nums text-[var(--tm-muted)] sm:text-xs">
        {cell.dayNumber}
      </span>
      <div className="mt-4 flex flex-col gap-0.5">
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

  const weeks = useMemo(
    () => buildMonthGrid(viewMonth.year, viewMonth.month, matchesByDate),
    [viewMonth, matchesByDate]
  );

  const canGoPrev = monthRange ? compareMonth(viewMonth, monthRange.min) > 0 : false;
  const canGoNext = monthRange ? compareMonth(viewMonth, monthRange.max) < 0 : false;

  if (!matches.length) {
    return (
      <p className="py-8 text-center text-sm text-[var(--tm-muted)]">No hay partidos cargados.</p>
    );
  }

  return (
    <>
      <section className="tm-glass-card overflow-hidden p-0">
        <div className="flex items-center justify-between border-b border-[var(--tm-border)] px-3 py-2">
          <button
            type="button"
            disabled={!canGoPrev}
            aria-label="Mes anterior"
            onClick={() => setViewMonth((m) => shiftMonth(m, -1))}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[var(--tm-muted)] transition-colors hover:bg-[rgba(111,43,255,0.12)] hover:text-[var(--tm-fg)] disabled:opacity-30"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-[var(--tm-fg)] sm:text-base">
            {formatMonthYearLabel(viewMonth.year, viewMonth.month)}
          </h2>
          <button
            type="button"
            disabled={!canGoNext}
            aria-label="Mes siguiente"
            onClick={() => setViewMonth((m) => shiftMonth(m, 1))}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[var(--tm-muted)] transition-colors hover:bg-[rgba(111,43,255,0.12)] hover:text-[var(--tm-fg)] disabled:opacity-30"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        <div className="grid grid-cols-7 border-b border-[var(--tm-border)]">
          {WEEKDAY_LABELS.map((label) => (
            <div
              key={label}
              className="border-r border-[var(--tm-border)] py-2 text-center text-[10px] font-semibold uppercase tracking-wide text-[var(--tm-muted)] last:border-r-0 sm:text-xs"
            >
              {label}
            </div>
          ))}
        </div>

        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="grid grid-cols-7">
            {week.cells.map((cell, cellIndex) => (
              <DayCell
                key={`${weekIndex}-${cellIndex}-${cell.dateKey ?? "pad"}`}
                cell={cell}
                onOpenMatch={setActiveMatch}
              />
            ))}
          </div>
        ))}
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
    </>
  );
}
