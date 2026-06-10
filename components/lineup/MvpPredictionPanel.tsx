"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { fetchMatchLineupBundleAction } from "@/actions/lineup";
import { setTeamKitHexFromDb } from "@/lib/lineup/team-kit-colors";
import { saveMvpPrediction } from "@/actions/mvp-predictions";
import { MvpHorizontalFieldGraphic } from "@/components/lineup/MvpHorizontalFieldGraphic";
import { MvpBenchColumn } from "@/components/lineup/MvpBenchColumn";
import { LineupFormationInfo } from "@/components/lineup/LineupFormationInfo";
import { LineupFieldGate } from "@/components/lineup/LineupFieldGate";
import { useFitMvpLayout } from "@/components/lineup/use-fit-mvp-layout";
import { computeMvpFieldChipScale } from "@/lib/lineup/mvp-field-chip-scale";
import { Button } from "@/components/ui/button";
import { resolveBenchPlayers } from "@/lib/lineup/bench-from-lineup";
import { resolveFormationSlotsFromLineup } from "@/lib/lineup/resolve-formation-slots";
import {
  findMvpOptionBySaved,
  mvpSelectionKey,
  resolveMvpSelection,
} from "@/lib/lineup/mvp-selection-key";
import { buildFallbackLineup } from "@/lib/lineup/build-fallback-lineup";
import {
  mapSlotsToAwayLeft,
  mapSlotsToHomeRight,
} from "@/lib/lineup/mvp-horizontal-geometry";
import type { ResolvedLineup } from "@/lib/lineup/types";
import { cn } from "@/lib/utils";
import type { TeamSquadWithPlayers } from "@/lib/worldcup-data/squad-queries";
import { LoadingCenter } from "@/components/ui/spinner";

type MvpPredictionPanelProps = {
  poolId?: string;
  matchId: string;
  homeTeam: string;
  awayTeam: string;
  serverEditable: boolean;
  savedPlayerName?: string | null;
  savedTeamName?: string | null;
  onSaved?: (playerName: string, teamName: string) => void;
  onFormationsChange?: (awayFormation?: string, homeFormation?: string) => void;
  /** Vista solo lectura del campo táctico (sin guardar MVP). */
  preview?: boolean;
};

type SquadPlayerOption = {
  key: string;
  name: string;
  teamName: string;
  shirtNumber: number | null;
  position: string | null;
};

const MVP_FORMATION_ROW_PX = 22;
/** Margen bajo el campo: fichas centradas en y% desbordan la línea inferior. */
const MVP_CHIP_BLEED_PX = 14;
/** Pie visual del modal MVP (debe coincidir con MVP_MODAL_SAVE_FOOTER_REM). */
const MVP_SAVE_FOOTER_CLASS = "h-9 shrink-0";

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

