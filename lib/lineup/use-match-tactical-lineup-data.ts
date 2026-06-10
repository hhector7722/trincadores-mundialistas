"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchMatchLineupBundleAction } from "@/actions/lineup";
import { setTeamKitHexFromDb } from "@/lib/lineup/team-kit-colors";
import { resolveBenchPlayers } from "@/lib/lineup/bench-from-lineup";
import { resolveFormationSlotsFromLineup } from "@/lib/lineup/resolve-formation-slots";
import { buildFallbackLineup } from "@/lib/lineup/build-fallback-lineup";
import {
  mapSlotsToAwayLeft,
  mapSlotsToHomeRight,
} from "@/lib/lineup/mvp-horizontal-geometry";
import type { ResolvedLineup } from "@/lib/lineup/types";
import type { TeamSquadWithPlayers } from "@/lib/worldcup-data/squad-queries";

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

function resolveTeamLineup(
  lineup: ResolvedLineup | null,
  squad: TeamSquadWithPlayers | null
): ResolvedLineup | null {
  if (lineup) return lineup;
  if (!squad || squad.players.length === 0) return null;
  return buildFallbackLineup(squad.players);
}

export function useMatchTacticalLineupData(
  matchId: string,
  homeTeam: string,
  awayTeam: string
) {
  const [homeSquad, setHomeSquad] = useState<TeamSquadWithPlayers | null>(null);
  const [awaySquad, setAwaySquad] = useState<TeamSquadWithPlayers | null>(null);
  const [homeLineup, setHomeLineup] = useState<ResolvedLineup | null>(null);
  const [awayLineup, setAwayLineup] = useState<ResolvedLineup | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [kitColorsReady, setKitColorsReady] = useState(false);

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

  const resolvedHomeLineup = useMemo(
    () => resolveTeamLineup(homeLineup, homeSquad),
    [homeLineup, homeSquad]
  );
  const resolvedAwayLineup = useMemo(
    () => resolveTeamLineup(awayLineup, awaySquad),
    [awayLineup, awaySquad]
  );

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

  const tacticalReady = homeSlots.length + awaySlots.length >= 22;
  const ready = !loading && kitColorsReady && tacticalReady;

  return {
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
  };
}
