"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { TeamFlagBadge } from "@/components/predictions/TeamFlagBadge";
import { teamNameEs } from "@/lib/teams/display";
import { cn } from "@/lib/utils";

type MatchPredictionsBoardHeaderTitleProps = {
  homeTeam: string;
  awayTeam: string;
  homeGoals: number | null;
  awayGoals: number | null;
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

/** Cabecera del modal: bandera · nombre · goles · goles · nombre · bandera (una sola fila). */
export function MatchPredictionsBoardHeaderTitle({
  homeTeam,
  awayTeam,
  homeGoals,
  awayGoals,
  className,
}: MatchPredictionsBoardHeaderTitleProps) {
  const rowRef = useRef<HTMLDivElement>(null);
  const [nameFontPx, setNameFontPx] = useState(MAX_NAME_FONT_PX);

  const homeName = teamNameEs(homeTeam);
  const awayName = teamNameEs(awayTeam);

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
        if (row.scrollWidth <= row.clientWidth) break;
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
        "flex w-full min-w-0 items-center justify-center gap-1 overflow-hidden whitespace-nowrap",
        className,
      )}
    >
      <TeamFlagBadge name={homeTeam} size="xxs" loading="eager" className="shrink-0" />
      <span
        data-team-name
        className="shrink-0 font-semibold leading-none"
        style={{ fontSize: `${nameFontPx}px` }}
      >
        {homeName}
      </span>
      <span className="shrink-0 font-display text-sm font-semibold tabular-nums leading-none">
        {formatGoal(homeGoals)}
      </span>
      <span className="shrink-0 text-xs leading-none text-[var(--tm-muted)]">-</span>
      <span className="shrink-0 font-display text-sm font-semibold tabular-nums leading-none">
        {formatGoal(awayGoals)}
      </span>
      <span
        data-team-name
        className="shrink-0 font-semibold leading-none"
        style={{ fontSize: `${nameFontPx}px` }}
      >
        {awayName}
      </span>
      <TeamFlagBadge name={awayTeam} size="xxs" loading="eager" className="shrink-0" />
    </div>
  );
}
