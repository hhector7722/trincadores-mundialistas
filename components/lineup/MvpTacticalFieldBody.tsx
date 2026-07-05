"use client";

import { useState, useMemo } from "react";
import { TacticalVerticalField } from "@/components/lineup/TacticalVerticalField";
import { MvpBenchColumn } from "@/components/lineup/MvpBenchColumn";
import { LineupFormationInfo } from "@/components/lineup/LineupFormationInfo";
import { Modal } from "@/components/ui/modal";
import { TeamFlagBadge } from "@/components/predictions/TeamFlagBadge";
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
        >
          {/* Overlays Absolutos */}
          <div className="absolute inset-0 pointer-events-none flex flex-col justify-between">
            {/* Top Overlay */}
            <div className="w-full shrink-0 pt-0.5 pointer-events-auto">
              <LineupFormationInfo
                teamName={awayTeam}
                formationLabel={resolvedAwayLineup?.formationLabel}
                align="right"
              />
              {awayBench.length > 0 && (
                <div className="flex justify-center mt-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowAwayBench(true)}
                    className="flex items-center justify-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-5 py-2 font-display text-xs font-bold uppercase tracking-wider text-[var(--tm-accent)] backdrop-blur-sm transition-all hover:bg-white/10 hover:border-white/20 active:scale-95"
                  >
                    Suplentes
                  </button>
                </div>
              )}
            </div>

            {/* Bottom Overlay */}
            <div className="w-full shrink-0 pb-0.5 pointer-events-auto">
              {homeBench.length > 0 && (
                <div className="flex justify-center mb-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowHomeBench(true)}
                    className="flex items-center justify-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-5 py-2 font-display text-xs font-bold uppercase tracking-wider text-[var(--tm-accent)] backdrop-blur-sm transition-all hover:bg-white/10 hover:border-white/20 active:scale-95"
                  >
                    Suplentes
                  </button>
                </div>
              )}
              <LineupFormationInfo
                teamName={homeTeam}
                formationLabel={resolvedHomeLineup?.formationLabel}
                align="left"
              />
            </div>
          </div>
        </TacticalVerticalField>
      </div>

      {/* Home Bench Modal */}
      {showHomeBench && (
        <Modal
          open={showHomeBench}
          onClose={() => setShowHomeBench(false)}
          title={
            <span className="flex items-center gap-2">
              <TeamFlagBadge name={homeTeam} size="xs" />
              <span>Suplentes — {homeTeam}</span>
            </span>
          }
          opaque
          stackElevated
          containerClassName="p-4"
          className="max-w-sm max-h-[75dvh]"
        >
          <div className="overflow-y-auto w-full pb-4">
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
        </Modal>
      )}

      {/* Away Bench Modal */}
      {showAwayBench && (
        <Modal
          open={showAwayBench}
          onClose={() => setShowAwayBench(false)}
          title={
            <span className="flex items-center gap-2">
              <TeamFlagBadge name={awayTeam} size="xs" />
              <span>Suplentes — {awayTeam}</span>
            </span>
          }
          opaque
          stackElevated
          containerClassName="p-4"
          className="max-w-sm max-h-[75dvh]"
        >
          <div className="overflow-y-auto w-full pb-4">
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
        </Modal>
      )}
    </div>
  );
}

