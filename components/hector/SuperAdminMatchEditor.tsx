"use client";

import { useState, useTransition, useEffect } from "react";
import { forceGlobalMatchResult, fetchLiveOfficialMvpAction } from "@/actions/super-admin";
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
  const [isFetchingLive, setIsFetchingLive] = useState(false);

  const [squadsLoading, setSquadsLoading] = useState(false);
  const [squads, setSquads] = useState<{ home: TeamSquadWithPlayers | null; away: TeamSquadWithPlayers | null } | null>(null);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

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
            setErrorMsg(res.error);
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



  const mvpTeamSquad = mvpTeamName === selectedMatch?.home_team
    ? squads?.home
    : mvpTeamName === selectedMatch?.away_team
      ? squads?.away
      : null;

  async function handleAutoFetchMvp() {
    if (!selectedMatch) return;
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsFetchingLive(true);
    
    try {
      const res = await fetchLiveOfficialMvpAction(
        selectedMatch.id,
        selectedMatch.home_team,
        selectedMatch.away_team,
        selectedMatch.kickoff_at
      );
      
      if (res.ok) {
        setMvpTeamName(res.teamName);
        setMvpPlayerName(res.playerName);
        setSuccessMsg(`MVP encontrado en fuentes oficiales: ${res.playerName} (${res.teamName})`);
      } else {
        setErrorMsg(res.error);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Error al conectar con las fuentes.");
    } finally {
      setIsFetchingLive(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedMatch) return;
    setErrorMsg(null);
    setSuccessMsg(null);
    if (homeGoals === "" || awayGoals === "") {
      setErrorMsg("Debes introducir ambos goles.");
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
        setSuccessMsg("Resultado forzado con éxito en toda la base de datos.");
        // Reset form
        setSelectedMatchId("");
        setHomeGoals("");
        setAwayGoals("");
        setMvpTeamName("");
        setMvpPlayerName("");
      } else {
        setErrorMsg(res.error);
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
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-[var(--tm-fg)]">Equipo del MVP</label>
              <Button
                type="button"
                variant="outline"
                onClick={handleAutoFetchMvp}
                disabled={isFetchingLive || isPending}
                className="h-8 text-xs font-display uppercase tracking-wider"
              >
                {isFetchingLive ? "Conectando..." : "Autocompletar (FIFA/BSD)"}
              </Button>
            </div>
            <select
              value={mvpTeamName}
              onChange={(e) => {
                setMvpTeamName(e.target.value);
                setMvpPlayerName("");
              }}
              className="flex h-11 w-full rounded-md border border-[var(--tm-border)] bg-[var(--tm-bg)] px-3 py-2 text-sm text-[var(--tm-fg)] ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[var(--tm-primary)]"
            >
              <option value="">-- Ninguno --</option>
              <option value={selectedMatch.home_team}>{selectedMatch.home_team}</option>
              <option value={selectedMatch.away_team}>{selectedMatch.away_team}</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-[var(--tm-fg)]">Jugador MVP</label>
            {mvpTeamSquad ? (
              <select
                value={mvpPlayerName}
                onChange={(e) => setMvpPlayerName(e.target.value)}
                disabled={!mvpTeamName || squadsLoading}
                className="flex h-11 w-full rounded-md border border-[var(--tm-border)] bg-[var(--tm-bg)] px-3 py-2 text-sm text-[var(--tm-fg)] ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[var(--tm-primary)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">-- Seleccionar Jugador --</option>
                {mvpTeamSquad.players?.map((p) => (
                  <option key={p.player_name} value={p.player_name}>
                    {p.player_name} {p.shirt_number ? `(#${p.shirt_number})` : ""}
                  </option>
                ))}
              </select>
            ) : (
              <Input
                type="text"
                value={mvpPlayerName}
                onChange={(e) => setMvpPlayerName(e.target.value)}
                disabled={!mvpTeamName || squadsLoading}
                placeholder="Nombre del jugador (libre)"
              />
            )}
            {squadsLoading && <p className="text-xs text-[var(--tm-primary)] mt-1">Cargando plantillas...</p>}
            {!squadsLoading && mvpTeamName && !mvpTeamSquad && (
              <p className="text-xs text-[var(--tm-muted)] mt-1">No hay plantilla disponible en la BD. Introducir nombre manualmente.</p>
            )}
          </div>

          {errorMsg && (
            <p className="text-sm text-red-500 bg-red-500/10 p-2 rounded" role="alert">
              {errorMsg}
            </p>
          )}
          {successMsg && (
            <p className="text-sm text-green-500 bg-green-500/10 p-2 rounded" role="status">
              {successMsg}
            </p>
          )}

          <Button type="submit" disabled={isPending} className="w-full min-h-11 font-display tracking-wider uppercase text-sm">
            {isPending ? "Guardando..." : "Guardar Oficialmente"}
          </Button>
        </>
      )}
    </form>
  );
}
