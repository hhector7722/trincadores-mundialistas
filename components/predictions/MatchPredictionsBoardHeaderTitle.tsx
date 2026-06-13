"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { MatchGoalScorersList } from "@/components/live/MatchGoalScorersList";
import { TeamFlagBadge } from "@/components/predictions/TeamFlagBadge";
import { extractGoalScorersByTeam } from "@/lib/live/goal-scorers";
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

/** Cabecera del modal: mitad local | «-» centrado | mitad visitante. */
export function MatchPredictionsBoardHeaderTitle({
  homeTeam,
  awayTeam,
  homeGoals,
  awayGoals,
  playerIncidents = [],
  className,
}: MatchPredictionsBoardHeaderTitleProps) {
  const rowRef = useRef<HTMLDivElement>(null);
  const [nameFontPx, setNameFontPx] = useState(MAX_NAME_FONT_PX);

  const homeName = teamNameEs(homeTeam);
  const awayName = teamNameEs(awayTeam);
  const goalScorers = extractGoalScorersByTeam(playerIncidents);

  useLayoutEffect(() => {
    const row = rowRef.current;
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
    <div
      ref={rowRef}
      className={cn(
        "grid w-full min-w-0 grid-cols-[1fr_auto_1fr] items-center overflow-hidden",
        className,
      )}
    >
      <div className="flex min-w-0 flex-col items-end gap-0.5 overflow-hidden pr-0.5">
        <div className="flex min-w-0 items-center justify-end gap-1 overflow-hidden whitespace-nowrap">
          <TeamFlagBadge name={homeTeam} size="xxs" loading="eager" className="shrink-0" />
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
        <MatchGoalScorersList
          goals={goalScorers.home}
          align="left"
          tone="muted"
          className="max-w-none self-start"
        />
      </div>
      <span className="shrink-0 px-0.5 text-xs leading-none text-[var(--tm-muted)]">-</span>
      <div className="flex min-w-0 flex-col items-start gap-0.5 overflow-hidden pl-0.5">
        <div className="flex min-w-0 items-center justify-start gap-1 overflow-hidden whitespace-nowrap">
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
          <TeamFlagBadge name={awayTeam} size="xxs" loading="eager" className="shrink-0" />
        </div>
        <MatchGoalScorersList
          goals={goalScorers.away}
          align="right"
          tone="muted"
          className="max-w-none self-end"
        />
      </div>
    </div>
  );
}
