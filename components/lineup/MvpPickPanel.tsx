"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { saveMvpPrediction } from "@/actions/mvp-predictions";
import { MvpTacticalFieldBody } from "@/components/lineup/MvpTacticalFieldBody";
import { TacticalLineupsPanelShell } from "@/components/lineup/TacticalLineupsPanelShell";
import { Button } from "@/components/ui/button";
import {
  findMvpOptionBySaved,
  mvpSelectionKey,
  resolveMvpSelection,
} from "@/lib/lineup/mvp-selection-key";
import { buildTacticalModalLayout } from "@/lib/lineup/tactical-modal-layout";
import { useMatchTacticalLineupData } from "@/lib/lineup/use-match-tactical-lineup-data";

type MvpPickPanelProps = {
  poolId: string;
  matchId: string;
  homeTeam: string;
  awayTeam: string;
  serverEditable: boolean;
  savedPlayerName?: string | null;
  savedTeamName?: string | null;
  onSaved?: (playerName: string, teamName: string) => void;
  onFormationsChange?: (awayFormation?: string, homeFormation?: string) => void;
};

type SquadPlayerOption = {
  key: string;
  name: string;
  teamName: string;
  shirtNumber: number | null;
  position: string | null;
};

function flattenSquadPlayers(
  squad: { players: Array<{ player_name: string; shirt_number: number | null; position: string | null }> } | null,
  teamName: string
): SquadPlayerOption[] {
  if (!squad) return [];
  const seen = new Set<string>();
  return squad.players
    .filter((player) => {
      const key = mvpSelectionKey(teamName, {
        name: player.player_name,
        shirtNumber: player.shirt_number,
      });
      if (seen.has(key)) return false;
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

export function MvpPickPanel({
  poolId,
  matchId,
  homeTeam,
  awayTeam,
  serverEditable,
  savedPlayerName,
  savedTeamName,
  onSaved,
  onFormationsChange,
}: MvpPickPanelProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const {
    homeSquad,
    awaySquad,
    resolvedHomeLineup,
    resolvedAwayLineup,
    awaySlots,
    homeSlots,
    homeBench,
    awayBench,
    loading,
    error: loadError,
    tacticalReady,
    ready,
  } = useMatchTacticalLineupData(matchId, homeTeam, awayTeam);

  const layout = useMemo(
    () => buildTacticalModalLayout(awayBench.length, homeBench.length),
    [awayBench.length, homeBench.length]
  );

  const homeOptions = useMemo(
    () => flattenSquadPlayers(homeSquad, homeTeam),
    [homeSquad, homeTeam]
  );
  const awayOptions = useMemo(
    () => flattenSquadPlayers(awaySquad, awayTeam),
    [awaySquad, awayTeam]
  );
  const options = useMemo(() => [...homeOptions, ...awayOptions], [homeOptions, awayOptions]);

  const lineupPlayers = useMemo(() => {
    const players: Array<{ name: string; shirtNumber: number | null; teamName: string }> = [];
    for (const slot of awaySlots) {
      if (!slot.isPlaceholder) {
        players.push({
          teamName: awayTeam,
          name: slot.name,
          shirtNumber: slot.shirtNumber,
        });
      }
    }
    for (const slot of homeSlots) {
      if (!slot.isPlaceholder) {
        players.push({
          teamName: homeTeam,
          name: slot.name,
          shirtNumber: slot.shirtNumber,
        });
      }
    }
    for (const player of awayBench) {
      players.push({ teamName: awayTeam, name: player.name, shirtNumber: player.shirtNumber });
    }
    for (const player of homeBench) {
      players.push({ teamName: homeTeam, name: player.name, shirtNumber: player.shirtNumber });
    }
    return players;
  }, [awaySlots, homeSlots, awayBench, homeBench, awayTeam, homeTeam]);

  const onFormationsChangeRef = useRef(onFormationsChange);
  onFormationsChangeRef.current = onFormationsChange;

  useEffect(() => {
    onFormationsChangeRef.current?.(
      resolvedAwayLineup?.formationLabel,
      resolvedHomeLineup?.formationLabel
    );
  }, [resolvedAwayLineup?.formationLabel, resolvedHomeLineup?.formationLabel]);

  useEffect(() => {
    if (!savedPlayerName || !savedTeamName) {
      setSelectedKey(null);
      return;
    }
    const match = findMvpOptionBySaved(options, savedPlayerName, savedTeamName);
    setSelectedKey(match?.key ?? null);
  }, [options, savedPlayerName, savedTeamName]);

  const selectedOption = useMemo(
    () => resolveMvpSelection(options, selectedKey, lineupPlayers) ?? null,
    [options, selectedKey, lineupPlayers]
  );

  function onSave() {
    const selected = resolveMvpSelection(options, selectedKey, lineupPlayers);
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

  if (!loading && !tacticalReady) {
    return (
      <div className="px-4 py-8 text-center">
        <p className="text-sm text-[var(--tm-muted)]">
          {loadError ?? "No hay alineaciones disponibles para mostrar el campo táctico."}
        </p>
      </div>
    );
  }

  const pickDisabled = !serverEditable || pending;

  return (
    <TacticalLineupsPanelShell
      loading={!ready}
      className="h-full min-h-0"
      footer={
        <div className="flex shrink-0 flex-col items-center justify-center gap-0.5 px-2 pb-[max(0.25rem,env(safe-area-inset-bottom))] pt-0.5">
          {error ? (
            <p className="text-[10px] leading-tight text-[var(--tm-danger)]" role="alert">
              {error}
            </p>
          ) : null}
          {!serverEditable ? (
            <p className="text-center text-[9px] text-[var(--tm-muted)]">Predicción cerrada.</p>
          ) : (
            <Button
              className="h-fit min-h-0 shrink-0 px-3 py-0.5 text-[11px] leading-none"
              disabled={!selectedOption || pending}
              onClick={onSave}
              title={selectedOption ? `MVP: ${selectedOption.name}` : undefined}
            >
              {pending ? "Guardando…" : savedPlayerName ? "Actualizar MVP" : "Guardar MVP"}
            </Button>
          )}
        </div>
      }
    >
      <MvpTacticalFieldBody
        awayTeam={awayTeam}
        homeTeam={homeTeam}
        awaySlots={awaySlots}
        homeSlots={homeSlots}
        awayBench={awayBench}
        homeBench={homeBench}
        resolvedAwayLineup={resolvedAwayLineup}
        resolvedHomeLineup={resolvedHomeLineup}
        awaySquad={awaySquad}
        homeSquad={homeSquad}
        layout={layout}
        interactive
        selectedKey={selectedKey}
        selectedPlayer={selectedOption}
        disabled={pickDisabled}
        onSelect={setSelectedKey}
      />
    </TacticalLineupsPanelShell>
  );
}
