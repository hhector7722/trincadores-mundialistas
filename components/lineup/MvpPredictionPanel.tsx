"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { fetchMatchLineupBundleAction } from "@/actions/lineup";
import { setTeamKitHexFromDb } from "@/lib/lineup/team-kit-colors";
import { saveMvpPrediction } from "@/actions/mvp-predictions";
import { MatchMvpFieldGraphic } from "@/components/lineup/MatchMvpFieldGraphic";
import { BenchPlayersStrip, benchPlayerKey } from "@/components/lineup/BenchPlayersStrip";
import { LineupFieldGate } from "@/components/lineup/LineupFieldGate";
import { Button } from "@/components/ui/button";
import { resolveBenchPlayers } from "@/lib/lineup/bench-from-lineup";
import { playerIdentityKey } from "@/lib/lineup/player-dedupe";
import {
  findMvpOptionBySaved,
  mvpSelectionKey,
} from "@/lib/lineup/mvp-selection-key";
import { buildFallbackLineup } from "@/lib/lineup/build-fallback-lineup";
import type { ResolvedLineup } from "@/lib/lineup/types";
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
  name: string;
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
  const seen = new Set<string>();
  return squad.players
    .filter((player) => {
      const key = playerIdentityKey({
        name: player.player_name,
        shirtNumber: player.shirt_number,
      });
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .map((player) => ({
      key: mvpSelectionKey(teamName, {
        name: player.player_name,
        shirtNumber: player.shirt_number,
      }),
      name: player.player_name,
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
  const [homeLineup, setHomeLineup] = useState<ResolvedLineup | null>(null);
  const [awayLineup, setAwayLineup] = useState<ResolvedLineup | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [kitColorsReady, setKitColorsReady] = useState(false);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setKitColorsReady(false);

    fetchMatchLineupBundleAction(matchId, homeTeam, awayTeam).then((result) => {
      if (cancelled) return;
      if (!result.ok) {
        setError(result.error);
        setHomeSquad(null);
        setAwaySquad(null);
        setHomeLineup(null);
        setAwayLineup(null);
        setKitColorsReady(false);
      } else {
        setTeamKitHexFromDb(result.data.kitHexMap);
        setHomeSquad(result.data.home.squad);
        setAwaySquad(result.data.away.squad);
        setHomeLineup(result.data.home.lineup);
        setAwayLineup(result.data.away.lineup);
        setKitColorsReady(true);
      }
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [homeTeam, awayTeam, matchId]);

  const homeOptions = useMemo(
    () => flattenSquadPlayers(homeSquad, homeTeam),
    [homeSquad, homeTeam]
  );
  const awayOptions = useMemo(
    () => flattenSquadPlayers(awaySquad, awayTeam),
    [awaySquad, awayTeam]
  );
  const options = useMemo(() => [...homeOptions, ...awayOptions], [homeOptions, awayOptions]);

  const resolvedHomeLineup = useMemo(
    () =>
      homeLineup ??
      (homeSquad ? buildFallbackLineup(homeSquad.players) : null),
    [homeLineup, homeSquad]
  );
  const resolvedAwayLineup = useMemo(
    () =>
      awayLineup ??
      (awaySquad ? buildFallbackLineup(awaySquad.players) : null),
    [awayLineup, awaySquad]
  );

  const homeSlots = useMemo(
    () => (resolvedHomeLineup ? mapSlotsToHomeHalf(resolvedHomeLineup.slots) : []),
    [resolvedHomeLineup]
  );
  const awaySlots = useMemo(
    () => (resolvedAwayLineup ? mapSlotsToAwayHalf(resolvedAwayLineup.slots) : []),
    [resolvedAwayLineup]
  );

  const homeBench = useMemo(
    () =>
      sortBenchByShirt(
        homeSquad && resolvedHomeLineup
          ? resolveBenchPlayers(homeSquad, resolvedHomeLineup)
          : []
      ),
    [homeSquad, resolvedHomeLineup]
  );
  const awayBench = useMemo(
    () =>
      sortBenchByShirt(
        awaySquad && resolvedAwayLineup
          ? resolveBenchPlayers(awaySquad, resolvedAwayLineup)
          : []
      ),
    [awaySquad, resolvedAwayLineup]
  );

  useEffect(() => {
    if (!savedPlayerName || !savedTeamName) {
      setSelectedKey(null);
      return;
    }
    const match = findMvpOptionBySaved(options, savedPlayerName, savedTeamName);
    setSelectedKey(match?.key ?? null);
  }, [options, savedPlayerName, savedTeamName]);

  const selectedOption = useMemo(
    () => options.find((option) => option.key === selectedKey) ?? null,
    [options, selectedKey]
  );

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
        selected.name,
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

  if (loading || !kitColorsReady) {
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

  const awayFormation = resolvedAwayLineup?.formationLabel;
  const homeFormation = resolvedHomeLineup?.formationLabel;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex min-h-0 flex-1 flex-col px-0.5 py-0.5">
        {!serverEditable ? (
          <p className="mb-0.5 shrink-0 px-1 text-xs text-[var(--tm-muted)]">
            Predicción cerrada. El plazo terminó 5 minutos antes del pitido.
          </p>
        ) : selectedOption ? (
          <p className="mb-0 shrink-0 truncate px-1 text-center text-[8px] text-[var(--tm-muted)]">
            MVP: {selectedOption.name}
          </p>
        ) : null}

        <LineupFieldGate label="Cargando campo…" className="flex min-h-0 flex-1 flex-col">
          {(markFieldReady) => (
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
              <BenchPlayersStrip
                teamName={awayTeam}
                players={awayBench}
                selectedKey={selectedKey}
                disabled={pickDisabled}
                density="minimal"
                showTeamHeader={false}
                onPlayerClick={(player) => setSelectedKey(benchPlayerKey(awayTeam, player))}
                position="top"
              />

              <div className="flex min-h-0 flex-1 items-center justify-center py-0.5">
                <MatchMvpFieldGraphic
                  homeSlots={homeSlots}
                  awaySlots={awaySlots}
                  homeTeam={homeTeam}
                  awayTeam={awayTeam}
                  homeSquadPlayerNames={homeSquad?.players.map((player) => player.player_name)}
                  awaySquadPlayerNames={awaySquad?.players.map((player) => player.player_name)}
                  selectedKey={selectedKey}
                  disabled={pickDisabled}
                  onSelect={setSelectedKey}
                  onFieldReady={markFieldReady}
                />
              </div>

              <BenchPlayersStrip
                teamName={homeTeam}
                players={homeBench}
                selectedKey={selectedKey}
                disabled={pickDisabled}
                density="minimal"
                showTeamHeader={false}
                onPlayerClick={(player) => setSelectedKey(benchPlayerKey(homeTeam, player))}
                position="bottom"
              />

              {awayFormation || homeFormation ? (
                <p className="mt-0.5 shrink-0 truncate px-1 text-center text-[7px] text-[var(--tm-muted)] opacity-70">
                  {[awayFormation, homeFormation].filter(Boolean).join(" · ")}
                </p>
              ) : null}
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
        <div className="flex shrink-0 gap-2 px-3 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
          <Button className="min-h-11 flex-1" disabled={!selectedKey || pending} onClick={onSave}>
            {pending ? "Guardando…" : savedPlayerName ? "Actualizar MVP" : "Guardar MVP"}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
