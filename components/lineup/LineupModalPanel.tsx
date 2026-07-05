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
    <div className="flex flex-col flex-1 h-full">
      {selectionMode === "pick" && selectionBlockedMessage ? (
        <p className="shrink-0 border-b border-[var(--tm-border)] px-3 py-1.5 text-center text-[10px] text-[var(--tm-muted)]">
          {selectionBlockedMessage}
        </p>
      ) : null}
      <LineupFieldGate className="flex flex-col flex-1">
        {(markFieldReady) => (
          <div className="flex w-full flex-col flex-1 pt-0.5 pb-2.5">
            <TeamLineupGraphic
              slots={formationSlots}
              teamName={teamName}
              squadPlayers={squad.players}
              size="modal"
              onPlayerClick={handlePlayerInteraction}
              onFieldReady={markFieldReady}
              benchAbove={
                bench.length > 0 ? (
                  <BenchPlayersStrip
                    teamName={teamName}
                    players={bench}
                    density="inline"
                    showTeamHeader={false}
                    position="none"
                    gridLayout={benchLayout}
                    onPlayerClick={(player) => handlePlayerInteraction(player.name)}
                  />
                ) : null
              }
            />
          </div>
        )}
      </LineupFieldGate>
    </div>
  );
}
