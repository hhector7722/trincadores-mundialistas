"use client";

import { useEffect, useState } from "react";
import { fetchResolvedTeamLineupAction, fetchTeamSquadAction } from "@/actions/lineup";
import { BenchPlayersStrip } from "@/components/lineup/BenchPlayersStrip";
import { TeamLineupGraphic } from "@/components/lineup/TeamLineupGraphic";
import { LineupSourceBadge } from "@/components/lineup/LineupSourceBadge";
import { resolveBenchPlayers } from "@/lib/lineup/bench-from-lineup";
import { buildFallbackLineup } from "@/lib/lineup/build-fallback-lineup";
import type { ResolvedLineup } from "@/lib/lineup/types";
import { LineupFieldGate } from "@/components/lineup/LineupFieldGate";
import { teamNameEs } from "@/lib/teams/display";
import type { TeamSquadWithPlayers } from "@/lib/worldcup-data/squad-queries";
import { LoadingCenter } from "@/components/ui/spinner";

type LineupModalPanelProps = {
  teamName: string;
  matchId?: string;
  onPlayerClick: (playerName: string) => void;
  selectionMode?: "navigate" | "pick";
  playerFilter?: (position: string | null) => boolean;
  selectionBlockedMessage?: string;
};

export function LineupModalPanel({
  teamName,
  matchId,
  onPlayerClick,
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

    Promise.all([
      fetchTeamSquadAction(teamName),
      fetchResolvedTeamLineupAction(teamName, { matchId }),
    ]).then(([squadResult, lineupResult]) => {
      if (cancelled) return;
      if (!squadResult.ok) {
        setError(squadResult.error);
        setSquad(null);
        setLineup(null);
      } else {
        setSquad(squadResult.data);
        if (lineupResult.ok) {
          setLineup(lineupResult.data);
        } else {
          setLineup(
            squadResult.data
              ? buildFallbackLineup(squadResult.data.players)
              : buildFallbackLineup([])
          );
        }
      }
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [teamName, matchId]);

  const displayName = teamNameEs(teamName);

  if (loading) {
    return <LoadingCenter label="Cargando plantilla…" />;
  }

  if (error) {
    return (
      <div className="px-4 py-6">
        <p className="text-center text-sm text-[var(--tm-danger)]" role="alert">
          {error}
        </p>
      </div>
    );
  }

  if (!squad || squad.players.length === 0) {
    return (
      <div className="px-4 py-8 text-center">
        <p className="text-sm text-[var(--tm-muted)]">
          No hay plantilla disponible para {displayName}.
        </p>
      </div>
    );
  }

  const resolvedLineup = lineup ?? buildFallbackLineup(squad.players);
  const bench = resolveBenchPlayers(squad, resolvedLineup);

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
    <div className="flex min-h-0 flex-1 flex-col">
      {selectionMode === "pick" && selectionBlockedMessage ? (
        <p className="shrink-0 border-b border-[var(--tm-border)] px-3 py-2 text-center text-[10px] text-[var(--tm-muted)]">
          {selectionBlockedMessage}
        </p>
      ) : null}
      <LineupFieldGate className="flex min-h-0 flex-1 flex-col">
        {(markFieldReady) => (
          <div className="flex min-h-0 flex-1 flex-col items-center overflow-y-auto px-1.5 py-3 sm:px-2">
            <TeamLineupGraphic
              slots={resolvedLineup.slots}
              formationLabel={resolvedLineup.formationLabel}
              teamName={teamName}
              squadPlayerNames={squad.players.map((player) => player.player_name)}
              size="modal"
              onPlayerClick={handlePlayerInteraction}
              onFieldReady={markFieldReady}
            />

            {bench.length > 0 ? (
              <BenchPlayersStrip
                teamName={teamName}
                players={bench}
                showTeamHeader={false}
                position="none"
                className="mt-4"
                onPlayerClick={(player) => handlePlayerInteraction(player.name)}
              />
            ) : null}

            <div className="mt-4 max-w-lg self-center px-2">
              <LineupSourceBadge
                sourceKind={resolvedLineup.sourceKind}
                formationLabel={resolvedLineup.formationLabel}
                fetchedAt={resolvedLineup.fetchedAt}
              />
            </div>
          </div>
        )}
      </LineupFieldGate>
    </div>
  );
}
