"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { submitTournamentOfficialAwards } from "@/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { TournamentOfficialAwards } from "@/lib/tournament-predictions/official-awards-queries";

type AdminTournamentAwardsFormProps = {
  poolId: string;
  initialAwards: TournamentOfficialAwards | null;
};

export function AdminTournamentAwardsForm({
  poolId,
  initialAwards,
}: AdminTournamentAwardsFormProps) {
  const router = useRouter();
  const [championTeam, setChampionTeam] = useState(initialAwards?.championTeam ?? "");
  const [finalistTeamA, setFinalistTeamA] = useState(initialAwards?.finalistTeamA ?? "");
  const [finalistTeamB, setFinalistTeamB] = useState(initialAwards?.finalistTeamB ?? "");
  const [topScorerPlayerName, setTopScorerPlayerName] = useState(
    initialAwards?.topScorerPlayerName ?? ""
  );
  const [topScorerTeamName, setTopScorerTeamName] = useState(
    initialAwards?.topScorerTeamName ?? ""
  );
  const [tournamentMvpPlayerName, setTournamentMvpPlayerName] = useState(
    initialAwards?.tournamentMvpPlayerName ?? ""
  );
  const [tournamentMvpTeamName, setTournamentMvpTeamName] = useState(
    initialAwards?.tournamentMvpTeamName ?? ""
  );
  const [goldenGlovePlayerName, setGoldenGlovePlayerName] = useState(
    initialAwards?.goldenGlovePlayerName ?? ""
  );
  const [goldenGloveTeamName, setGoldenGloveTeamName] = useState(
    initialAwards?.goldenGloveTeamName ?? ""
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await submitTournamentOfficialAwards(poolId, {
        championTeam: championTeam || null,
        finalistTeamA: finalistTeamA || null,
        finalistTeamB: finalistTeamB || null,
        topScorerPlayerName: topScorerPlayerName || null,
        topScorerTeamName: topScorerTeamName || null,
        tournamentMvpPlayerName: tournamentMvpPlayerName || null,
        tournamentMvpTeamName: tournamentMvpTeamName || null,
        goldenGlovePlayerName: goldenGlovePlayerName || null,
        goldenGloveTeamName: goldenGloveTeamName || null,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="grid gap-2 sm:grid-cols-2">
        <label className="space-y-1 sm:col-span-2">
          <span className="text-xs font-medium text-[var(--tm-muted)]">Campeón</span>
          <Input value={championTeam} onChange={(e) => setChampionTeam(e.target.value)} />
        </label>
        <label className="space-y-1">
          <span className="text-xs font-medium text-[var(--tm-muted)]">Finalista A</span>
          <Input value={finalistTeamA} onChange={(e) => setFinalistTeamA(e.target.value)} />
        </label>
        <label className="space-y-1">
          <span className="text-xs font-medium text-[var(--tm-muted)]">Finalista B</span>
          <Input value={finalistTeamB} onChange={(e) => setFinalistTeamB(e.target.value)} />
        </label>
        <label className="space-y-1">
          <span className="text-xs font-medium text-[var(--tm-muted)]">Pichichi (jugador)</span>
          <Input
            value={topScorerPlayerName}
            onChange={(e) => setTopScorerPlayerName(e.target.value)}
          />
        </label>
        <label className="space-y-1">
          <span className="text-xs font-medium text-[var(--tm-muted)]">Pichichi (equipo)</span>
          <Input value={topScorerTeamName} onChange={(e) => setTopScorerTeamName(e.target.value)} />
        </label>
        <label className="space-y-1">
          <span className="text-xs font-medium text-[var(--tm-muted)]">MVP torneo (jugador)</span>
          <Input
            value={tournamentMvpPlayerName}
            onChange={(e) => setTournamentMvpPlayerName(e.target.value)}
          />
        </label>
        <label className="space-y-1">
          <span className="text-xs font-medium text-[var(--tm-muted)]">MVP torneo (equipo)</span>
          <Input
            value={tournamentMvpTeamName}
            onChange={(e) => setTournamentMvpTeamName(e.target.value)}
          />
        </label>
        <label className="space-y-1">
          <span className="text-xs font-medium text-[var(--tm-muted)]">Guante de oro (jugador)</span>
          <Input
            value={goldenGlovePlayerName}
            onChange={(e) => setGoldenGlovePlayerName(e.target.value)}
          />
        </label>
        <label className="space-y-1">
          <span className="text-xs font-medium text-[var(--tm-muted)]">Guante de oro (equipo)</span>
          <Input
            value={goldenGloveTeamName}
            onChange={(e) => setGoldenGloveTeamName(e.target.value)}
          />
        </label>
      </div>
      {error ? (
        <p className="text-sm text-[var(--tm-danger)]" role="alert">
          {error}
        </p>
      ) : null}
      <Button type="submit" disabled={pending} className="min-h-12 w-full">
        {pending ? "Guardando…" : "Guardar galardones y recalcular"}
      </Button>
    </form>
  );
}
