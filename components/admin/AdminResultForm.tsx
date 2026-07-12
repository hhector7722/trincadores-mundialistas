"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { submitMatchResult, setMatchLive } from "@/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function AdminResultForm({
  poolId,
  matchId,
  label,
  status,
  groupCode,
  initialHomeGoals,
  initialAwayGoals,
  initialMvpPlayer,
  initialMvpTeam,
  initialPenaltyHome,
  initialPenaltyAway,
  initialAdvancingTeam,
}: {
  poolId: string;
  matchId: string;
  label: string;
  status?: string;
  groupCode?: string | null;
  initialHomeGoals?: number | null;
  initialAwayGoals?: number | null;
  initialMvpPlayer?: string | null;
  initialMvpTeam?: string | null;
  initialPenaltyHome?: number | null;
  initialPenaltyAway?: number | null;
  initialAdvancingTeam?: "home" | "away" | null;
}) {
  const router = useRouter();
  const [home, setHome] = useState(initialHomeGoals != null ? String(initialHomeGoals) : "0");
  const [away, setAway] = useState(initialAwayGoals != null ? String(initialAwayGoals) : "0");
  const [penaltyHome, setPenaltyHome] = useState(
    initialPenaltyHome != null ? String(initialPenaltyHome) : ""
  );
  const [penaltyAway, setPenaltyAway] = useState(
    initialPenaltyAway != null ? String(initialPenaltyAway) : ""
  );
  const [mvpPlayer, setMvpPlayer] = useState(initialMvpPlayer ?? "");
  const [mvpTeam, setMvpTeam] = useState(initialMvpTeam ?? "");
  const [advancingTeam, setAdvancingTeam] = useState<"home" | "away" | "">(
    initialAdvancingTeam ?? ""
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const isFinished = status === "finished";
  const isKnockout = !groupCode;

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const parsedPenaltyHome = penaltyHome.trim() !== "" ? Number(penaltyHome) : null;
      const parsedPenaltyAway = penaltyAway.trim() !== "" ? Number(penaltyAway) : null;

      const result = await submitMatchResult(
        poolId,
        matchId,
        Number(home),
        Number(away),
        mvpPlayer || null,
        mvpTeam || null,
        parsedPenaltyHome,
        parsedPenaltyAway,
        (advancingTeam || null) as "home" | "away" | null
      );
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  function onSetLive() {
    setError(null);
    startTransition(async () => {
      const result = await setMatchLive(poolId, matchId);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="space-y-2 border-b border-[var(--tm-border)] py-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-[var(--tm-fg)]">{label}</p>
        {!isFinished && (
          <Button
            type="button"
            variant="outline"
            onClick={onSetLive}
            disabled={pending}
            className={cn("h-7 text-xs", pending && "opacity-60")}
          >
            {pending ? "..." : "Marcar EN JUEGO"}
          </Button>
        )}
        {isFinished && (
          <span className="text-xs text-[var(--tm-muted)] italic">Finalizado — editar MVP/resultado</span>
        )}
      </div>
      <form onSubmit={onSubmit} className="space-y-2">
      <div className="flex gap-2">
        <Input
          type="number"
          min={0}
          max={20}
          value={home}
          onChange={(e) => setHome(e.target.value)}
          className="w-20"
          aria-label="Goles local"
        />
        <span className="self-center text-[var(--tm-muted)]">-</span>
        <Input
          type="number"
          min={0}
          max={20}
          value={away}
          onChange={(e) => setAway(e.target.value)}
          className="w-20"
          aria-label="Goles visitante"
        />
        <Button type="submit" disabled={pending} className={cn(pending && "opacity-60")}>
          {pending ? "..." : "Guardar"}
        </Button>
      </div>
      <div className="flex gap-2">
        <Input
          type="number"
          min={0}
          max={20}
          value={penaltyHome}
          onChange={(e) => setPenaltyHome(e.target.value)}
          placeholder="Pen local"
          className="w-24 text-xs"
          aria-label="Penaltis local"
        />
        <span className="self-center text-[var(--tm-muted)]">-</span>
        <Input
          type="number"
          min={0}
          max={20}
          value={penaltyAway}
          onChange={(e) => setPenaltyAway(e.target.value)}
          placeholder="Pen vis"
          className="w-24 text-xs"
          aria-label="Penaltis visitante"
        />
      </div>
      {isKnockout && (
        <div className="flex gap-2 items-center">
          <label className="text-xs text-[var(--tm-muted)] shrink-0">Clasificado:</label>
          <select
            value={advancingTeam}
            onChange={(e) => setAdvancingTeam(e.target.value as "home" | "away" | "")}
            className="h-8 rounded-md border border-[var(--tm-border)] bg-[var(--tm-surface)] px-2 text-xs text-[var(--tm-fg)]"
          >
            <option value="">-- Por definir --</option>
            <option value="home">Local</option>
            <option value="away">Visitante</option>
          </select>
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        <Input
          type="text"
          value={mvpPlayer}
          onChange={(e) => setMvpPlayer(e.target.value)}
          placeholder="MVP (jugador)"
          className="min-w-0 flex-1"
          aria-label="MVP jugador"
        />
        <Input
          type="text"
          value={mvpTeam}
          onChange={(e) => setMvpTeam(e.target.value)}
          placeholder="Equipo MVP"
          className="min-w-0 flex-1"
          aria-label="MVP equipo"
        />
      </div>
      {error && (
        <p className="text-xs text-[var(--tm-danger)]" role="alert">
          {error}
        </p>
      )}
      </form>
    </div>
  );
}
