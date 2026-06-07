"use client";

import { useEffect, useState } from "react";
import { fetchPlayerDetailAction } from "@/actions/lineup";
import { TeamFlagBadge } from "@/components/predictions/TeamFlagBadge";
import type { PlayerDetail } from "@/lib/lineup/player-detail";
import { LoadingCenter } from "@/components/ui/spinner";
import { teamNameEs } from "@/lib/teams/display";

type PlayerDetailPanelProps = {
  teamName: string;
  playerName: string;
};

function statValue(value: number | string | null | undefined): string {
  if (value === null || value === undefined) return " ";
  if (typeof value === "number" && value === 0) return " ";
  if (value === "") return " ";
  return String(value);
}

export function PlayerDetailPanel({ teamName, playerName }: PlayerDetailPanelProps) {
  const [detail, setDetail] = useState<PlayerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchPlayerDetailAction(teamName, playerName).then((result) => {
      if (cancelled) return;
      if (!result.ok) {
        setError(result.error);
        setDetail(null);
      } else {
        setDetail(result.data);
      }
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [teamName, playerName]);

  if (loading) {
    return <LoadingCenter label="Cargando jugador…" />;
  }

  if (error || !detail) {
    return (
      <div className="px-4 py-6">
        <p className="text-center text-sm text-[var(--tm-danger)]" role="alert">
          {error ?? "No se encontró información del jugador."}
        </p>
      </div>
    );
  }

  const awards: string[] = [];
  if (detail.goldenBoot) awards.push("Bota de Oro");
  if (detail.bestYoungPlayer) awards.push("Mejor joven");

  return (
    <div className="space-y-4 px-4 py-4">
      <div className="flex items-center gap-3">
        <TeamFlagBadge name={teamName} size="md" />
        <div className="min-w-0">
          <h3 className="truncate font-display text-lg font-bold text-[var(--tm-fg)]">
            {detail.playerName}
          </h3>
          <p className="text-sm text-[var(--tm-muted)]">{teamNameEs(teamName)}</p>
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-3 rounded-xl border border-[var(--tm-border)] bg-[rgba(111,43,255,0.08)] p-3">
        <div>
          <dt className="text-[10px] uppercase tracking-wide text-[var(--tm-muted)]">Dorsal</dt>
          <dd className="font-display text-base text-[var(--tm-fg)]">
            {statValue(detail.shirtNumber)}
          </dd>
        </div>
        <div>
          <dt className="text-[10px] uppercase tracking-wide text-[var(--tm-muted)]">Posición</dt>
          <dd className="text-sm text-[var(--tm-fg)]">{statValue(detail.position)}</dd>
        </div>
        <div className="col-span-2">
          <dt className="text-[10px] uppercase tracking-wide text-[var(--tm-muted)]">Club</dt>
          <dd className="truncate text-sm text-[var(--tm-fg)]">{statValue(detail.club)}</dd>
        </div>
        <div>
          <dt className="text-[10px] uppercase tracking-wide text-[var(--tm-muted)]">
            Goles en Mundiales
          </dt>
          <dd className="font-display text-base text-[var(--tm-fg)]">
            {statValue(detail.worldCupGoals)}
          </dd>
        </div>
        <div>
          <dt className="text-[10px] uppercase tracking-wide text-[var(--tm-muted)]">Estado</dt>
          <dd className="text-sm text-[var(--tm-fg)]">{statValue(detail.status)}</dd>
        </div>
      </dl>

      {awards.length > 0 ? (
        <div className="rounded-xl border border-[var(--tm-accent)]/30 bg-[rgba(212,255,0,0.08)] p-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--tm-accent)]">
            Palmarés en Mundiales
          </p>
          <ul className="mt-2 space-y-1">
            {awards.map((award) => (
              <li key={award} className="text-sm text-[var(--tm-fg)]">
                {award}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <p className="text-center text-[11px] text-[var(--tm-muted)]">
        Datos históricos de convocatorias y registros de Mundiales anteriores.
      </p>
    </div>
  );
}
