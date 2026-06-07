"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { fetchMatchSquadsAction } from "@/actions/lineup";
import { saveMvpPrediction } from "@/actions/mvp-predictions";
import { Button } from "@/components/ui/button";
import { TeamFlagBadge } from "@/components/predictions/TeamFlagBadge";
import { teamNameEs } from "@/lib/teams/display";
import type { TeamSquadWithPlayers } from "@/lib/worldcup-data/squad-queries";
import { formatMvpPointsLabel } from "@/lib/predictions/scoring";
import { LoadingCenter } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

type MvpPredictionPanelProps = {
  poolId: string;
  matchId: string;
  homeTeam: string;
  awayTeam: string;
  serverEditable: boolean;
  savedPlayerName?: string | null;
  savedTeamName?: string | null;
  onSaved?: (playerName: string, teamName: string) => void;
};

type SquadPlayerOption = {
  key: string;
  playerName: string;
  teamName: string;
  shirtNumber: number | null;
  position: string | null;
};

function flattenSquadPlayers(
  squad: TeamSquadWithPlayers | null,
  teamName: string
): SquadPlayerOption[] {
  if (!squad) return [];
  return squad.players.map((player) => ({
    key: `${teamName}-${player.player_name}-${player.shirt_number ?? "x"}`,
    playerName: player.player_name,
    teamName,
    shirtNumber: player.shirt_number,
    position: player.position,
  }));
}

export function MvpPredictionPanel({
  poolId,
  matchId,
  homeTeam,
  awayTeam,
  serverEditable,
  savedPlayerName,
  savedTeamName,
  onSaved,
}: MvpPredictionPanelProps) {
  const router = useRouter();
  const [homeSquad, setHomeSquad] = useState<TeamSquadWithPlayers | null>(null);
  const [awaySquad, setAwaySquad] = useState<TeamSquadWithPlayers | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchMatchSquadsAction(homeTeam, awayTeam).then((result) => {
      if (cancelled) return;
      if (!result.ok) {
        setError(result.error);
        setHomeSquad(null);
        setAwaySquad(null);
      } else {
        setHomeSquad(result.data.home);
        setAwaySquad(result.data.away);
      }
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [homeTeam, awayTeam]);

  const options = useMemo(() => {
    const merged = [
      ...flattenSquadPlayers(homeSquad, homeTeam),
      ...flattenSquadPlayers(awaySquad, awayTeam),
    ];
    return merged.sort((a, b) => a.playerName.localeCompare(b.playerName, "es"));
  }, [homeSquad, awaySquad, homeTeam, awayTeam]);

  useEffect(() => {
    if (!savedPlayerName || !savedTeamName) {
      setSelectedKey(null);
      return;
    }
    const match = options.find(
      (option) =>
        option.playerName === savedPlayerName && option.teamName === savedTeamName
    );
    setSelectedKey(match?.key ?? null);
  }, [options, savedPlayerName, savedTeamName]);

  function onSave() {
    const selected = options.find((option) => option.key === selectedKey);
    if (!selected) {
      setError("Selecciona un jugador.");
      return;
    }

    setError(null);
    startTransition(async () => {
      const result = await saveMvpPrediction(
        poolId,
        matchId,
        selected.playerName,
        selected.teamName
      );
      if (!result.ok) {
        setError(result.error);
        return;
      }
      onSaved?.(result.playerName, result.teamName);
      router.refresh();
    });
  }

  if (loading) {
    return <LoadingCenter label="Cargando jugadores…" />;
  }

  if (options.length === 0) {
    return (
      <div className="px-4 py-8 text-center">
        <p className="text-sm text-[var(--tm-muted)]">
          No hay plantillas disponibles para elegir MVP.
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="space-y-3 px-4 py-4">
        <p className="text-sm text-[var(--tm-muted)]">
          Elige al MVP de {teamNameEs(homeTeam)} vs {teamNameEs(awayTeam)}. Acierto:{" "}
          {formatMvpPointsLabel()} en la porra.
        </p>

        {!serverEditable ? (
          <p className="text-sm text-[var(--tm-muted)]">
            Predicción cerrada. El plazo terminó 5 minutos antes del pitido.
          </p>
        ) : null}

        <ul className="max-h-[min(22rem,50dvh)] space-y-1 overflow-y-auto overscroll-contain">
          {options.map((option) => {
            const active = selectedKey === option.key;
            return (
              <li key={option.key}>
                <button
                  type="button"
                  disabled={!serverEditable || pending}
                  onClick={() => setSelectedKey(option.key)}
                  className={cn(
                    "flex w-full min-h-12 items-center gap-3 rounded-xl border px-3 py-2 text-left transition-colors",
                    active
                      ? "border-[var(--tm-accent)] bg-[rgba(212,255,0,0.12)]"
                      : "border-[var(--tm-border)] bg-[rgba(111,43,255,0.08)] hover:bg-[rgba(111,43,255,0.16)]",
                    (!serverEditable || pending) && "opacity-60"
                  )}
                >
                  <TeamFlagBadge name={option.teamName} size="xs" className="shrink-0" />
                  <span className="font-display w-7 shrink-0 text-center text-sm font-bold text-[var(--tm-accent)]">
                    {option.shirtNumber ?? "—"}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm font-medium text-[var(--tm-fg)]">
                    {option.playerName}
                  </span>
                  <span className="shrink-0 text-[10px] uppercase tracking-wide text-[var(--tm-muted)]">
                    {option.position ?? " "}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>

        {error ? (
          <p className="text-sm text-[var(--tm-danger)]" role="alert">
            {error}
          </p>
        ) : null}
      </div>

      {serverEditable ? (
        <div className="flex shrink-0 gap-2 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <Button className="flex-1" disabled={!selectedKey || pending} onClick={onSave}>
            {pending ? "Guardando…" : savedPlayerName ? "Actualizar MVP" : "Guardar MVP"}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
