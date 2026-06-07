"use client";

import { useEffect, useState } from "react";
import { fetchTeamSquadAction } from "@/actions/lineup";
import { TeamFlagBadge } from "@/components/predictions/TeamFlagBadge";
import { TeamLineupGraphic } from "@/components/lineup/TeamLineupGraphic";
import { getBenchPlayers } from "@/lib/lineup/bench-players";
import { buildProbableXI } from "@/lib/lineup/build-probable-xi";
import { teamNameEs } from "@/lib/teams/display";
import type { TeamSquadWithPlayers } from "@/lib/worldcup-data/squad-queries";
import { cn } from "@/lib/utils";

type LineupModalPanelProps = {
  teamName: string;
  onPlayerClick: (playerName: string) => void;
};

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
    return (
      <div className="flex min-h-40 items-center justify-center px-4 py-8">
        <p className="text-sm text-[var(--tm-muted)]">Cargando plantilla…</p>
      </div>
    );
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
      <div className="shrink-0 border-b border-[var(--tm-border)] px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <TeamFlagBadge name={teamName} size="md" />
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--tm-accent)]">
                Once probable
              </p>
              <h3 className="truncate font-display text-lg font-bold text-[var(--tm-fg)]">
                {displayName}
              </h3>
              <p className="text-xs text-[var(--tm-muted)]">
                {squad.team_code ?? teamName.slice(0, 3).toUpperCase()}
                {squad.year ? ` · Mundial ${squad.year}` : ""}
              </p>
            </div>
          </div>
          <div className="shrink-0 rounded-lg border border-[var(--tm-border)] bg-black/25 px-2 py-1 text-center">
            <p className="text-[9px] font-semibold uppercase tracking-wider text-[var(--tm-muted)]">
              Sistema
            </p>
            <p className="font-display text-sm font-bold text-[var(--tm-accent)]">
              {lineup.formation}
            </p>
          </div>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-3 py-4">
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
            <ul className="space-y-1">
              {bench.map((player) => (
                <li key={player.key}>
                  <button
                    type="button"
                    onClick={() => onPlayerClick(player.name)}
                    className={cn(
                      "flex w-full min-h-12 items-center gap-3 rounded-xl border border-[var(--tm-border)]",
                      "bg-[rgba(111,43,255,0.08)] px-3 py-2 text-left transition-colors",
                      "hover:bg-[rgba(111,43,255,0.16)] active:bg-[rgba(111,43,255,0.22)]"
                    )}
                  >
                    <span className="font-display w-8 shrink-0 text-center text-sm font-bold text-[var(--tm-accent)]">
                      {player.shirtNumber ?? "—"}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm font-medium text-[var(--tm-fg)]">
                      {player.name}
                    </span>
                    <span className="shrink-0 text-[10px] uppercase tracking-wide text-[var(--tm-muted)]">
                      {player.position ?? " "}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <p className="mt-4 max-w-lg self-center text-center text-[11px] text-[var(--tm-muted)]">
          Once probable a partir de la convocatoria oficial FIFA 2026. Formación orientativa.
        </p>
      </div>
    </div>
  );
}
