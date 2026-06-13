"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { GOAL_SCORER_TEXT_CLASS } from "@/components/live/MatchGoalScorersList";
import { TeamFlagBadge } from "@/components/predictions/TeamFlagBadge";
import { buildBoardGoalScorerLines, extractGoalScorersByTeam } from "@/lib/live/goal-scorers";
import type { MatchPlayerIncident } from "@/lib/live/types";
import { teamNameEs } from "@/lib/teams/display";
import { cn } from "@/lib/utils";

type MatchPredictionsBoardHeaderTitleProps = {
  homeTeam: string;
  awayTeam: string;
  homeGoals: number | null;
  awayGoals: number | null;
  playerIncidents?: MatchPlayerIncident[];
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

/** Cabecera del modal: fila fija de equipos + filas de goleadores que empujan la tabla. */
export function MatchPredictionsBoardHeaderTitle({
  homeTeam,
  awayTeam,
  homeGoals,
  awayGoals,
  playerIncidents = [],
  className,
}: MatchPredictionsBoardHeaderTitleProps) {
  const teamsRowRef = useRef<HTMLDivElement>(null);
  const [nameFontPx, setNameFontPx] = useState(MAX_NAME_FONT_PX);

  const homeName = teamNameEs(homeTeam);
  const awayName = teamNameEs(awayTeam);
  const goalScorers = extractGoalScorersByTeam(playerIncidents);
  const homeScorerLines = buildBoardGoalScorerLines(goalScorers.home);
  const awayScorerLines = buildBoardGoalScorerLines(goalScorers.away);
  const hasScorers = homeScorerLines.length > 0 || awayScorerLines.length > 0;

  useLayoutEffect(() => {
    const row = teamsRowRef.current;
    if (!row) return;

    const fitTeamNameSizes = () => {
      const nameNodes = row.querySelectorAll<HTMLElement>("[data-team-name]");
      let size = MAX_NAME_FONT_PX;

      while (size >= MIN_NAME_FONT_PX) {
        nameNodes.forEach((node) => {
          node.style.fontSize = `${size}px`;
        });
        const nameOverflows = Array.from(nameNodes).some(
          (node) => node.scrollWidth > node.clientWidth,
        );
        if (!nameOverflows && row.scrollWidth <= row.clientWidth) break;
        size -= 0.5;
      }

      setNameFontPx(size);
    };

    fitTeamNameSizes();

    const observer = new ResizeObserver(fitTeamNameSizes);
    observer.observe(row);
    return () => observer.disconnect();
  }, [homeName, awayName, homeGoals, awayGoals]);

  return (
    <div className={cn("flex w-full min-w-0 flex-col gap-0.5", className)}>
      <div
        ref={teamsRowRef}
        className="grid w-full min-w-0 grid-cols-[1fr_auto_1fr] items-center overflow-hidden"
      >
        <div className="flex min-w-0 justify-end pr-0.5">
          <div className="inline-grid grid-cols-[auto_auto_auto] items-center gap-x-1">
            <TeamFlagBadge
              name={homeTeam}
              size="xxs"
              loading="eager"
              className="col-start-1 row-start-1 shrink-0"
            />
            <span
              data-team-name
              className="col-start-2 row-start-1 min-w-0 truncate font-semibold leading-none"
              style={{ fontSize: `${nameFontPx}px` }}
            >
              {homeName}
            </span>
            <span className="col-start-3 row-start-1 shrink-0 font-display text-sm font-semibold tabular-nums leading-none">
              {formatGoal(homeGoals)}
            </span>
          </div>
        </div>

        <span className="shrink-0 px-0.5 text-xs leading-none text-[var(--tm-muted)]">-</span>

        <div className="flex min-w-0 justify-start pl-0.5">
          <div className="inline-grid grid-cols-[auto_auto_auto] items-center gap-x-1">
            <span className="col-start-1 row-start-1 shrink-0 font-display text-sm font-semibold tabular-nums leading-none">
              {formatGoal(awayGoals)}
            </span>
            <span
              data-team-name
              className="col-start-2 row-start-1 min-w-0 truncate font-semibold leading-none"
              style={{ fontSize: `${nameFontPx}px` }}
            >
              {awayName}
            </span>
            <TeamFlagBadge
              name={awayTeam}
              size="xxs"
              loading="eager"
              className="col-start-3 row-start-1 shrink-0"
            />
          </div>
        </div>
      </div>

      {hasScorers ? (
        <div className="grid w-full min-w-0 grid-cols-[1fr_auto_1fr] items-start">
          <div className="flex min-w-0 justify-end pr-0.5">
            <div className="inline-grid grid-cols-[auto_auto_auto] gap-x-1 gap-y-px">
              <TeamFlagBadge
                name={homeTeam}
                size="xxs"
                loading="eager"
                aria-hidden
                className="pointer-events-none col-start-1 row-start-1 shrink-0 opacity-0"
              />
              {homeScorerLines.map((line, index) => (
                <span
                  key={`home-scorer-${index}`}
                  className={cn(
                    GOAL_SCORER_TEXT_CLASS,
                    "col-start-2 justify-self-start whitespace-nowrap text-left",
                  )}
                  style={{ gridRow: index + 2 }}
                >
                  {line}
                </span>
              ))}
            </div>
          </div>

          <span aria-hidden className="shrink-0 px-0.5 opacity-0">
            -
          </span>

          <div className="flex min-w-0 justify-start pl-0.5">
            <div className="inline-grid grid-cols-[auto_auto_auto] gap-x-1 gap-y-px">
              {awayScorerLines.map((line, index) => (
                <span
                  key={`away-scorer-${index}`}
                  className={cn(
                    GOAL_SCORER_TEXT_CLASS,
                    "col-start-2 justify-self-end whitespace-nowrap text-right",
                  )}
                  style={{ gridRow: index + 2 }}
                >
                  {line}
                </span>
              ))}
              <TeamFlagBadge
                name={awayTeam}
                size="xxs"
                loading="eager"
                aria-hidden
                className="pointer-events-none col-start-3 row-start-1 shrink-0 opacity-0"
              />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
