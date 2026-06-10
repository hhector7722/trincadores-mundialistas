"use client";

import { useMemo } from "react";
import { MvpTacticalFieldBody } from "@/components/lineup/MvpTacticalFieldBody";
import { TacticalLineupsPanelShell } from "@/components/lineup/TacticalLineupsPanelShell";
import { buildTacticalModalLayout } from "@/lib/lineup/tactical-modal-layout";
import { useMatchTacticalLineupData } from "@/lib/lineup/use-match-tactical-lineup-data";

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
    () => buildTacticalModalLayout(homeBench.length, awayBench.length),
    [homeBench.length, awayBench.length]
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
    <TacticalLineupsPanelShell loading={!ready} className="h-full min-h-0">
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
    </TacticalLineupsPanelShell>
  );
}
