"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { fetchMatchSquadsAction } from "@/actions/lineup";
import { saveMvpPrediction } from "@/actions/mvp-predictions";
import { MatchMvpFieldGraphic } from "@/components/lineup/MatchMvpFieldGraphic";
import { MvpBenchStrip } from "@/components/lineup/MvpBenchStrip";
import { LineupFieldGate } from "@/components/lineup/LineupFieldGate";
import { Button } from "@/components/ui/button";
import { getBenchPlayers } from "@/lib/lineup/bench-players";
import { buildProbableXI } from "@/lib/lineup/build-probable-xi";
import { mapSlotsToAwayHalf, mapSlotsToHomeHalf } from "@/lib/lineup/match-field-geometry";
import type { TeamSquadWithPlayers } from "@/lib/worldcup-data/squad-queries";
import { LoadingCenter } from "@/components/ui/spinner";

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

function sortBenchByShirt<T extends { shirtNumber: number | null; name: string }>(
  players: T[]
): T[] {
  return [...players].sort((a, b) => {
    const shirtA = a.shirtNumber ?? 999;
    const shirtB = b.shirtNumber ?? 999;
    if (shirtA !== shirtB) return shirtA - shirtB;
    return a.name.localeCompare(b.name, "es");
  });
}

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

  const homeOptions = useMemo(
    () => flattenSquadPlayers(homeSquad, homeTeam),
    [homeSquad, homeTeam]
  );
  const awayOptions = useMemo(
    () => flattenSquadPlayers(awaySquad, awayTeam),
    [awaySquad, awayTeam]
  );
  const options = useMemo(() => [...homeOptions, ...awayOptions], [homeOptions, awayOptions]);

  const homeLineup = useMemo(
    () => (homeSquad ? buildProbableXI(homeSquad.players) : null),
    [homeSquad]
  );
  const awayLineup = useMemo(
    () => (awaySquad ? buildProbableXI(awaySquad.players) : null),
    [awaySquad]
  );

  const homeSlots = useMemo(
    () => (homeLineup ? mapSlotsToHomeHalf(homeLineup.slots) : []),
    [homeLineup]
  );
  const awaySlots = useMemo(
    () => (awayLineup ? mapSlotsToAwayHalf(awayLineup.slots) : []),
    [awayLineup]
  );

  const homeBench = useMemo(
    () =>
      sortBenchByShirt(
        homeSquad && homeLineup ? getBenchPlayers(homeSquad, homeLineup) : []
      ),
    [homeSquad, homeLineup]
  );
  const awayBench = useMemo(
    () =>
      sortBenchByShirt(
        awaySquad && awayLineup ? getBenchPlayers(awaySquad, awayLineup) : []
      ),
    [awaySquad, awayLineup]
  );

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
      <div className="flex min-h-0 flex-1 flex-col px-1 py-2 sm:px-1.5">
        {!serverEditable ? (
          <p className="mb-1.5 shrink-0 px-1 text-sm text-[var(--tm-muted)]">
            Predicción cerrada. El plazo terminó 5 minutos antes del pitido.
          </p>
        ) : (
          <p className="mb-1.5 shrink-0 px-1 text-center text-[10px] text-[var(--tm-muted)]">
            Pulsa un jugador del once probable o de las reservas.
          </p>
        )}

        <LineupFieldGate label="Cargando campo…" className="flex min-h-0 flex-1 flex-col">
          {(markFieldReady) => (
            <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain">
              <MvpBenchStrip
                teamName={awayTeam}
                players={awayBench}
                selectedKey={selectedKey}
                disabled={pickDisabled}
                onSelect={setSelectedKey}
                position="top"
              />

              <MatchMvpFieldGraphic
                homeSlots={homeSlots}
                awaySlots={awaySlots}
                homeTeam={homeTeam}
                awayTeam={awayTeam}
                selectedKey={selectedKey}
                disabled={pickDisabled}
                onSelect={setSelectedKey}
                onFieldReady={markFieldReady}
              />

              <MvpBenchStrip
                teamName={homeTeam}
                players={homeBench}
                selectedKey={selectedKey}
                disabled={pickDisabled}
                onSelect={setSelectedKey}
                position="bottom"
              />

              <p className="mt-2 px-1 text-center text-[9px] leading-snug text-[var(--tm-muted)]">
                Once probable a partir de la convocatoria oficial FIFA 2026. Formación orientativa.
              </p>
            </div>
          )}
        </LineupFieldGate>

        {error ? (
          <p className="mt-2 px-4 text-sm text-[var(--tm-danger)]" role="alert">
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
