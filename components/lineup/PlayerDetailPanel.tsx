"use client";

import { useEffect, useState } from "react";
import { fetchPlayerDetailAction } from "@/actions/lineup";
import type { PlayerDetail } from "@/lib/lineup/player-detail";
import { teamFlagCode, teamFlagUrl } from "@/lib/teams/flags";
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

function StatItem({ label, value }: { label: string; value: string }) {
  if (value.trim() === "") return null;

  return (
    <div className="min-w-0">
      <dt className="text-[8px] uppercase tracking-wide text-white/65">{label}</dt>
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

  const flagCode = teamFlagCode(teamName);
  const displayTeam = teamNameEs(teamName);

  return (
    <div className="flex flex-col items-center px-2 pb-1.5 pt-1">
      <div className="relative w-full max-w-[11.5rem] shrink-0">
        <div
          className={cn(
            "relative aspect-square w-full overflow-hidden rounded-2xl border border-[var(--tm-border)]",
            "bg-[rgba(111,43,255,0.12)] shadow-[var(--tm-shadow-soft)]"
          )}
        >
          {flagCode ? (
            <img
              src={teamFlagUrl(flagCode, 240)}
              alt=""
              width={184}
              height={184}
              className="h-full w-full object-cover"
              loading="eager"
              decoding="async"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center font-display text-2xl text-[var(--tm-accent)]">
              {teamName.slice(0, 2).toUpperCase()}
            </div>
          )}

          <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#1a0a38]/95 via-[#2a1058]/75 to-transparent px-2.5 pb-2 pt-10">
            <p className="mb-1 truncate text-center text-[10px] font-medium text-white/80">
              {displayTeam}
            </p>
            <dl className="grid grid-cols-2 gap-x-2 gap-y-1.5">
              <StatItem label="Dorsal" value={statValue(detail.shirtNumber)} />
              <StatItem label="Posición" value={statValue(detail.position)} />
              <div className="col-span-2">
                <StatItem label="Club" value={statValue(detail.club)} />
              </div>
              <StatItem label="Goles en Mundiales" value={statValue(detail.worldCupGoals)} />
              <StatItem label="Estado" value={statValue(detail.status)} />
            </dl>
            {awards.length > 0 ? (
              <p className="mt-1.5 truncate text-center text-[9px] font-semibold text-[var(--tm-accent)]">
                {awards.join(" · ")}
              </p>
            ) : null}
          </div>
        </div>
      </div>

      <p className="mt-1.5 whitespace-nowrap text-center text-[7px] leading-none tracking-tight text-[var(--tm-muted)]">
        Datos históricos de convocatorias y registros de Mundiales anteriores.
      </p>
    </div>
  );
}
