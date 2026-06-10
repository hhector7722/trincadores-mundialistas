"use client";

import { useEffect, useState } from "react";
import { fetchPlayerDetailAction } from "@/actions/lineup";
import type { PlayerDetail } from "@/lib/lineup/player-detail";
import { LoadingCenter } from "@/components/ui/spinner";
import { teamNameEs } from "@/lib/teams/display";
import { cn } from "@/lib/utils";

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

function StatItem({ label, value, className }: { label: string; value: string; className?: string }) {
  if (value.trim() === "") return null;

  return (
    <div
      className={cn(
        "flex min-w-0 flex-col gap-0.5 rounded-lg bg-[rgba(111,43,255,0.12)] px-2.5 py-2",
        className
      )}
    >
      <dt className="text-[9px] uppercase tracking-wide text-white/60">{label}</dt>
      <dd className="truncate font-display text-sm font-semibold leading-tight text-white">
        {value}
      </dd>
    </div>
  );
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

  const displayTeam = teamNameEs(teamName);

  return (
    <div className="flex flex-col gap-3 px-3 py-3">
      <p className="text-center text-[11px] font-medium text-white/75">{displayTeam}</p>

      <dl className="grid grid-cols-2 gap-2">
        <StatItem label="Dorsal" value={statValue(detail.shirtNumber)} />
        <StatItem label="Posición" value={statValue(detail.position)} />
        <StatItem label="Club" value={statValue(detail.club)} className="col-span-2" />
        <StatItem label="Goles en Mundiales" value={statValue(detail.worldCupGoals)} />
        <StatItem label="Estado" value={statValue(detail.status)} />
      </dl>

      {awards.length > 0 ? (
        <p className="rounded-lg bg-[rgba(212,255,0,0.08)] px-2.5 py-2 text-center text-[10px] font-semibold text-[var(--tm-accent)]">
          {awards.join(" · ")}
        </p>
      ) : null}

      <p className="text-center text-[7px] leading-snug text-[var(--tm-muted)]">
        Datos históricos de convocatorias y registros de Mundiales anteriores.
      </p>
    </div>
  );
}
