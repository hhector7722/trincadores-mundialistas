"use client";

import { useState, useMemo } from "react";
import { TacticalVerticalField } from "@/components/lineup/TacticalVerticalField";
import { MvpBenchColumn } from "@/components/lineup/MvpBenchColumn";
import { LineupFormationInfo } from "@/components/lineup/LineupFormationInfo";
import { Modal } from "@/components/ui/modal";
import { TeamFlagBadge } from "@/components/matches/TeamFlagBadge";
import { X } from "lucide-react";
import type { FitMvpHorizontalLayout } from "@/lib/lineup/tactical-modal-layout";
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
  const [showHomeBench, setShowHomeBench] = useState(false);
  const [showAwayBench, setShowAwayBench] = useState(false);

  const pickDisabled = interactive && disabled;

  return (
    <div
      className={cn(
        "mx-auto flex w-full flex-1 h-full min-w-0 shrink-0 flex-col",
        className
      )}
    >
      <div className="relative flex w-full h-full min-h-0 items-center justify-center">
        <TacticalVerticalField
          className="w-full h-full"
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
          onAwayBenchClick={() => setShowAwayBench(true)}
          onHomeBenchClick={() => setShowHomeBench(true)}
          awayBenchCount={awayBench.length}
          homeBenchCount={homeBench.length}
        >
          {/* Overlays Absolutos */}
          <div className="absolute inset-0 pointer-events-none flex flex-col justify-between">
            {/* Top Overlay */}
            <div className="w-full shrink-0 pt-0.5 pointer-events-auto">
              <LineupFormationInfo
                teamName={awayTeam}
                formationLabel={resolvedAwayLineup?.formationLabel}
                align="left"
              />
            </div>

            {/* Bottom Overlay */}
            <div className="w-full shrink-0 pb-0.5 pointer-events-auto">
              <LineupFormationInfo
                teamName={homeTeam}
                formationLabel={resolvedHomeLineup?.formationLabel}
                align="left"
              />
            </div>

            {/* Home Bench Overlay (Opens in Away's top half) */}
            {showHomeBench && (
              <div className="absolute top-0 left-0 right-0 h-1/2 bg-black/60 backdrop-blur-md z-30 p-3 flex flex-col pointer-events-auto border-b border-white/20">
                <div className="flex items-center justify-between mb-3 shrink-0">
                  <div className="flex items-center gap-2">
                    <TeamFlagBadge name={homeTeam} size="xs" />
                    <span className="font-display font-bold uppercase text-white/90 tracking-wide text-sm">Suplentes — {homeTeam}</span>
                  </div>
                  <button onClick={() => setShowHomeBench(false)} className="text-white/60 hover:text-white p-1 rounded-full transition-colors bg-white/10 hover:bg-white/20">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="overflow-y-auto flex-1 w-full scale-[0.85] origin-top">
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
                        ? (player) => {
                            onSelect(mvpSelectionKey(homeTeam, player));
                            setShowHomeBench(false);
                          }
                        : () => {}
                    }
                  />
                </div>
              </div>
            )}

            {/* Away Bench Overlay (Opens in Home's bottom half) */}
            {showAwayBench && (
              <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-black/60 backdrop-blur-md z-30 p-3 flex flex-col pointer-events-auto border-t border-white/20">
                <div className="flex items-center justify-between mb-3 shrink-0">
                  <div className="flex items-center gap-2">
                    <TeamFlagBadge name={awayTeam} size="xs" />
                    <span className="font-display font-bold uppercase text-white/90 tracking-wide text-sm">Suplentes — {awayTeam}</span>
                  </div>
                  <button onClick={() => setShowAwayBench(false)} className="text-white/60 hover:text-white p-1 rounded-full transition-colors bg-white/10 hover:bg-white/20">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="overflow-y-auto flex-1 w-full scale-[0.85] origin-top">
                  <MvpBenchColumn
                    teamName={awayTeam}
                    players={awayBench}
                    substitutionMarkers={awaySubstitutionMarkers}
                    selectedKey={selectedKey}
                    selectedPlayer={selectedPlayer}
                    disabled={pickDisabled}
                    align="left"
                    gridLayout={layout.awayBench}
                    readOnly={!interactive}
                    onPlayerClick={
                      interactive && onSelect
                        ? (player) => {
                            onSelect(mvpSelectionKey(awayTeam, player));
                            setShowAwayBench(false);
                          }
                        : () => {}
                    }
                  />
                </div>
              </div>
            )}
          </div>
        </TacticalVerticalField>
      </div>
    </div>
  );
}

