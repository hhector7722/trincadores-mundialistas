"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { GOAL_SCORER_TEXT_CLASS, goalScorerTextStyle } from "@/lib/ui/goal-scorer-style";
import { TeamFlagBadge } from "@/components/predictions/TeamFlagBadge";
import {
  extractGoalScorersByTeam,
  findGroupedGoalScorerForPlayer,
  formatGroupedGoalScorerLabel,
  goalScorerDisplayName,
  groupGoalScorersByPlayer,
  type GroupedGoalScorer,
} from "@/lib/live/goal-scorers";
import type { MatchPlayerIncident } from "@/lib/live/types";
import { mvpPlayerNamesMatch, mvpTeamsMatch } from "@/lib/predictions/mvp-name-match";
import { teamNameEs } from "@/lib/teams/display";
import { cn } from "@/lib/utils";

type MatchPredictionsBoardHeaderTitleProps = {
  homeTeam: string;
  awayTeam: string;
  homeGoals: number | null;
  awayGoals: number | null;
  playerIncidents?: MatchPlayerIncident[];
  officialMvpPlayerName?: string | null;
  officialMvpTeamName?: string | null;
  className?: string;
};

const MAX_NAME_FONT_PX = 12;
const MIN_NAME_FONT_PX = 8;

function formatGoal(value: number | null): string {
  if (value === null) return "—";
  return String(value);
}

function BoardHeaderGoalScorerLine({
  group,
  highlightMvpName,
  align,
}: {
  group: GroupedGoalScorer;
  highlightMvpName?: string | null;
  align: "left" | "right";
}) {
  const highlight =
    !!highlightMvpName?.trim() &&
    mvpPlayerNamesMatch(group.playerName, highlightMvpName);
  const name = goalScorerDisplayName(group.playerName);
  const minutesLabel = group.minutes.length
    ? ` ${group.minutes.map((minute) => `${minute}'`).join(" ")}`
    : "";

  return (
    <span
      className={cn(
        GOAL_SCORER_TEXT_CLASS,
        "max-w-full whitespace-nowrap",
        align === "left" ? "text-left" : "text-right",
      )}
      style={goalScorerTextStyle}
    >
      {highlight ? (
        <>
          <span className="text-[var(--tm-primary)]">{name}</span>
          {minutesLabel ? <span>{minutesLabel}</span> : null}
        </>
      ) : (
        formatGroupedGoalScorerLabel(group)
      )}
    </span>
  );
}

function BoardHeaderOfficialMvpLine({
  playerName,
  align,
}: {
  playerName: string;
  align: "left" | "right";
}) {
  return (
    <span
      className={cn(
        GOAL_SCORER_TEXT_CLASS,
        "max-w-full whitespace-nowrap text-[var(--tm-primary)]",
        align === "left" ? "text-left" : "text-right",
      )}
      style={goalScorerTextStyle}
    >
      {goalScorerDisplayName(playerName)}
    </span>
  );
}

export function matchPredictionsBoardAriaTitle(
  homeTeam: string,
  awayTeam: string,
  homeGoals: number | null,
  awayGoals: number | null,
): string {
  return `${teamNameEs(homeTeam)} ${formatGoal(homeGoals)} - ${formatGoal(awayGoals)} ${teamNameEs(awayTeam)}`;
}

