"use client";

import { useMemo } from "react";
import { MvpTacticalFieldBody } from "@/components/lineup/MvpTacticalFieldBody";
import { POSSIBLE_LINEUPS_FIELD_BODY_CLASS } from "@/lib/lineup/field-asset";
import { buildTacticalModalLayout } from "@/lib/lineup/tactical-modal-layout";
import { useMatchTacticalLineupData } from "@/lib/lineup/use-match-tactical-lineup-data";
import { cn } from "@/lib/utils";
import { LoadingCenter } from "@/components/ui/spinner";

type PossibleLineupsPanelProps = {
  matchId: string;
  homeTeam: string;
  awayTeam: string;
};

export function PossibleLineupsPanel({
  matchId,
  homeTeam,
  awayTeam,
}: PossibleLineupsPanelProps) {
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
    error,
    tacticalReady,
    ready,
  } = useMatchTacticalLineupData(matchId, homeTeam, awayTeam);

  const layout = useMemo(
    () => buildTacticalModalLayout("possible-lineups", awayBench.length, homeBench.length),
    [awayBench.length, homeBench.length]
  );

  if (!loading && !tacticalReady) {
    return (
      <div className="px-4 py-8 text-center">
        <p className="text-sm text-[var(--tm-muted)]">
          {error ?? "No hay alineaciones disponibles para mostrar el campo táctico."}
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 w-full flex-col overflow-hidden">
      <div
        className={cn(
          POSSIBLE_LINEUPS_FIELD_BODY_CLASS,
          "relative flex flex-col overflow-hidden px-1 pt-0.5"
        )}
      >
        {!ready ? (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-[var(--tm-shell-bg-hex)]">
            <LoadingCenter label="Cargando alineaciones…" minHeightClassName="min-h-0" />
          </div>
        ) : null}

        {ready ? (
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
            interactive={false}
          />
        ) : null}
      </div>
    </div>
  );
}
