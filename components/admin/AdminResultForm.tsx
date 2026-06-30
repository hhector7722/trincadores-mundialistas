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
}: {
  poolId: string;
  matchId: string;
  label: string;
}) {
  const router = useRouter();
  const [home, setHome] = useState("0");
  const [away, setAway] = useState("0");
  const [penaltyHome, setPenaltyHome] = useState("");
  const [penaltyAway, setPenaltyAway] = useState("");
  const [mvpPlayer, setMvpPlayer] = useState("");
  const [mvpTeam, setMvpTeam] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

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
        parsedPenaltyAway
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
        <Button
          type="button"
          variant="outline"
          onClick={onSetLive}
          disabled={pending}
          className={cn("h-7 text-xs", pending && "opacity-60")}
        >
          {pending ? "..." : "Marcar EN JUEGO"}
        </Button>
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
          {pending ? "..." : "Cerrar"}
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