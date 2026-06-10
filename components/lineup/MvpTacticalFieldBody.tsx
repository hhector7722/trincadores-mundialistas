"use client";

import { useMemo } from "react";
import { MvpHorizontalFieldGraphic } from "@/components/lineup/MvpHorizontalFieldGraphic";
import { MvpBenchColumn } from "@/components/lineup/MvpBenchColumn";
import { LineupFormationInfo } from "@/components/lineup/LineupFormationInfo";
import { computeMvpFieldChipScale } from "@/lib/lineup/mvp-field-chip-scale";
import type { FitMvpHorizontalLayout } from "@/lib/lineup/fit-mvp-horizontal-layout";
import type { MvpHorizontalSlot } from "@/lib/lineup/mvp-horizontal-geometry";
import {
  mvpSelectionKey,
  type MvpSelectablePlayer,
} from "@/lib/lineup/mvp-selection-key";
import type { BenchPlayer } from "@/lib/lineup/bench-players";
import type { ResolvedLineup } from "@/lib/lineup/types";
import type { TeamSquadWithPlayers } from "@/lib/worldcup-data/squad-queries";
import { cn } from "@/lib/utils";

type MvpTacticalFieldBodyProps = {
  awayTeam: string;
  homeTeam: string;
  awaySlots: MvpHorizontalSlot[];
  homeSlots: MvpHorizontalSlot[];
  awayBench: BenchPlayer[];
  homeBench: BenchPlayer[];
  resolvedAwayLineup: ResolvedLineup | null;
  resolvedHomeLineup: ResolvedLineup | null;
  awaySquad: TeamSquadWithPlayers | null;
  homeSquad: TeamSquadWithPlayers | null;
  layout: FitMvpHorizontalLayout;
  interactive?: boolean;
  selectedKey?: string | null;
  selectedPlayer?: (MvpSelectablePlayer & { teamName: string }) | null;
  disabled?: boolean;
  onSelect?: (key: string) => void;
  className?: string;
};

export function MvpTacticalFieldBody({
  awayTeam,
  homeTeam,
  awaySlots,
  homeSlots,
  awayBench,
  homeBench,
  resolvedAwayLineup,
  resolvedHomeLineup,
  awaySquad,
  homeSquad,
  layout,
  interactive = false,
  selectedKey = null,
  selectedPlayer = null,
  disabled = false,
  onSelect,
  className,
}: MvpTacticalFieldBodyProps) {
  const chipScale = useMemo(
    () =>
      computeMvpFieldChipScale(layout.fieldWidthPx, layout.fieldHeightPx, [
        ...awaySlots,
        ...homeSlots,
      ]),
    [layout, awaySlots, homeSlots]
  );

  const pickDisabled = !interactive || disabled;

  return (
    <div
      className={cn(
        "mx-auto flex min-h-0 w-full min-w-0 flex-1 flex-col overflow-hidden",
        className
      )}
    >
      {awayBench.length > 0 || resolvedAwayLineup?.formationLabel ? (
        <div className="w-full shrink-0 pb-0.5">
          <LineupFormationInfo
            teamName={awayTeam}
            formationLabel={resolvedAwayLineup?.formationLabel}
            align="left"
          />
          {awayBench.length > 0 ? (
            <MvpBenchColumn
              teamName={awayTeam}
              players={awayBench}
              selectedKey={selectedKey}
              selectedPlayer={selectedPlayer}
              disabled={pickDisabled}
              align="left"
              gridLayout={layout.awayBench}
              onPlayerClick={
                interactive && onSelect
                  ? (player) => onSelect(mvpSelectionKey(awayTeam, player))
                  : () => {}
              }
            />
          ) : null}
        </div>
      ) : null}

      <div className="flex min-h-0 flex-1 items-center justify-center overflow-hidden pb-1">
        <MvpHorizontalFieldGraphic
          awaySlots={awaySlots}
          homeSlots={homeSlots}
          awayTeam={awayTeam}
          homeTeam={homeTeam}
          awaySquadPlayerNames={awaySquad?.players.map((player) => player.player_name)}
          homeSquadPlayerNames={homeSquad?.players.map((player) => player.player_name)}
          selectedKey={interactive ? selectedKey : null}
          selectedPlayer={interactive ? selectedPlayer : null}
          disabled={pickDisabled}
          onSelect={onSelect ?? (() => {})}
          widthPx={layout.fieldWidthPx}
          heightPx={layout.fieldHeightPx}
          chipScale={chipScale}
        />
      </div>

      {homeBench.length > 0 || resolvedHomeLineup?.formationLabel ? (
        <div className="w-full shrink-0 pt-0.5 pb-1">
          <LineupFormationInfo
            teamName={homeTeam}
            formationLabel={resolvedHomeLineup?.formationLabel}
            align="right"
          />
          {homeBench.length > 0 ? (
            <MvpBenchColumn
              teamName={homeTeam}
              players={homeBench}
              selectedKey={selectedKey}
              selectedPlayer={selectedPlayer}
              disabled={pickDisabled}
              align="right"
              gridLayout={layout.homeBench}
              onPlayerClick={
                interactive && onSelect
                  ? (player) => onSelect(mvpSelectionKey(homeTeam, player))
                  : () => {}
              }
            />
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
