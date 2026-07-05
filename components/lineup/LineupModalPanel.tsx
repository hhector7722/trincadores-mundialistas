"use client";

import { useEffect, useState } from "react";
import { fetchTeamLineupBundleAction } from "@/actions/lineup";
import { BenchPlayersStrip } from "@/components/lineup/BenchPlayersStrip";
import { TeamLineupGraphic } from "@/components/lineup/TeamLineupGraphic";
import { resolveBenchPlayers } from "@/lib/lineup/bench-from-lineup";
import { buildFallbackLineup } from "@/lib/lineup/build-fallback-lineup";
import { LINEUP_MODAL_FIELD_WIDTH_PX } from "@/lib/lineup/field-asset";
import { estimateMvpInlineBenchLayout } from "@/lib/lineup/tactical-modal-layout";
import { resolveVisualLineupSlots } from "@/lib/lineup/visual-lineup-slots";
import type { ResolvedLineup } from "@/lib/lineup/types";
import { FootballPitchSurface } from "@/components/lineup/FootballPitchSurface";
import { LineupFieldGate } from "@/components/lineup/LineupFieldGate";
import { LineupModalFieldShell } from "@/components/lineup/LineupModalFieldShell";
import { teamNameEs } from "@/lib/teams/display";
import type { TeamSquadWithPlayers } from "@/lib/worldcup-data/squad-queries";
import { LoadingCenter } from "@/components/ui/spinner";
import { Modal } from "@/components/ui/modal";
import { TeamFlagBadge } from "@/components/predictions/TeamFlagBadge";
import { LineupPlayerChip } from "@/components/lineup/LineupPlayerChip";
import { normalizePositionRole, positionLabelEs } from "@/lib/lineup/position-map";

type LineupModalPanelProps = {
  teamName: string;
  matchId?: string;
  onPlayerClick: (playerName: string) => void;
  onFormationResolved?: (formationLabel: string) => void;
  selectionMode?: "navigate" | "pick";
  playerFilter?: (position: string | null) => boolean;
  selectionBlockedMessage?: string;
};

export function LineupModalPanel({
  teamName,
  matchId,
  onPlayerClick,
  onFormationResolved,
  selectionMode = "navigate",
  playerFilter,
  selectionBlockedMessage,
}: LineupModalPanelProps) {
  const [squad, setSquad] = useState<TeamSquadWithPlayers | null>(null);
  const [lineup, setLineup] = useState<ResolvedLineup | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showBenchModal, setShowBenchModal] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setSquad(null);
    setLineup(null);

    fetchTeamLineupBundleAction(teamName, { matchId }).then((result) => {
      if (cancelled) return;
      if (!result.ok) {
        setError(result.error);
        setSquad(null);
        setLineup(null);
      } else {
        setSquad(result.data.squad);
        setLineup(result.data.lineup);
      }
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [teamName, matchId]);

  const displayName = teamNameEs(teamName);

  useEffect(() => {
    if (loading || !squad?.players.length) return;
    const resolved = lineup ?? buildFallbackLineup(squad.players);
    onFormationResolved?.(resolved.formationLabel);
  }, [loading, squad, lineup, onFormationResolved, teamName]);

  if (loading) {
    return (
      <div className="flex w-full flex-col pt-0.5 pb-2.5">
        <LineupModalFieldShell>
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <FootballPitchSurface />
          </div>
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-[var(--tm-shell-bg-hex)]/40">
            <LoadingCenter label="Cargando plantilla…" minHeightClassName="min-h-0" />
          </div>
        </LineupModalFieldShell>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-4 py-4">
        <p className="text-center text-sm text-[var(--tm-danger)]" role="alert">
          {error}
        </p>
      </div>
    );
  }

  if (!squad || squad.players.length === 0) {
    return (
      <div className="px-4 py-6 text-center">
        <p className="text-sm text-[var(--tm-muted)]">
          No hay plantilla disponible para {displayName}.
        </p>
      </div>
    );
  }

  const resolvedLineup = lineup ?? buildFallbackLineup(squad.players);
  const formationSlots = resolveVisualLineupSlots(resolvedLineup);
  const bench = resolveBenchPlayers(squad, resolvedLineup);
  const benchLayout = estimateMvpInlineBenchLayout(bench.length, LINEUP_MODAL_FIELD_WIDTH_PX);

  function handlePlayerInteraction(playerName: string) {
    if (selectionMode === "pick" && playerFilter && squad) {
      const player = squad.players.find((p) => p.player_name === playerName);
      if (!playerFilter(player?.position ?? null)) {
        return;
      }
    }
    onPlayerClick(playerName);
  }

  return (
    <div className="flex flex-col w-full h-auto">
      {selectionMode === "pick" && selectionBlockedMessage ? (
        <p className="shrink-0 border-b border-[var(--tm-border)] px-3 py-1.5 text-center text-[10px] text-[var(--tm-muted)]">
          {selectionBlockedMessage}
        </p>
      ) : null}
      <LineupFieldGate className="flex flex-col w-full">
        {(markFieldReady) => (
          <div className="flex w-full flex-col pt-0.5 pb-1">
            <TeamLineupGraphic
              slots={formationSlots}
              teamName={teamName}
              squadPlayers={squad.players}
              size="modal"
              onPlayerClick={handlePlayerInteraction}
              onFieldReady={markFieldReady}
              benchAbove={null}
            />
            {bench.length > 0 && (
              <div className="flex justify-center mt-2 mb-1 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowBenchModal(true)}
                  className="flex items-center justify-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-5 py-2 font-display text-xs font-bold uppercase tracking-wider text-[var(--tm-accent)] backdrop-blur-sm transition-all hover:bg-white/10 hover:border-white/20 active:scale-95"
                >
                  Suplentes
                </button>
              </div>
            )}
          </div>
        )}
      </LineupFieldGate>

      {/* Bench Modal */}
      {showBenchModal && (
        <Modal
          open={showBenchModal}
          onClose={() => setShowBenchModal(false)}
          title={
            <span className="flex items-center gap-2">
              <TeamFlagBadge name={teamName} size="xs" />
              <span>Suplentes — {displayName}</span>
            </span>
          }
          opaque
          stackElevated
          containerClassName="p-4"
          className="max-w-sm max-h-[75dvh]"
        >
          <div className="p-4 flex flex-col items-center">
            <div className="grid grid-cols-4 gap-x-2 gap-y-3 w-full justify-items-center max-h-[50dvh] overflow-y-auto pr-1" data-modal-scroll="true">
              {bench.map((player) => {
                const role = normalizePositionRole(player.position);
                return (
                  <LineupPlayerChip
                    key={player.name}
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
                    onClick={() => {
                      handlePlayerInteraction(player.name);
                      setShowBenchModal(false);
                    }}
                  />
                );
              })}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
