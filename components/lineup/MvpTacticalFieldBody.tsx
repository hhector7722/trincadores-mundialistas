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
        ...homeSlots,
        ...awaySlots,
      ]),
    [layout, homeSlots, awaySlots]
  );

  const pickDisabled = interactive && disabled;

  return (
    <div
      className={cn(
        "mx-auto flex w-full min-w-0 shrink-0 flex-col",
        className
      )}
    >
      {homeBench.length > 0 || resolvedHomeLineup?.formationLabel ? (
        <div className="w-full shrink-0 pb-0.5">
          <LineupFormationInfo
            teamName={homeTeam}
            formationLabel={resolvedHomeLineup?.formationLabel}
            align="left"
          />
          {homeBench.length > 0 ? (
            <MvpBenchColumn
              teamName={homeTeam}
              players={homeBench}
              selectedKey={selectedKey}
              selectedPlayer={selectedPlayer}
              disabled={pickDisabled}
              align="left"
              gridLayout={layout.homeBench}
              readOnly={!interactive}
              onPlayerClick={
                interactive && onSelect
                  ? (player) => onSelect(mvpSelectionKey(homeTeam, player))
                  : () => {}
              }
            />
          ) : null}
        </div>
      ) : null}

      <div className="flex shrink-0 items-center justify-center pb-1">
        <MvpHorizontalFieldGraphic
          homeSlots={homeSlots}
          awaySlots={awaySlots}
          homeTeam={homeTeam}
          awayTeam={awayTeam}
          homeSquadPlayerNames={homeSquad?.players.map((player) => player.player_name)}
          awaySquadPlayerNames={awaySquad?.players.map((player) => player.player_name)}
          selectedKey={interactive ? selectedKey : null}
          selectedPlayer={interactive ? selectedPlayer : null}
          disabled={pickDisabled}
          readOnly={!interactive}
          onSelect={onSelect ?? (() => {})}
          widthPx={layout.fieldWidthPx}
          heightPx={layout.fieldHeightPx}
          chipScale={chipScale}
        />
      </div>

      {awayBench.length > 0 || resolvedAwayLineup?.formationLabel ? (
        <div className="w-full shrink-0 pt-0.5 pb-1">
          <LineupFormationInfo
            teamName={awayTeam}
            formationLabel={resolvedAwayLineup?.formationLabel}
            align="right"
          />
          {awayBench.length > 0 ? (
            <MvpBenchColumn
              teamName={awayTeam}
              players={awayBench}
              selectedKey={selectedKey}
              selectedPlayer={selectedPlayer}
              disabled={pickDisabled}
              align="right"
              gridLayout={layout.awayBench}
              readOnly={!interactive}
              onPlayerClick={
                interactive && onSelect
                  ? (player) => onSelect(mvpSelectionKey(awayTeam, player))
                  : () => {}
              }
            />
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
