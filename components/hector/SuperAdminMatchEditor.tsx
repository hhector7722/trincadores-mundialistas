"use client";

import { useState, useTransition, useEffect } from "react";
import { toast } from "sonner";
import { forceGlobalMatchResult } from "@/actions/super-admin";
import { fetchMatchSquadsAction } from "@/actions/lineup";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { TeamSquadWithPlayers } from "@/lib/worldcup-data/squad-queries";

type MatchItem = {
  id: string;
  home_team: string;
  away_team: string;
  kickoff_at: string;
  status: string;
};

type Props = {
  matches: MatchItem[];
};

export function SuperAdminMatchEditor({ matches }: Props) {
  const [isPending, startTransition] = useTransition();
  const [selectedMatchId, setSelectedMatchId] = useState<string>("");
  const [homeGoals, setHomeGoals] = useState<number | "">("");
  const [awayGoals, setAwayGoals] = useState<number | "">("");
  const [mvpTeamName, setMvpTeamName] = useState<string>("");
  const [mvpPlayerName, setMvpPlayerName] = useState<string>("");

  const [squadsLoading, setSquadsLoading] = useState(false);
  const [squads, setSquads] = useState<{ home: TeamSquadWithPlayers | null; away: TeamSquadWithPlayers | null } | null>(null);

  const selectedMatch = matches.find((m) => m.id === selectedMatchId);

  useEffect(() => {
    if (!selectedMatch) {
      setSquads(null);
      return;
    }
    let ignore = false;
    setSquadsLoading(true);
    fetchMatchSquadsAction(selectedMatch.home_team, selectedMatch.away_team)
      .then((res) => {
        if (!ignore) {
          if (res.ok) {
            setSquads(res.data);
          } else {
            toast.error(res.error);
            setSquads(null);
          }
        }
      })
      .finally(() => {
        if (!ignore) setSquadsLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [selectedMatch]);

  // Reset mvp player if team changes
  useEffect(() => {
    setMvpPlayerName("");
  }, [mvpTeamName]);

  const mvpTeamSquad = mvpTeamName === selectedMatch?.home_team
    ? squads?.home
    : mvpTeamName === selectedMatch?.away_team
      ? squads?.away
      : null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedMatch) return;
    if (homeGoals === "" || awayGoals === "") {
      toast.error("Debes introducir ambos goles.");
      return;
    }

    startTransition(async () => {
      const res = await forceGlobalMatchResult(
        selectedMatch.id,
        Number(homeGoals),
        Number(awayGoals),
        mvpPlayerName || null,
        mvpTeamName || null
      );
      if (res.ok) {
        toast.success("Resultado forzado con éxito en toda la base de datos.");
        // Reset form
        setSelectedMatchId("");
        setHomeGoals("");
        setAwayGoals("");
        setMvpTeamName("");
        setMvpPlayerName("");
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-[var(--tm-surface)] border border-[var(--tm-border)] p-4 rounded-xl">
      <div className="space-y-2">
        <label className="text-sm font-medium text-[var(--tm-fg)]">Partido</label>
        <select
          value={selectedMatchId}
          onChange={(e) => setSelectedMatchId(e.target.value)}
          className="flex h-11 w-full rounded-md border border-[var(--tm-border)] bg-[var(--tm-bg)] px-3 py-2 text-sm text-[var(--tm-fg)] ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[var(--tm-primary)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <option value="">-- Selecciona Partido --</option>
          {matches.map((m) => (
            <option key={m.id} value={m.id}>
              {new Date(m.kickoff_at).toLocaleDateString()} | {m.home_team} vs {m.away_team} ({m.status})
            </option>
          ))}
        </select>
      </div>

      {selectedMatch && (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--tm-fg)]">
                Goles {selectedMatch.home_team} (Local)
              </label>
              <Input
                type="number"
                min="0"
                value={homeGoals}
                onChange={(e) => setHomeGoals(e.target.value === "" ? "" : Number(e.target.value))}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--tm-fg)]">
                Goles {selectedMatch.away_team} (Visitante)
              </label>
              <Input
                type="number"
                min="0"
                value={awayGoals}
                onChange={(e) => setAwayGoals(e.target.value === "" ? "" : Number(e.target.value))}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-[var(--tm-fg)]">Equipo del MVP</label>
            <select
              value={mvpTeamName}
              onChange={(e) => setMvpTeamName(e.target.value)}
              className="flex h-11 w-full rounded-md border border-[var(--tm-border)] bg-[var(--tm-bg)] px-3 py-2 text-sm text-[var(--tm-fg)] ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[var(--tm-primary)]"
            >
              <option value="">-- Ninguno --</option>
              <option value={selectedMatch.home_team}>{selectedMatch.home_team}</option>
              <option value={selectedMatch.away_team}>{selectedMatch.away_team}</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-[var(--tm-fg)]">Jugador MVP</label>
            <select
              value={mvpPlayerName}
              onChange={(e) => setMvpPlayerName(e.target.value)}
              disabled={!mvpTeamName || squadsLoading || (!squadsLoading && !mvpTeamSquad)}
              className="flex h-11 w-full rounded-md border border-[var(--tm-border)] bg-[var(--tm-bg)] px-3 py-2 text-sm text-[var(--tm-fg)] ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[var(--tm-primary)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">-- Seleccionar Jugador --</option>
              {mvpTeamSquad?.players?.map((p) => (
                <option key={p.player_name} value={p.player_name}>
                  {p.player_name} {p.shirt_number ? `(#${p.shirt_number})` : ""}
                </option>
              ))}
            </select>
            {squadsLoading && <p className="text-xs text-[var(--tm-primary)] mt-1">Cargando plantillas...</p>}
            {!squadsLoading && mvpTeamName && !mvpTeamSquad && (
              <p className="text-xs text-red-500 mt-1">No hay plantilla disponible en la BD para este equipo.</p>
            )}
          </div>

          <Button type="submit" disabled={isPending} className="w-full min-h-11 font-display tracking-wider uppercase text-sm">
            {isPending ? "Guardando..." : "Guardar Oficialmente"}
          </Button>
        </>
      )}
    </form>
  );
}
