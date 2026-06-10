"use client";

import type { ReactNode } from "react";
import { TeamFlagBadge } from "@/components/predictions/TeamFlagBadge";
import { teamNameEs } from "@/lib/teams/display";
import type { EntityModalView } from "@/components/lineup/entity-modal-types";

export type MvpModalFormations = {
  awayFormation?: string;
  homeFormation?: string;
};

export function entityModalTitleContent(
  view: EntityModalView,
  mvpFormations?: MvpModalFormations
): ReactNode {
  switch (view.kind) {
    case "lineup":
      return (
        <span className="flex min-w-0 flex-1 items-center gap-2">
          <TeamFlagBadge name={view.teamName} size="xs" />
          <span className="truncate">{teamNameEs(view.teamName)}</span>
        </span>
      );
    case "player":
      return view.playerName;
    case "mvp":
      return (
        <span className="flex min-w-0 flex-1 items-center gap-1 truncate text-xs normal-case tracking-normal">
          <TeamFlagBadge name={view.awayTeam} size="xs" />
          <span className="truncate">{teamNameEs(view.awayTeam)}</span>
          {mvpFormations?.awayFormation ? (
            <span className="shrink-0 text-[10px] font-semibold text-[var(--tm-muted)]">
              {mvpFormations.awayFormation}
            </span>
          ) : null}
          <span aria-hidden className="shrink-0 text-[var(--tm-muted)]">
            ·
          </span>
          <TeamFlagBadge name={view.homeTeam} size="xs" />
          <span className="truncate">{teamNameEs(view.homeTeam)}</span>
          {mvpFormations?.homeFormation ? (
            <span className="shrink-0 text-[10px] font-semibold text-[var(--tm-muted)]">
              {mvpFormations.homeFormation}
            </span>
          ) : null}
        </span>
      );
    default:
      return "Detalle";
  }
}
