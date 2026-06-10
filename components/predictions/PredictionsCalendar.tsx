"use client";

import { useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type RefObject } from "react";
import { AllGroupsStandingsModal } from "@/components/predictions/AllGroupsStandingsModal";
import { AllTeamsLineupModal } from "@/components/predictions/AllTeamsLineupModal";
import { CalendarSidebarSlot } from "@/components/predictions/CalendarSidebarSlot";
import { GroupStandingsModal } from "@/components/predictions/GroupStandingsModal";
import { QuickPredictionModal } from "@/components/predictions/QuickPredictionModal";
import { TournamentStatsModal } from "@/components/predictions/TournamentStatsModal";
import type { MatchWithPrediction } from "@/lib/predictions/queries";
import { GROUP_STAGE_CALENDAR_MONTH } from "@/lib/predictions/stage-filter";
import { TeamFlagBadge } from "@/components/predictions/TeamFlagBadge";
import { teamNameEs } from "@/lib/teams/display";
import {
  CALENDAR_SIDEBAR_CARD_ANCHOR,
  fitCalendarLayout,
  resetCalendarLayout,
  SIDEBAR_CARD_ANCHOR_ATTR,
} from "@/lib/pool/calendar-layout";
import { displayGoals } from "@/lib/predictions/edit-state";
import {
  buildGroupStandings,
  buildGroupStandingsDetail,
  CALENDAR_SIDEBAR_DAYS,
  isCalendarSidebarDay,
  toGroupMatchRows,
  type GroupStandingRow,
} from "@/lib/pool/group-standings";
import {
  buildMonthGrid,
  formatCalendarKickoffHour,
  formatMonthLabel,
  indexMatchesByDate,
  kickoffDateKey,
  trimEmptyMatchWeeks,
  WEEKDAY_LABELS,
  type CalendarCell,
  type CalendarWeek,
  type MonthYear,
} from "@/lib/pool/match-calendar";
import { cn } from "@/lib/utils";

const WEEKDAY_LABELS_MOBILE = ["L", "M", "X", "J", "V", "S", "D"] as const;
const GROUP_STAGE_VIEW: MonthYear = GROUP_STAGE_CALENDAR_MONTH;

type PredictionsCalendarProps = {
  poolId: string;
  matches: MatchWithPrediction[];
};

function isSidebarCardAnchorMatch(match: MatchWithPrediction): boolean {
  const dateKey = kickoffDateKey(match.kickoff_at);
  const day = Number(dateKey.split("-")[2]);
  return (
    day === CALENDAR_SIDEBAR_CARD_ANCHOR.day &&
    match.group_code?.toUpperCase() === CALENDAR_SIDEBAR_CARD_ANCHOR.groupCode &&
    formatCalendarKickoffHour(match.kickoff_at) === CALENDAR_SIDEBAR_CARD_ANCHOR.kickoffHour
  );
}

function formatCalendarPrediction(match: MatchWithPrediction): string {
  const prediction = match.prediction;
  if (
    !prediction ||
    !Number.isInteger(prediction.home_goals) ||
    !Number.isInteger(prediction.away_goals)
  ) {
    return "-";
  }
  return displayGoals(prediction.home_goals, prediction.away_goals);
}

function CalendarMatchCard({
  match,
  onOpen,
}: {
  match: MatchWithPrediction;
  onOpen: () => void;
}) {
  const time = formatCalendarKickoffHour(match.kickoff_at);
  const predictionLabel = formatCalendarPrediction(match);
  const title = `${time} · ${teamNameEs(match.home_team)} vs ${teamNameEs(match.away_team)} · ${predictionLabel}`;
  const isSidebarAnchor = isSidebarCardAnchorMatch(match);

  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onOpen}
      {...(isSidebarAnchor ? { [SIDEBAR_CARD_ANCHOR_ATTR]: "" } : {})}
      className={cn(
        "tm-cal-match-card relative flex min-w-0 w-full shrink-0 flex-col overflow-hidden transition-colors hover:bg-[rgba(111,43,255,0.22)]",
        match.status === "live" && "ring-1 ring-[var(--tm-live)]"
      )}
    >
      {match.group_code ? (
        <span className="tm-cal-match-group pointer-events-none absolute left-0 top-0 z-[3] uppercase leading-none text-[var(--tm-accent)]">
          {match.group_code.toUpperCase()}
        </span>
      ) : null}
      <div className="tm-cal-match-card-body">
        <span className="tm-cal-kickoff shrink-0 text-center font-medium leading-none text-white">
          {time}
        </span>
        <div className="tm-cal-flags relative w-full shrink-0">
          <div className="absolute left-[10%] top-1/2 z-[2] -translate-x-1/2 -translate-y-1/2">
            <TeamFlagBadge name={match.home_team} size="cal" className="tm-cal-flag" />
          </div>
          <span className="tm-cal-prediction pointer-events-none absolute left-1/2 top-1/2 z-[1] -translate-x-1/2 -translate-y-1/2 tabular-nums">
            {predictionLabel}
          </span>
          <div className="absolute left-[90%] top-1/2 z-[2] -translate-x-1/2 -translate-y-1/2">
            <TeamFlagBadge name={match.away_team} size="cal" className="tm-cal-flag" />
          </div>
        </div>
      </div>
    </button>
  );
}

