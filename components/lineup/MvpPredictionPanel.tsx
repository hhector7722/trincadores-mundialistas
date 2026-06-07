"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { fetchMatchSquadsAction } from "@/actions/lineup";
import { saveMvpPrediction } from "@/actions/mvp-predictions";
import { Button } from "@/components/ui/button";
import { shirtPlayerName } from "@/lib/lineup/short-player-name";
import type { TeamSquadWithPlayers } from "@/lib/worldcup-data/squad-queries";
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

function sortByShirt(a: SquadPlayerOption, b: SquadPlayerOption): number {
  const shirtA = a.shirtNumber ?? 999;
  const shirtB = b.shirtNumber ?? 999;
  if (shirtA !== shirtB) return shirtA - shirtB;
  return a.playerName.localeCompare(b.playerName, "es");
}

function MvpPlayerButton({
  option,
  active,
  disabled,
  onSelect,
}: {
  option: SquadPlayerOption | undefined;
  active: boolean;
  disabled: boolean;
  onSelect: (key: string) => void;
}) {
  if (!option) {
    return <div className="min-h-12 rounded-xl" aria-hidden="true" />;
  }

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onSelect(option.key)}
      className={cn(
        "flex min-h-12 w-full min-w-0 flex-col items-center justify-center gap-0.5 rounded-xl border px-1.5 py-1.5 text-center transition-colors",
        active
          ? "border-[var(--tm-accent)] bg-[rgba(212,255,0,0.12)]"
          : "border-[var(--tm-border)] bg-[rgba(111,43,255,0.08)] hover:bg-[rgba(111,43,255,0.16)]",
        disabled && "opacity-60"
      )}
    >
      <span className="font-display text-sm font-bold leading-none text-[var(--tm-accent)]">
        {option.shirtNumber ?? "—"}
      </span>
      <span className="w-full truncate text-[10px] font-medium leading-tight text-[var(--tm-fg)]">
        {shirtPlayerName(option.playerName)}
      </span>
    </button>
  );
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

  const homeOptions = useMemo(
    () => flattenSquadPlayers(homeSquad, homeTeam).sort(sortByShirt),
    [homeSquad, homeTeam]
  );
  const awayOptions = useMemo(
    () => flattenSquadPlayers(awaySquad, awayTeam).sort(sortByShirt),
    [awaySquad, awayTeam]
  );
  const options = useMemo(() => [...homeOptions, ...awayOptions], [homeOptions, awayOptions]);
  const rowCount = Math.max(homeOptions.length, awayOptions.length);

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

  const pickDisabled = !serverEditable || pending;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="space-y-3 px-4 py-4">
        {!serverEditable ? (
          <p className="text-sm text-[var(--tm-muted)]">
            Predicción cerrada. El plazo terminó 5 minutos antes del pitido.
          </p>
        ) : null}

        <div className="max-h-[min(22rem,50dvh)] space-y-1 overflow-y-auto overscroll-contain">
          {Array.from({ length: rowCount }, (_, index) => (
            <div key={`mvp-row-${index}`} className="grid grid-cols-2 gap-2">
              <MvpPlayerButton
                option={homeOptions[index]}
                active={selectedKey === homeOptions[index]?.key}
                disabled={pickDisabled}
                onSelect={setSelectedKey}
              />
              <MvpPlayerButton
                option={awayOptions[index]}
                active={selectedKey === awayOptions[index]?.key}
                disabled={pickDisabled}
                onSelect={setSelectedKey}
              />
            </div>
          ))}
        </div>

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
