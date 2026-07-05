"use client";

import { useMemo } from "react";
import { TacticalVerticalField } from "@/components/lineup/TacticalVerticalField";
import { MvpBenchColumn } from "@/components/lineup/MvpBenchColumn";
import { LineupFormationInfo } from "@/components/lineup/LineupFormationInfo";
import type { FitMvpHorizontalLayout } from "@/lib/lineup/fit-mvp-horizontal-layout";
import {
  mvpSelectionKey,
  type MvpSelectablePlayer,
} from "@/lib/lineup/mvp-selection-key";
import type { SubstitutionMarkers } from "@/lib/live/types";
import type { BenchPlayer } from "@/lib/lineup/bench-players";
import type { ResolvedLineup } from "@/lib/lineup/types";
import type { TeamSquadWithPlayers } from "@/lib/worldcup-data/squad-queries";
import { cn } from "@/lib/utils";

type MvpTacticalFieldBodyProps = {
  awayTeam: string;
  homeTeam: string;
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
  homeSubstitutionMarkers?: SubstitutionMarkers | null;
  awaySubstitutionMarkers?: SubstitutionMarkers | null;
};

export function MvpTacticalFieldBody({
  awayTeam,
  homeTeam,
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
  homeSubstitutionMarkers = null,
  awaySubstitutionMarkers = null,
}: MvpTacticalFieldBodyProps) {

  const pickDisabled = interactive && disabled;

  return (
    <div
      className={cn(
        "mx-auto flex w-full flex-1 h-full min-w-0 shrink-0 flex-col",
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
              substitutionMarkers={homeSubstitutionMarkers}
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
        <TacticalVerticalField
          homeLineup={resolvedHomeLineup}
          awayLineup={resolvedAwayLineup}
          homeTeam={homeTeam}
          awayTeam={awayTeam}
          homeSquadPlayerNames={homeSquad?.players.map((player) => player.player_name)}
          awaySquadPlayerNames={awaySquad?.players.map((player) => player.player_name)}
          selectedKey={interactive ? selectedKey : null}
          selectedPlayer={interactive ? selectedPlayer : null}
          disabled={pickDisabled}
          readOnly={!interactive}
          onSelect={onSelect ?? (() => {})}
          homeSubstitutionMarkers={homeSubstitutionMarkers}
          awaySubstitutionMarkers={awaySubstitutionMarkers}
          widthPx={layout.fieldWidthPx}
          heightPx={layout.fieldHeightPx}
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
              substitutionMarkers={awaySubstitutionMarkers}
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
