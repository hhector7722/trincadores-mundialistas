"use client";

import { useEffect, useState } from "react";
import { fetchTeamLineupBundleAction } from "@/actions/lineup";
import { ProbableXI } from "@/components/lineup/ProbableXI";
import type { FormationId, ResolvedLineup } from "@/lib/lineup/types";
import type { TeamSquadWithPlayers } from "@/lib/worldcup-data/squad-queries";
import { Loader2 } from "lucide-react";

type AsyncTeamLineupProps = {
  teamName: string;
  teamSlug: string;
  year?: number;
  formation?: FormationId;
};

export function AsyncTeamLineup({ teamName, teamSlug, year, formation }: AsyncTeamLineupProps) {
  const [squad, setSquad] = useState<TeamSquadWithPlayers | null>(null);
  const [lineup, setLineup] = useState<ResolvedLineup | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchTeamLineupBundleAction(teamName, { formation }).then((res) => {
      if (cancelled) return;
      if (res.ok) {
        setSquad(res.data.squad);
        setLineup(res.data.lineup);
      } else {
        setError(res.error);
      }
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [teamName, formation]);

  if (loading) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center py-20 text-[var(--tm-muted)]">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="mt-4 text-sm font-medium">Cargando alineación...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-8 text-center text-red-500">
        <p className="font-semibold">Error al cargar</p>
        <p className="mt-2 text-sm">{error}</p>
      </div>
    );
  }

  return (
    <ProbableXI
      squad={squad}
      teamName={teamName}
      teamSlug={teamSlug}
      lineup={lineup}
      year={year}
      formation={formation}
      backHref="/predictions"
    />
  );
}
