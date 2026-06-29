"use client";

import {
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type RefObject,
} from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { KnockoutBracket } from "@/components/predictions/KnockoutBracket";
import { EasterEggScene } from "@/components/predictions/EasterEggScene";
import { patchMatchMvpPrediction } from "@/lib/predictions/mvp-match-state";
import { AllGroupsStandingsModal } from "@/components/predictions/AllGroupsStandingsModal";
import { AllTeamsLineupModal } from "@/components/predictions/AllTeamsLineupModal";
import { CalendarSidebarSlot } from "@/components/predictions/CalendarSidebarSlot";
import { GroupStandingsModal } from "@/components/predictions/GroupStandingsModal";
import { QuickPredictionModal } from "@/components/predictions/QuickPredictionModal";
import { TournamentStatsModal } from "@/components/predictions/TournamentStatsModal";
import type { MatchWithPrediction } from "@/lib/predictions/queries";
import { GROUP_STAGE_CALENDAR_MONTH } from "@/lib/predictions/stage-filter";
import { CalendarMatchCardFlagsRow } from "@/components/predictions/CalendarMatchCardFlagsRow";
import { teamNameEs } from "@/lib/teams/display";
import {
  CALENDAR_SIDEBAR_CARD_ANCHOR,
  fitCalendarLayout,
  resetCalendarLayout,
  SIDEBAR_CARD_ANCHOR_ATTR,
} from "@/lib/pool/calendar-layout";
import { VIEWPORT_CHROME_SYNC_EVENT } from "@/lib/layout/viewport-chrome";
import { CalendarFinishedMatchCardVisual } from "@/components/predictions/CalendarFinishedMatchCardVisual";
import { CalendarMatchGroupBadge } from "@/components/predictions/CalendarMatchGroupBadge";
import { CalendarMatchMvpLine } from "@/components/predictions/CalendarMatchMvpLine";
import { displayGoals } from "@/lib/predictions/edit-state";
import { resolveCalendarMatchUnderScore } from "@/lib/predictions/calendar-match-under-score";
import { mvpPlayerNameFromMatch } from "@/lib/predictions/mvp-match-state";
import {
  CAL_FINISHED_OUTER_MUTED_CLASS,
  resolveCalendarFinishedCard,
} from "@/lib/predictions/calendar-finished-card";
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
import type { CalendarModalOpener } from "@/lib/predictions/calendar-data-access";
import { cn } from "@/lib/utils";

const WEEKDAY_LABELS_MOBILE = ["L", "M", "X", "J", "V", "S", "D"] as const;
const GROUP_STAGE_VIEW: MonthYear = GROUP_STAGE_CALENDAR_MONTH;

type PredictionsCalendarProps = {
  poolId: string;
  matches: MatchWithPrediction[];
  currentProfileId: string;
  currentProfileAlias?: string;
  isAdminUser?: boolean;
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

function formatCalendarOfficialScore(match: MatchWithPrediction): string {
  if (
    match.officialHome == null ||
    match.officialAway == null ||
    !Number.isInteger(match.officialHome) ||
    !Number.isInteger(match.officialAway)
  ) {
    return "-";
  }
  return displayGoals(match.officialHome, match.officialAway);
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
  const officialLabel = formatCalendarOfficialScore(match);
  const finishedState = resolveCalendarFinishedCard(match);
  const isSidebarAnchor = isSidebarCardAnchorMatch(match);
  const upcomingUnderScore = resolveCalendarMatchUnderScore({
    finished: false,
    predictedMvpPlayerName: mvpPlayerNameFromMatch(match),
  });

  const title = finishedState
    ? `${teamNameEs(match.home_team)} vs ${teamNameEs(match.away_team)} · Real ${officialLabel} · Tu ${predictionLabel}`
    : `${time} · ${teamNameEs(match.home_team)} vs ${teamNameEs(match.away_team)} · ${predictionLabel}`;

  if (finishedState) {
    return (
      <CalendarFinishedMatchCardVisual
        interactive
        title={title}
        onClick={onOpen}
        anchorAttr={isSidebarAnchor ? { [SIDEBAR_CARD_ANCHOR_ATTR]: "" } : undefined}
        className={CAL_FINISHED_OUTER_MUTED_CLASS}
        homeTeam={match.home_team}
        awayTeam={match.away_team}
        groupCode={match.group_code}
        officialMvpPlayerName={match.officialMvpPlayerName}
        officialHome={match.officialHome!}
        officialAway={match.officialAway!}
        finishedState={finishedState}
      />
    );
  }

  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onOpen}
      {...(isSidebarAnchor ? { [SIDEBAR_CARD_ANCHOR_ATTR]: "" } : {})}
      className={cn(
        "tm-cal-match-card relative flex min-w-0 w-full shrink-0 flex-col overflow-hidden",
        match.status === "live" && "ring-1 ring-[var(--tm-live)]",
      )}
    >
      <CalendarMatchGroupBadge groupCode={match.group_code} />
      <CalendarMatchMvpLine underScore={upcomingUnderScore} />
      <div className="tm-cal-match-card-body">
        <span className="tm-cal-kickoff shrink-0 text-center font-medium leading-none text-white">
          {time}
        </span>
        <CalendarMatchCardFlagsRow
          homeTeam={match.home_team}
          awayTeam={match.away_team}
          centerLabel={predictionLabel}
        />
      </div>
    </button>
  );
}

