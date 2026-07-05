"use client";

import { LineupPlayerChip } from "@/components/lineup/LineupPlayerChip";
import { normalizePositionRole, positionLabelEs } from "@/lib/lineup/position-map";
import { mvpSelectionKey, mvpPlayersMatch, type MvpSelectablePlayer } from "@/lib/lineup/mvp-selection-key";
import type { BenchPlayer } from "@/lib/lineup/bench-players";
import { cn } from "@/lib/utils";
import type { BenchLayoutConfig } from "@/lib/lineup/tactical-modal-layout";
import type { SubstitutionMarkers } from "@/lib/live/types";

type MvpBenchColumnProps = {
  teamName: string;
  players: BenchPlayer[];
  onPlayerClick: (player: BenchPlayer) => void;
  selectedKey?: string | null;
  selectedPlayer?: (MvpSelectablePlayer & { teamName: string }) | null;
  disabled?: boolean;
  readOnly?: boolean;
  align?: "left" | "right";
  gridLayout?: BenchLayoutConfig;
  substitutionMarkers?: SubstitutionMarkers | null;
  className?: string;
};

export function MvpBenchColumn({
  teamName,
  players,
  onPlayerClick,
  selectedKey = null,
  selectedPlayer = null,
  disabled,
  readOnly = false,
  className,
}: MvpBenchColumnProps) {
  if (players.length === 0) return null;

  return (
    <div className={cn("grid grid-cols-4 gap-x-2 gap-y-3 w-full justify-items-center max-h-[50dvh] pr-1", className)} data-modal-scroll="true">
      {players.map((player) => {
        const key = mvpSelectionKey(teamName, player);
        const active = selectedPlayer
          ? mvpPlayersMatch(teamName, player, selectedPlayer)
          : selectedKey === key;
        const role = normalizePositionRole(player.position);

        return (
          <LineupPlayerChip
            key={key}
            slot={{
              key: player.name,
              name: player.name,
              shirtNumber: player.shirtNumber,
              role,
              positionLabel: positionLabelEs(role, player.position),
              isPlaceholder: false,
              x: 0,
              y: 0
            }}
            teamName={teamName}
            variant="modal"
            selected={active}
            disabled={disabled}
            onClick={!readOnly ? () => onPlayerClick(player) : undefined}
          />
        );
      })}
    </div>
  );
}

