"use client";

import { useEffect, useState } from "react";
import { fetchTeamSquadAction } from "@/actions/lineup";
import { TeamLineupGraphic } from "@/components/lineup/TeamLineupGraphic";
import { getBenchPlayers } from "@/lib/lineup/bench-players";
import { buildProbableXI } from "@/lib/lineup/build-probable-xi";
import { teamNameEs } from "@/lib/teams/display";
import type { TeamSquadWithPlayers } from "@/lib/worldcup-data/squad-queries";
import { LoadingCenter } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

type LineupModalPanelProps = {
  teamName: string;
  onPlayerClick: (playerName: string) => void;
};

function formatBenchLabel(shirtNumber: number | null, name: string): string {
  return `${shirtNumber ?? "—"} ${name}`;
}

export function LineupModalPanel({ teamName, onPlayerClick }: LineupModalPanelProps) {
  const [squad, setSquad] = useState<TeamSquadWithPlayers | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

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

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex min-h-0 flex-1 flex-col items-center overflow-y-auto px-3 py-4">
        <TeamLineupGraphic
          slots={lineup.slots}
          formation={lineup.formation}
          onPlayerClick={onPlayerClick}
        />

        {bench.length > 0 ? (
          <section className="mt-4 w-full max-w-lg self-center">
            <h4 className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--tm-muted)]">
              Reservas ({bench.length})
            </h4>
            <p className="text-sm leading-relaxed text-[var(--tm-fg)]">
              {bench.map((player, index) => (
                <span key={player.key}>
                  {index > 0 ? ", " : null}
                  <button
                    type="button"
                    onClick={() => onPlayerClick(player.name)}
                    className={cn(
                      "inline text-left transition-colors",
                      "hover:text-[var(--tm-accent)] active:text-[var(--tm-accent)]"
                    )}
                  >
                    {formatBenchLabel(player.shirtNumber, player.name)}
                  </button>
                </span>
              ))}
            </p>
          </section>
        ) : null}

        <p className="mt-4 max-w-lg self-center text-center text-[11px] text-[var(--tm-muted)]">
          Once probable a partir de la convocatoria oficial FIFA 2026. Formación orientativa.
        </p>
      </div>
    </div>
  );
}