function weekHasGroupsPanel(week: CalendarWeek<MatchWithPrediction>, isJune: boolean): boolean {
  if (!isJune) return false;
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
  onOpenAllGroups: CalendarModalOpener,
  onOpenStats: CalendarModalOpener,
  onOpenSquads: CalendarModalOpener,
  isJune: boolean
) {
  return weeks.flatMap((week, weekIndex) => {
    const row = weekIndex + 1;

    if (weekHasGroupsPanel(week, isJune)) {
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
  const forceShow = cell.dateKey === "2026-06-29" || cell.dateKey === "2026-06-30";
  
  if (!cell.inMonth && !forceShow) {
    return (
      <div
        style={style}
        className="tm-cal-cell-pad h-full"
        aria-hidden="true"
      />
    );
  }

  const hasMatches = cell.matches.length > 0;
  const isOutMonth = !cell.inMonth;
  const treatAsInMonth = forceShow;

  return (
    <div
      style={style}
      className={cn(
        "tm-cal-cell relative flex h-full min-h-0 flex-col",
        dockSurface ? "tm-cal-dock-surface tm-surface-fade backdrop-blur-xl" : "tm-cal-cell-surface",
        hasMatches && !dockSurface && "tm-cal-cell--matches",
        isOutMonth && !treatAsInMonth && "opacity-80"
      )}
    >
      {!hideDayNumber ? (
        <span
          className={cn(
            "tm-cal-day-num shrink-0 font-semibold tabular-nums",
            isOutMonth && !treatAsInMonth ? "text-[var(--tm-muted)] text-[0.7rem]" : "text-black"
          )}
        >
          {cell.dayNumber}
          {isOutMonth && !treatAsInMonth && " Jun"}
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
  rowCount: number,
  onReady?: () => void
) {
  useLayoutEffect(() => {
    const calendar = calendarRef.current;
    const grid = gridRef.current;
    if (!calendar || !grid || rowCount === 0) return;

    const layout =
      rootRef.current?.closest(".tm-porra-layout") ??
      rootRef.current ??
      calendar.parentElement;

    const mainEl = layout instanceof HTMLElement ? layout.closest(".tm-app-main") : null;

    const syncLayout = () => {
      calendar.style.setProperty("--tm-cal-weeks", String(rowCount));
      const layoutEl = layout instanceof HTMLElement ? layout : null;
      resetCalendarLayout(calendar, grid, layoutEl);
      void calendar.offsetHeight;
      fitCalendarLayout(calendar, grid, rowCount, layoutEl);
    };

    const syncFrameRef = { current: null as number | null };

    const scheduleSync = () => {
      if (syncFrameRef.current != null) {
        cancelAnimationFrame(syncFrameRef.current);
      }

      syncFrameRef.current = requestAnimationFrame(() => {
        syncFrameRef.current = requestAnimationFrame(() => {
          syncLayout();
          if (onReady) onReady();
          syncFrameRef.current = null;
        });
      });
    };

    scheduleSync();

    const observer = new ResizeObserver(scheduleSync);
    if (layout instanceof HTMLElement) observer.observe(layout);
    if (mainEl instanceof HTMLElement) observer.observe(mainEl);
    observer.observe(calendar);
    observer.observe(grid);
    window.addEventListener("resize", scheduleSync);
    window.addEventListener(VIEWPORT_CHROME_SYNC_EVENT, scheduleSync);
    window.visualViewport?.addEventListener("resize", scheduleSync);
    window.visualViewport?.addEventListener("scroll", scheduleSync);
    window.addEventListener("load", scheduleSync, { once: true });

    return () => {
      if (syncFrameRef.current != null) {
        cancelAnimationFrame(syncFrameRef.current);
      }
      observer.disconnect();
      window.removeEventListener("resize", scheduleSync);
      window.removeEventListener(VIEWPORT_CHROME_SYNC_EVENT, scheduleSync);
      window.visualViewport?.removeEventListener("resize", scheduleSync);
      window.visualViewport?.removeEventListener("scroll", scheduleSync);
      const layoutEl = layout instanceof HTMLElement ? layout : null;
      resetCalendarLayout(calendar, grid, layoutEl);
    };
  }, [rootRef, calendarRef, gridRef, rowCount]);
}
function resolveKnockoutTeams(matches: MatchWithPrediction[]): MatchWithPrediction[] {
  const sorted = [...matches].sort((a, b) => (a.match_number || 0) - (b.match_number || 0));
  const matchMap = new Map<number, MatchWithPrediction>();

  for (const m of sorted) {
    const resolveTeam = (raw: string | undefined | null): string => {
      const rawTrimmed = (raw ?? "").trim();
      if ((rawTrimmed.startsWith("W") || rawTrimmed.startsWith("L")) && !isNaN(Number(rawTrimmed.slice(1)))) {
        const isLoser = rawTrimmed.startsWith("L");
        const prevMatchNumber = Number(rawTrimmed.slice(1));
        const prevMatch = matchMap.get(prevMatchNumber);
        if (prevMatch && prevMatch.status === "finished" && prevMatch.officialHome != null && prevMatch.officialAway != null) {
          if (prevMatch.officialHome > prevMatch.officialAway) {
            return isLoser ? prevMatch.away_team : prevMatch.home_team;
          } else if (prevMatch.officialAway > prevMatch.officialHome) {
            return isLoser ? prevMatch.home_team : prevMatch.away_team;
          }
        }
      }
      return rawTrimmed;
    };

    const resolvedHome = resolveTeam(m.home_team);
    const resolvedAway = resolveTeam(m.away_team);

    const updatedMatch = {
      ...m,
      home_team: resolvedHome || m.home_team,
      away_team: resolvedAway || m.away_team,
    };
    if (m.match_number != null) {
      matchMap.set(m.match_number, updatedMatch);
    }
  }

  return matches.map(m => (m.match_number != null ? matchMap.get(m.match_number) : undefined) || m);
}

export function PredictionsCalendar({
  poolId,
  matches,
  currentProfileId,
  currentProfileAlias,
  isAdminUser = false,
}: PredictionsCalendarProps) {
  const [layoutReady, setLayoutReady] = useState(false);
  const [currentMonthView, setCurrentMonthView] = useState<MonthYear>({ year: 2026, month: 7 });
  const resolvedSourceMatches = useMemo(() => resolveKnockoutTeams(matches), [matches]);

  const [localMatchState, setLocalMatchState] = useState(() => ({
    source: matches,
    items: resolvedSourceMatches,
  }));
  const [activeMatch, setActiveMatch] = useState<MatchWithPrediction | null>(null);

  if (localMatchState.source !== matches) {
    setLocalMatchState({ source: matches, items: resolvedSourceMatches });
  }

  const localMatches = localMatchState.source === matches ? localMatchState.items : resolvedSourceMatches;

  const matchesByDate = useMemo(() => indexMatchesByDate(localMatches), [localMatches]);
  const [activeGroupCode, setActiveGroupCode] = useState<string | null>(null);
  const [allGroupsOpen, setAllGroupsOpen] = useState(false);
  const [statsOpen, setStatsOpen] = useState(false);
  const [squadsOpen, setSquadsOpen] = useState(false);
  const [allGroupsDataAccessBack, setAllGroupsDataAccessBack] = useState<(() => void) | null>(
    null
  );
  const [statsDataAccessBack, setStatsDataAccessBack] = useState<(() => void) | null>(null);
  const [squadsDataAccessBack, setSquadsDataAccessBack] = useState<(() => void) | null>(null);
  const [allGroupsStackElevated, setAllGroupsStackElevated] = useState(false);
  const [statsStackElevated, setStatsStackElevated] = useState(false);
  const [squadsStackElevated, setSquadsStackElevated] = useState(false);
  const [manualEggKey, setManualEggKey] = useState(0);

  const openAllGroupsModal: CalendarModalOpener = (options) => {
    setAllGroupsDataAccessBack(
      options?.fromDataAccess ? (options.reopenDataAccess ?? null) : null
    );
    setAllGroupsStackElevated(options?.stackElevated ?? false);
    setAllGroupsOpen(true);
  };

  const openStatsModal: CalendarModalOpener = (options) => {
    setStatsDataAccessBack(options?.fromDataAccess ? (options.reopenDataAccess ?? null) : null);
    setStatsStackElevated(options?.stackElevated ?? false);
    setStatsOpen(true);
  };

  const openSquadsModal: CalendarModalOpener = (options) => {
    setSquadsDataAccessBack(options?.fromDataAccess ? (options.reopenDataAccess ?? null) : null);
    setSquadsStackElevated(options?.stackElevated ?? false);
    setSquadsOpen(true);
  };
  const rootRef = useRef<HTMLDivElement>(null);
  const calendarRef = useRef<HTMLElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  const weeks = useMemo(() => {
    const grid = buildMonthGrid(
      currentMonthView.year,
      currentMonthView.month,
      matchesByDate
    );
    const trimmed = trimEmptyMatchWeeks(grid, currentMonthView);
    return trimmed.length > 0 ? trimmed : grid;
  }, [matchesByDate, currentMonthView]);

  const groupMatchRows = useMemo(() => toGroupMatchRows(localMatches), [localMatches]);

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

  useCalendarViewportLayout(rootRef, calendarRef, gridRef, weeks.length, () => {
    setLayoutReady(true);
  });

  const todayKey = kickoffDateKey(new Date().toISOString());
  const monthLabel = formatMonthLabel(currentMonthView.year, currentMonthView.month);
  const isJune = currentMonthView.month === 6;

  if (!localMatches.length) {
    return (
      <p className="py-8 text-center text-sm text-[var(--tm-muted)]">
        No hay partidos de fase de grupos cargados.
      </p>
    );
  }

  return (
    <div ref={rootRef} className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
      <section
        ref={calendarRef}
        style={{ 
          "--tm-cal-weeks": weeks.length,
          opacity: layoutReady ? 1 : 0,
          flex: isJune ? undefined : "47 1 0%"
        } as CSSProperties}
        className={cn(
          "tm-porra-calendar tm-porra-calendar--fullbleed flex min-h-0 flex-col p-0",
          isJune ? "flex-1" : "tm-porra-calendar--july-view tm-porra-calendar--auto-rows"
        )}
      >
        <div className="tm-cal-header relative flex shrink-0 items-center justify-center gap-2 px-2 py-1 sm:px-3">
          <button
            className={cn(
              "p-1 text-[var(--tm-muted)] hover:text-[var(--tm-fg)] transition-colors",
              isJune && "invisible pointer-events-none"
            )}
            onClick={() => setCurrentMonthView({ year: 2026, month: 6 })}
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <h2 className="tm-cal-month-title text-center font-display font-semibold uppercase tracking-wide text-[var(--tm-fg)]">
            {monthLabel}
          </h2>
          <button
            className={cn(
              "p-1 text-[var(--tm-muted)] hover:text-[var(--tm-fg)] transition-colors",
              !isJune && "invisible pointer-events-none"
            )}
            onClick={() => setCurrentMonthView({ year: 2026, month: 7 })}
          >
            <ChevronRight className="h-6 w-6" />
          </button>
          
          {currentProfileAlias?.toLowerCase() === "hector" && (
            <button
              className="absolute right-4 top-1/2 -translate-y-1/2 rounded border border-[var(--tm-muted)] px-2 py-0.5 text-[0.65rem] font-bold text-[var(--tm-muted)] hover:border-[var(--tm-fg)] hover:text-[var(--tm-fg)] transition-colors"
              onClick={() => {
                if (isJune) {
                  setCurrentMonthView({ year: 2026, month: 7 });
                }
                setManualEggKey(k => k + 1);
              }}
            >
              EGG
            </button>
          )}
        </div>

        <div className="tm-cal-weekdays grid shrink-0 grid-cols-7">
          {WEEKDAY_LABELS.map((label, index) => (
            <div
              key={label}
              className="tm-cal-weekday text-center uppercase tracking-wide"
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
            openAllGroupsModal,
            openStatsModal,
            openSquadsModal,
            isJune
          )}
        </div>
      </section>

      {!isJune && (
        <div 
          className="relative flex min-h-0 flex-col overflow-hidden tm-july-knockout-wrap"
          style={{ flex: "53 1 0%" }}
        >
          <KnockoutBracket
            poolId={poolId}
            matches={localMatches}
            currentProfileId={currentProfileId}
            onOpenMatch={setActiveMatch}
            withEasterEggs={!isJune}
            manualEggKey={manualEggKey}
          />
        </div>
      )}

      {allGroupsOpen && (
        <AllGroupsStandingsModal
          open
          stackElevated={allGroupsStackElevated}
          onClose={() => {
            setAllGroupsOpen(false);
            setAllGroupsDataAccessBack(null);
            setAllGroupsStackElevated(false);
          }}
          onBack={
            allGroupsDataAccessBack
              ? () => {
                  setAllGroupsOpen(false);
                  allGroupsDataAccessBack();
                  setAllGroupsDataAccessBack(null);
                }
              : undefined
          }
          officialGroups={groupStandingsDetail}
          predictedGroups={groupStandingsPredicted}
          onSelectGroup={(code) => {
            setAllGroupsOpen(false);
            setAllGroupsDataAccessBack(null);
            setActiveGroupCode(code);
          }}
        />
      )}

      {statsOpen && (
        <TournamentStatsModal
          open
          stackElevated={statsStackElevated}
          onClose={() => {
            setStatsOpen(false);
            setStatsDataAccessBack(null);
            setStatsStackElevated(false);
          }}
          onBack={
            statsDataAccessBack
              ? () => {
                  setStatsOpen(false);
                  statsDataAccessBack();
                  setStatsDataAccessBack(null);
                }
              : undefined
          }
          matches={matches}
        />
      )}

      {squadsOpen && (
        <AllTeamsLineupModal
          open
          stackElevated={squadsStackElevated}
          onClose={() => {
            setSquadsOpen(false);
            setSquadsDataAccessBack(null);
            setSquadsStackElevated(false);
          }}
          onBack={
            squadsDataAccessBack
              ? () => {
                  setSquadsOpen(false);
                  squadsDataAccessBack();
                  setSquadsDataAccessBack(null);
                }
              : undefined
          }
        />
      )}

      {activeGroupCode && (
        <GroupStandingsModal
          open
          onClose={() => setActiveGroupCode(null)}
          groupCode={activeGroupCode}
          groups={groupStandingsDetail}
          predictedGroups={groupStandingsPredicted}
          onGroupChange={setActiveGroupCode}
        />
      )}

      {activeMatch && (
        <QuickPredictionModal
          open
          opaque
          onClose={() => setActiveMatch(null)}
          poolId={poolId}
          match={activeMatch}
          matches={localMatches}
          currentProfileId={currentProfileId}
          isAdminUser={isAdminUser}
          onMatchChange={setActiveMatch}
          onMvpSaved={(matchId, playerName, teamName, shirtNumber) => {
            const patch = (current: MatchWithPrediction) =>
              patchMatchMvpPrediction(current, playerName, teamName, shirtNumber);

            setLocalMatchState((current) =>
              current.source !== matches
                ? current
                : {
                    source: current.source,
                    items: current.items.map((item) =>
                      item.id === matchId ? patch(item) : item
                    ),
                  }
            );
            setActiveMatch((current) =>
              current?.id === matchId ? patch(current) : current
            );
          }}
        />
      )}
    </div>
  );
}