/** Cabecera del modal: 3 columnas (local | «-» centrado | visitante). */
export function MatchPredictionsBoardHeaderTitle({
  homeTeam,
  awayTeam,
  homeGoals,
  awayGoals,
  playerIncidents = [],
  officialMvpPlayerName,
  officialMvpTeamName,
  className,
}: MatchPredictionsBoardHeaderTitleProps) {
  const headerRef = useRef<HTMLDivElement>(null);
  const [nameFontPx, setNameFontPx] = useState(MAX_NAME_FONT_PX);

  const homeName = teamNameEs(homeTeam);
  const awayName = teamNameEs(awayTeam);
  const goalScorers = extractGoalScorersByTeam(playerIncidents);
  const homeScorerGroups = groupGoalScorersByPlayer(goalScorers.home);
  const awayScorerGroups = groupGoalScorersByPlayer(goalScorers.away);
  const officialMvpSide =
    officialMvpPlayerName?.trim() && officialMvpTeamName?.trim()
      ? mvpTeamsMatch(officialMvpTeamName, homeTeam)
        ? "home"
        : mvpTeamsMatch(officialMvpTeamName, awayTeam)
          ? "away"
          : null
      : null;
  const officialMvpScored =
    !!officialMvpPlayerName?.trim() &&
    findGroupedGoalScorerForPlayer(officialMvpPlayerName, playerIncidents) != null;

  useLayoutEffect(() => {
    const header = headerRef.current;
    if (!header) return;

    const fitTeamNameSizes = () => {
      const nameNodes = header.querySelectorAll<HTMLElement>("[data-team-name]");
      let size = MAX_NAME_FONT_PX;

      while (size >= MIN_NAME_FONT_PX) {
        nameNodes.forEach((node) => {
          node.style.fontSize = `${size}px`;
        });
        const nameOverflows = Array.from(nameNodes).some(
          (node) => node.scrollWidth > node.clientWidth,
        );
        if (!nameOverflows && header.scrollWidth <= header.clientWidth) break;
        size -= 0.5;
      }

      setNameFontPx(size);
    };

    fitTeamNameSizes();

    const observer = new ResizeObserver(fitTeamNameSizes);
    observer.observe(header);
    return () => observer.disconnect();
  }, [homeName, awayName, homeGoals, awayGoals]);

  return (
    <div
      ref={headerRef}
      className={cn(
        "grid w-full min-w-0 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-start",
        className,
      )}
    >
      <div className="col-start-1 flex min-w-0 flex-col items-end gap-px pr-1">
        <div className="inline-flex max-w-full items-center gap-1 whitespace-nowrap">
          <TeamFlagBadge
            name={homeTeam}
            size="xxs"
            loading="eager"
            className="shrink-0"
          />
          <span
            data-team-name
            className="min-w-0 truncate font-semibold leading-none"
            style={{ fontSize: `${nameFontPx}px` }}
          >
            {homeName}
          </span>
          <span className="shrink-0 font-display text-sm font-semibold tabular-nums leading-none">
            {formatGoal(homeGoals)}
          </span>
        </div>
        {homeScorerGroups.map((group, index) => (
          <BoardHeaderGoalScorerLine
            key={`home-scorer-${index}`}
            group={group}
            highlightMvpName={officialMvpSide === "home" ? officialMvpPlayerName : null}
            align="left"
          />
        ))}
        {officialMvpSide === "home" && !officialMvpScored && officialMvpPlayerName ? (
          <BoardHeaderOfficialMvpLine playerName={officialMvpPlayerName} align="left" />
        ) : null}
      </div>

      <div className="col-start-2 row-start-1 flex shrink-0 items-center justify-center self-start px-1">
        <span className="text-xs leading-none text-[var(--tm-muted)]">-</span>
      </div>

      <div className="col-start-3 flex min-w-0 flex-col items-start gap-px pl-1">
        <div className="inline-flex max-w-full items-center gap-1 whitespace-nowrap">
          <span className="shrink-0 font-display text-sm font-semibold tabular-nums leading-none">
            {formatGoal(awayGoals)}
          </span>
          <span
            data-team-name
            className="min-w-0 truncate font-semibold leading-none"
            style={{ fontSize: `${nameFontPx}px` }}
          >
            {awayName}
          </span>
          <TeamFlagBadge
            name={awayTeam}
            size="xxs"
            loading="eager"
            className="shrink-0"
          />
        </div>
        {awayScorerGroups.map((group, index) => (
          <BoardHeaderGoalScorerLine
            key={`away-scorer-${index}`}
            group={group}
            highlightMvpName={officialMvpSide === "away" ? officialMvpPlayerName : null}
            align="right"
          />
        ))}
        {officialMvpSide === "away" && !officialMvpScored && officialMvpPlayerName ? (
          <BoardHeaderOfficialMvpLine playerName={officialMvpPlayerName} align="right" />
        ) : null}
      </div>
    </div>
  );
}
