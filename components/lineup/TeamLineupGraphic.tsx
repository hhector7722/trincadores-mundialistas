"use client";

import React, { type ReactNode } from "react";
import { TacticalVerticalField } from "@/components/lineup/TacticalVerticalField";
import { LineupModalFieldShell } from "@/components/lineup/LineupModalFieldShell";
import type { LineupSlot, ResolvedLineup } from "@/lib/lineup/types";
import { cn } from "@/lib/utils";
import { LineupFormationInfo } from "@/components/lineup/LineupFormationInfo";

type TeamLineupGraphicProps = {
  slots: LineupSlot[];
  teamName: string;
  className?: string;
  benchAbove?: ReactNode;
  size?: "default" | "modal";
  onPlayerClick?: (playerName: string) => void;
  onFieldReady?: () => void;
  squadPlayers?: { player_name: string; sticker_url?: string | null }[];
  widthPx?: number;
  heightPx?: number;
  chipScale?: number;
};

export function TeamLineupGraphic({
  slots,
  teamName,
  className,
  benchAbove,
  size = "default",
  onPlayerClick,
  onFieldReady,
  squadPlayers,
  widthPx,
  heightPx,
  chipScale = 1,
}: TeamLineupGraphicProps) {
  const isModal = size === "modal";

  // Re-build a ResolvedLineup mock for the TacticalVerticalField
  // since it requires a ResolvedLineup
  const resolvedLineup = {
    slots: slots,
    formationLabel: "",
    formation: "4-4-2",
    benchCount: 0,
    isProbable: false,
  } as ResolvedLineup;

  const fieldContent = (
    <TacticalVerticalField
      className="w-full h-full"
      homeLineup={resolvedLineup}
      awayLineup={null}
      homeTeam={teamName}
      awayTeam=""
      homeSquadPlayerNames={squadPlayers?.map(p => p.player_name)}
      awaySquadPlayerNames={[]}
    />
  );

  if (isModal) {
    return (
      <LineupModalFieldShell className={className} benchAbove={benchAbove}>
        <div className="relative w-full aspect-[68/52.5] overflow-hidden">
          <div className="absolute bottom-0 left-0 w-full h-[200%]">
            {fieldContent}
          </div>
        </div>
      </LineupModalFieldShell>
    );
  }

  return (
    <div className={cn("relative mx-auto flex w-full max-w-[500px] flex-col items-center pb-2", className)}>
      <div className="relative w-full aspect-[68/52.5] overflow-hidden rounded-[20px] shadow-sm border border-white/10">
        <div className="absolute bottom-0 left-0 w-full h-[200%]">
          {fieldContent}
        </div>
      </div>
    </div>
  );
}