function resolveTeamLineup(
  lineup: ResolvedLineup | null,
  squad: TeamSquadWithPlayers | null
): ResolvedLineup | null {
  if (lineup) return lineup;
  if (!squad || squad.players.length === 0) return null;
  return buildFallbackLineup(squad.players);
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
  onFormationsChange,
  preview = false,
}: MvpPredictionPanelProps) {
  const router = useRouter();
  const layoutRef = useRef<HTMLDivElement>(null);
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
    () => resolveTeamLineup(homeLineup, homeSquad),
    [homeLineup, homeSquad]
  );
  const resolvedAwayLineup = useMemo(
    () => resolveTeamLineup(awayLineup, awaySquad),
    [awayLineup, awaySquad]
  );

  useEffect(() => {
    if (preview) return;
    onFormationsChange?.(
      resolvedAwayLineup?.formationLabel,
      resolvedHomeLineup?.formationLabel
    );
  }, [
    preview,
    onFormationsChange,
    resolvedAwayLineup?.formationLabel,
    resolvedHomeLineup?.formationLabel,
  ]);

  const awaySlots = useMemo(
    () =>
      resolvedAwayLineup
        ? mapSlotsToAwayLeft(resolveFormationSlotsFromLineup(resolvedAwayLineup))
        : [],
    [resolvedAwayLineup]
  );
  const homeSlots = useMemo(
    () =>
      resolvedHomeLineup
        ? mapSlotsToHomeRight(resolveFormationSlotsFromLineup(resolvedHomeLineup))
        : [],
    [resolvedHomeLineup]
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

  /** Misma reserva en preview y MVP: el pie de guardar va fuera del área medida. */
  const footerPx = MVP_CHIP_BLEED_PX;

  const fitLayout = useFitMvpLayout(layoutRef, {
    awayBenchCount: awayBench.length,
    homeBenchCount: homeBench.length,
    footerPx,
    formationRowPx: MVP_FORMATION_ROW_PX,
    enabled: !loading && kitColorsReady,
    gapPx: 2,
  });

  const chipScale = useMemo(() => {
    if (!fitLayout) return 1;
    return computeMvpFieldChipScale(
      fitLayout.fieldWidthPx,
      fitLayout.fieldHeightPx,
      [...awaySlots, ...homeSlots]
    );
  }, [fitLayout, awaySlots, homeSlots]);

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

  const tacticalReady = homeSlots.length + awaySlots.length >= 22;

  function onSave() {
    if (preview || !poolId) return;

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

  if (loading || !kitColorsReady) {
    return <LoadingCenter label="Cargando alineaciones…" />;
  }

  if (!tacticalReady) {
    return (
      <div className="px-4 py-8 text-center">
        <p className="text-sm text-[var(--tm-muted)]">
          No hay alineaciones disponibles para mostrar el campo táctico.
        </p>
      </div>
    );
  }

  const pickDisabled = preview ? false : !serverEditable || pending;
  const layoutReady = fitLayout != null;

  return (
    <div className="flex h-full min-h-0 w-full flex-col overflow-hidden">
      <div
        ref={layoutRef}
        className="flex min-h-0 flex-1 flex-col overflow-hidden px-1 pt-0.5"
      >
        {!layoutReady ? (
          <div className="flex min-h-0 flex-1 items-center justify-center">
            <LoadingCenter label="Ajustando campo…" minHeightClassName="min-h-0" />
          </div>
        ) : (
        <div
          className="mx-auto flex min-h-0 w-full min-w-0 flex-1 flex-col"
          style={{ maxWidth: fitLayout.fieldWidthPx }}
        >
          {awayBench.length > 0 || resolvedAwayLineup?.formationLabel ? (
            <div className="w-full shrink-0 pb-0.5">
              <LineupFormationInfo
                teamName={awayTeam}
                formationLabel={resolvedAwayLineup?.formationLabel}
                align="left"
              />
              {awayBench.length > 0 ? (
                <MvpBenchColumn
                  teamName={awayTeam}
                  players={awayBench}
                  selectedKey={selectedKey}
                  selectedPlayer={selectedOption}
                  disabled={pickDisabled}
                  align="left"
                  gridLayout={fitLayout.awayBench}
                  onPlayerClick={(player) => setSelectedKey(mvpSelectionKey(awayTeam, player))}
                />
              ) : null}
            </div>
          ) : null}

          <LineupFieldGate label="Cargando campo…" className="flex min-h-0 flex-1 flex-col">
            {(markFieldReady) => (
              <div className="flex min-h-0 flex-1 items-center justify-center overflow-visible pb-2">
                <MvpHorizontalFieldGraphic
                  awaySlots={awaySlots}
                  homeSlots={homeSlots}
                  awayTeam={awayTeam}
                  homeTeam={homeTeam}
                  awaySquadPlayerNames={awaySquad?.players.map((player) => player.player_name)}
                  homeSquadPlayerNames={homeSquad?.players.map((player) => player.player_name)}
                  selectedKey={selectedKey}
                  selectedPlayer={selectedOption}
                  disabled={pickDisabled}
                  onSelect={setSelectedKey}
                  onFieldReady={markFieldReady}
                  widthPx={fitLayout.fieldWidthPx}
                  heightPx={fitLayout.fieldHeightPx}
                  chipScale={chipScale}
                />
              </div>
            )}
          </LineupFieldGate>

          {homeBench.length > 0 || resolvedHomeLineup?.formationLabel ? (
            <div className="w-full shrink-0 pt-0.5 pb-1">
              <LineupFormationInfo
                teamName={homeTeam}
                formationLabel={resolvedHomeLineup?.formationLabel}
                align="right"
              />
              {homeBench.length > 0 ? (
                <MvpBenchColumn
                  teamName={homeTeam}
                  players={homeBench}
                  selectedKey={selectedKey}
                  selectedPlayer={selectedOption}
                  disabled={pickDisabled}
                  align="right"
                  gridLayout={fitLayout.homeBench}
                  onPlayerClick={(player) => setSelectedKey(mvpSelectionKey(homeTeam, player))}
                />
              ) : null}
            </div>
          ) : null}
        </div>
        )}
      </div>

      {!preview ? (
        <div
          className={cn(
            MVP_SAVE_FOOTER_CLASS,
            "flex flex-col items-center justify-center gap-0.5 px-2 pb-[max(0.25rem,env(safe-area-inset-bottom))] pt-0.5"
          )}
        >
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
      ) : null}
    </div>
  );
}
