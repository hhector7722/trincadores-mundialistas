"use client";

import { useEffect, useMemo } from "react";
import { MvpTacticalFieldBody } from "@/components/lineup/MvpTacticalFieldBody";
import { TacticalLineupsPanelShell } from "@/components/lineup/TacticalLineupsPanelShell";
import { possibleLineupsModalTitle } from "@/lib/lineup/lineups-modal-copy";
import { buildTacticalModalLayout } from "@/lib/lineup/tactical-modal-layout";
import { useMatchTacticalLineupData } from "@/lib/lineup/use-match-tactical-lineup-data";
import { teamNameEs } from "@/lib/teams/display";

type PossibleLineupsPanelProps = {
  matchId: string;
  homeTeam: string;
  awayTeam: string;
  onTitleChange?: (title: string) => void;
};

export function PossibleLineupsPanel({
  matchId,
  homeTeam,
  awayTeam,
  onTitleChange,
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
    [homeBench.length, awayBench.length],
  );

  const modalTitle = useMemo(
    () => possibleLineupsModalTitle(resolvedHomeLineup, resolvedAwayLineup),
    [resolvedHomeLineup, resolvedAwayLineup],
  );

  useEffect(() => {
    if (!ready) return;
    onTitleChange?.(modalTitle);
  }, [ready, modalTitle, onTitleChange]);

  if (!loading && !tacticalReady) {
    return (
      <div className="px-4 py-8 text-center">
        <p className="text-sm text-[var(--tm-muted)]">
          {error ?? "No hay alineaciones disponibles para mostrar el campo táctico."}
        </p>
      </div>
    );
  }

  const showSourceMeta = ready && resolvedHomeLineup && resolvedAwayLineup;

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
      {showSourceMeta ? (
        <p className="sr-only">
          {teamNameEs(homeTeam)} y {teamNameEs(awayTeam)}: {modalTitle}
        </p>
      ) : null}
    </TacticalLineupsPanelShell>
  );
}
