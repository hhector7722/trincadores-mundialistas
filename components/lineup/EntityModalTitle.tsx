"use client";

import type { ReactNode } from "react";
import { TeamFlagBadge } from "@/components/predictions/TeamFlagBadge";
import { teamNameEs } from "@/lib/teams/display";
import type { EntityModalView } from "@/components/lineup/entity-modal-types";

export function entityModalTitleContent(view: EntityModalView): ReactNode {
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
      return "MVP del partido";
    default:
      return "Detalle";
  }
}