function weekHasGroupsPanel(week: CalendarWeek<MatchWithPrediction>): boolean {
  const sidebarDays = week.cells.filter(
    (cell) => cell.inMonth && isCalendarSidebarDay(cell.dayNumber)
  );
  return sidebarDays.length === CALENDAR_SIDEBAR_DAYS.length;
}

function renderCalendarGridCells(
  weeks: CalendarWeek<MatchWithPrediction>[],
  todayKey: string,
  onOpenMatch: (match: MatchWithPrediction) => void,
  groups: GroupStandingRow[],
  onGroupClick: (groupCode: string) => void,
  onOpenAllGroups: () => void,
  onOpenStats: () => void,
  onOpenSquads: () => void
) {
  return weeks.flatMap((week, weekIndex) => {
    const row = weekIndex + 1;

    if (weekHasGroupsPanel(week)) {
      const sidebarStartCol = week.cells.findIndex(
        (cell) => cell.inMonth && cell.dayNumber === CALENDAR_SIDEBAR_DAYS[0]
      );
      const sidebarSpan = CALENDAR_SIDEBAR_DAYS.length;
      const gridColumn =
        sidebarStartCol >= 0
          ? `${sidebarStartCol + 1} / ${sidebarStartCol + 1 + sidebarSpan}`
          : "1 / 4";

      const items = [
        <CalendarSidebarSlot
          key={`sidebar-${weekIndex}`}
          groups={groups}
          gridColumn={gridColumn}
          gridRow={row}
          onGroupClick={onGroupClick}
          onOpenAllGroups={onOpenAllGroups}
          onOpenStats={onOpenStats}
          onOpenSquads={onOpenSquads}
        />,
      ];

      week.cells.forEach((cell, cellIndex) => {
        if (isCalendarSidebarDay(cell.dayNumber)) return;

        items.push(
          <DayCell
            key={`${weekIndex}-${cellIndex}-${cell.dateKey ?? "pad"}`}
            cell={cell}
            todayKey={todayKey}
            onOpenMatch={onOpenMatch}
            style={{ gridColumn: cellIndex + 1, gridRow: row }}
          />
        );
      });

      return items;
    }

    return week.cells.map((cell, cellIndex) => (
      <DayCell
        key={`${weekIndex}-${cellIndex}-${cell.dateKey ?? "pad"}`}
        cell={cell}
        todayKey={todayKey}
        onOpenMatch={onOpenMatch}
      />
    ));
  });
}

function DayCell({
  cell,
  todayKey,
  onOpenMatch,
  style,
  hideDayNumber = false,
  dockSurface = false,
}: {
  cell: CalendarCell<MatchWithPrediction>;
  todayKey: string;
  onOpenMatch: (match: MatchWithPrediction) => void;
  style?: CSSProperties;
  hideDayNumber?: boolean;
  dockSurface?: boolean;
}) {
  if (!cell.inMonth) {
    return (
      <div
        style={style}
        className="tm-cal-cell-pad h-full"
        aria-hidden="true"
      />
    );
  }

  const hasMatches = cell.matches.length > 0;
  const isToday = cell.dateKey === todayKey;

  return (
    <div
      style={style}
      className={cn(
        "tm-cal-cell relative flex h-full min-h-0 flex-col",
        dockSurface ? "tm-cal-dock-surface tm-surface-fade backdrop-blur-xl" : "tm-cal-cell-surface",
        hasMatches && !dockSurface && "tm-cal-cell--matches"
      )}
    >
      {!hideDayNumber ? (
        <span
          className={cn(
            "tm-cal-day-num shrink-0 font-semibold tabular-nums",
            isToday ? "text-[var(--tm-accent)]" : "text-[var(--tm-muted)]"
          )}
        >
          {cell.dayNumber}
        </span>
      ) : null}
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
      const layoutEl = layout instanceof HTMLElement ? layout : null;
      resetCalendarLayout(calendar, grid, layoutEl);
      void calendar.offsetHeight;
      fitCalendarLayout(calendar, grid, rowCount, layoutEl);
    };

    syncLayout();
    requestAnimationFrame(syncLayout);

    const observer = new ResizeObserver(syncLayout);
    if (layout instanceof HTMLElement) observer.observe(layout);
    observer.observe(calendar);
    observer.observe(grid);
    window.addEventListener("resize", syncLayout);
    window.visualViewport?.addEventListener("resize", syncLayout);
    window.visualViewport?.addEventListener("scroll", syncLayout);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", syncLayout);
      window.visualViewport?.removeEventListener("resize", syncLayout);
      window.visualViewport?.removeEventListener("scroll", syncLayout);
      const layoutEl = layout instanceof HTMLElement ? layout : null;
      resetCalendarLayout(calendar, grid, layoutEl);
    };
  }, [rootRef, calendarRef, gridRef, rowCount]);
}

