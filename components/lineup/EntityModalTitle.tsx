"use client";

import type { ReactNode } from "react";
import { ConfirmedLineupCheckIcon } from "@/components/lineup/ConfirmedLineupCheckIcon";
import { TeamFlagBadge } from "@/components/predictions/TeamFlagBadge";
import type { EntityModalView } from "@/components/lineup/entity-modal-types";
import { teamNameEs } from "@/lib/teams/display";

export type MvpModalFormations = {
  awayFormation?: string;
  homeFormation?: string;
};

export type EntityModalTitleOptions = {
  mvpFormations?: MvpModalFormations;
  lineupFormation?: string;
  possibleLineupsTitle?: string;
  possibleLineupsConfirmed?: boolean;
};

export function entityModalTitleContent(
  view: EntityModalView,
  options?: EntityModalTitleOptions
): ReactNode {
  switch (view.kind) {
    case "lineup":
      return (
        <span className="flex min-w-0 flex-1 items-center gap-2">
          <TeamFlagBadge name={view.teamName} size="xs" />
          <span className="truncate">
            {teamNameEs(view.teamName)}
            {options?.lineupFormation ? (
              <>
                <span className="text-[var(--tm-muted)]"> · </span>
                <span className="text-[var(--tm-fg)]">{options.lineupFormation}</span>
              </>
            ) : null}
          </span>
        </span>
      );
    case "player":
      return (
        <span className="flex min-w-0 flex-1 items-center justify-center gap-2">
          <TeamFlagBadge name={view.teamName} size="xxs" loading="eager" />
          <span className="truncate font-display text-sm uppercase tracking-wide">
            {view.playerName}
          </span>
        </span>
      );
    case "mvp":
      return "MVP";
    case "possible-lineups":
      return (
        <span className="inline-flex min-w-0 items-center gap-1.5">
          <span className="truncate">
            {options?.possibleLineupsTitle ?? "POSIBLES ALINEACIONES"}
          </span>
          {options?.possibleLineupsConfirmed ? <ConfirmedLineupCheckIcon /> : null}
        </span>
      );
    default:
      return "Detalle";
  }
}
