"use client";

import { useEffect, useState } from "react";
import { fetchTeamSquadAction } from "@/actions/lineup";
import { BenchPlayersStrip } from "@/components/lineup/BenchPlayersStrip";
import { TeamLineupGraphic } from "@/components/lineup/TeamLineupGraphic";
import { getBenchPlayers } from "@/lib/lineup/bench-players";
import { buildProbableXI } from "@/lib/lineup/build-probable-xi";
import { LineupFieldGate } from "@/components/lineup/LineupFieldGate";
import { teamNameEs } from "@/lib/teams/display";
import type { TeamSquadWithPlayers } from "@/lib/worldcup-data/squad-queries";
import { LoadingCenter } from "@/components/ui/spinner";

type LineupModalPanelProps = {
  teamName: string;
  onPlayerClick: (playerName: string) => void;
  selectionMode?: "navigate" | "pick";
  playerFilter?: (position: string | null) => boolean;
  selectionBlockedMessage?: string;
};

export function LineupModalPanel({
  teamName,
  onPlayerClick,
  selectionMode = "navigate",
  playerFilter,
  selectionBlockedMessage,
}: LineupModalPanelProps) {
  const [squad, setSquad] = useState<TeamSquadWithPlayers | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setSquad(null);

    fetchTeamSquadAction(teamName).then((result) => {
      if (cancelled) return;
      if (!result.ok) {
        setError(result.error);
        setSquad(null);
      } else {
        setSquad(result.data);
      }
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [teamName]);

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

  const lineup = buildProbableXI(squad.players);
  const bench = getBenchPlayers(squad, lineup);

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
              slots={lineup.slots}
              formation={lineup.formation}
              teamName={teamName}
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

            <p className="mt-4 max-w-lg self-center text-center text-[9px] leading-snug text-[var(--tm-muted)]">
              Once probable a partir de la convocatoria oficial FIFA 2026. Formación orientativa.
            </p>
          </div>
        )}
      </LineupFieldGate>
    </div>
  );
}