export function PredictionsCalendar({ poolId, matches }: PredictionsCalendarProps) {
  const matchesByDate = useMemo(() => indexMatchesByDate(matches), [matches]);
  const [activeMatch, setActiveMatch] = useState<MatchWithPrediction | null>(null);
  const [activeGroupCode, setActiveGroupCode] = useState<string | null>(null);
  const [allGroupsOpen, setAllGroupsOpen] = useState(false);
  const [statsOpen, setStatsOpen] = useState(false);
  const [squadsOpen, setSquadsOpen] = useState(false);
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

  const groupMatchRows = useMemo(() => toGroupMatchRows(matches), [matches]);

  const groupStandings = useMemo(
    () => buildGroupStandings(groupMatchRows, "official"),
    [groupMatchRows]
  );
  const groupStandingsDetail = useMemo(
    () => buildGroupStandingsDetail(groupMatchRows, "official"),
    [groupMatchRows]
  );
  const groupStandingsPredicted = useMemo(
    () => buildGroupStandingsDetail(groupMatchRows, "predictions"),
    [groupMatchRows]
  );

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
    <div ref={rootRef} className="flex min-h-0 flex-1 flex-col">
      <section
        ref={calendarRef}
        style={{ "--tm-cal-weeks": weeks.length } as CSSProperties}
        className="tm-porra-calendar tm-porra-calendar--fullbleed flex min-h-0 flex-1 flex-col p-0"
      >
        <div className="tm-cal-header flex shrink-0 items-center justify-center border-b border-[var(--tm-border)] px-2 py-1 sm:px-3">
          <h2 className="tm-cal-month-title text-center font-display font-semibold uppercase tracking-wide text-[var(--tm-fg)]">
            {monthLabel}
          </h2>
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
          {renderCalendarGridCells(
            weeks,
            todayKey,
            setActiveMatch,
            groupStandings,
            setActiveGroupCode,
            () => setAllGroupsOpen(true),
            () => setStatsOpen(true),
            () => setSquadsOpen(true)
          )}
        </div>
      </section>

      {allGroupsOpen && (
        <AllGroupsStandingsModal
          open
          onClose={() => setAllGroupsOpen(false)}
          officialGroups={groupStandingsDetail}
          predictedGroups={groupStandingsPredicted}
          onSelectGroup={(code) => {
            setAllGroupsOpen(false);
            setActiveGroupCode(code);
          }}
        />
      )}

      {statsOpen && (
        <TournamentStatsModal open onClose={() => setStatsOpen(false)} matches={matches} />
      )}

      {squadsOpen && (
        <AllTeamsLineupModal open onClose={() => setSquadsOpen(false)} />
      )}

      {activeGroupCode && (
        <GroupStandingsModal
          open
          onClose={() => setActiveGroupCode(null)}
          groupCode={activeGroupCode}
          groups={groupStandingsDetail}
          onGroupChange={setActiveGroupCode}
        />
      )}

      {activeMatch && (
        <QuickPredictionModal
          open
          onClose={() => setActiveMatch(null)}
          poolId={poolId}
          match={activeMatch}
          matches={matches}
          onMatchChange={setActiveMatch}
          onMvpSaved={(matchId, playerName, teamName) => {
            setActiveMatch((current) =>
              current?.id === matchId
                ? {
                    ...current,
                    mvpPrediction: {
                      id: current.mvpPrediction?.id ?? "",
                      player_name: playerName,
                      team_name: teamName,
                      points_awarded: current.mvpPrediction?.points_awarded ?? null,
                      updated_at: current.mvpPrediction?.updated_at ?? new Date().toISOString(),
                    },
                  }
                : current
            );
          }}
        />
      )}
    </div>
  );
}
