"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { GOAL_SCORER_TEXT_CLASS, goalScorerTextStyle } from "@/lib/ui/goal-scorer-style";
import { TeamFlagBadge } from "@/components/predictions/TeamFlagBadge";
import { MatchPredictionsBoardMvpLabel } from "@/components/predictions/MatchPredictionsBoardMvpLabel";
import { buildBoardGoalScorerLines, extractGoalScorersByTeam } from "@/lib/live/goal-scorers";
import type { MatchPlayerIncident } from "@/lib/live/types";
import { mvpTeamsMatch } from "@/lib/predictions/mvp-name-match";
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
  const homeScorerLines = buildBoardGoalScorerLines(goalScorers.home);
  const awayScorerLines = buildBoardGoalScorerLines(goalScorers.away);
  const officialMvpSide =
    officialMvpPlayerName?.trim() && officialMvpTeamName?.trim()
      ? mvpTeamsMatch(officialMvpTeamName, homeTeam)
        ? "home"
        : mvpTeamsMatch(officialMvpTeamName, awayTeam)
          ? "away"
          : null
      : null;

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
        {homeScorerLines.map((line, index) => (
          <span
            key={`home-scorer-${index}`}
            className={cn(GOAL_SCORER_TEXT_CLASS, "max-w-full whitespace-nowrap text-left")}
            style={goalScorerTextStyle}
          >
            {line}
          </span>
        ))}
        {officialMvpSide === "home" ? (
          <MatchPredictionsBoardMvpLabel
            variant="header"
            align="left"
            playerName={officialMvpPlayerName}
            playerIncidents={playerIncidents}
          />
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
        {awayScorerLines.map((line, index) => (
          <span
            key={`away-scorer-${index}`}
            className={cn(GOAL_SCORER_TEXT_CLASS, "max-w-full whitespace-nowrap text-right")}
            style={goalScorerTextStyle}
          >
            {line}
          </span>
        ))}
        {officialMvpSide === "away" ? (
          <MatchPredictionsBoardMvpLabel
            variant="header"
            align="right"
            playerName={officialMvpPlayerName}
            playerIncidents={playerIncidents}
          />
        ) : null}
      </div>
    </div>
  );
}
