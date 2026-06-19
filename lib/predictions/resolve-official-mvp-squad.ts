import { findMvpOptionBySaved } from "@/lib/lineup/mvp-selection-key";
import { resolveStoredOfficialMvpPlayerName } from "@/lib/predictions/mvp-name-match";
import type { AdminClient } from "@/lib/scripts/supabase-admin";
import { WC2026_FEED_SOURCE } from "@/lib/worldcup-data/types";
import { WC2026_SQUAD_YEAR } from "@/lib/worldcup2026/normalize-squads";
import { openFootballTeamName, squadLookupNames } from "@/lib/worldcup2026/squad-team-names";

export type OfficialMvpSourceCandidate = {
  playerName: string;
  teamName: string;
  fifaPlayerId?: string | null;
  shirtNumber?: number | null;
};

export type SquadPlayerForMvpResolve = {
  playerName: string;
  teamName: string;
  shirtNumber: number | null;
  externalPlayerKey: string | null;
};

/** Resuelve MVP oficial contra plantilla WC2026: idPlayer FIFA → dorsal → nombre. */
export function resolveOfficialMvpAgainstSquadPlayers(
  squadPlayers: SquadPlayerForMvpResolve[],
  official: OfficialMvpSourceCandidate,
  predictedNames: string[] = [],
): { playerName: string; teamName: string } {
  const teamName = openFootballTeamName(official.teamName);
  const trimmedPlayer = official.playerName.trim();
  const teamPool = squadPlayers.filter((row) => openFootballTeamName(row.teamName) === teamName);

  const fifaPlayerId = official.fifaPlayerId?.trim();
  if (fifaPlayerId) {
    const byFifaId = teamPool.filter((row) => row.externalPlayerKey?.trim() === fifaPlayerId);
    if (byFifaId.length === 1) {
      return {
        playerName: pickStoredPlayerName(byFifaId[0]!.playerName, predictedNames, trimmedPlayer),
        teamName,
      };
    }
  }

  const shirtNumber = official.shirtNumber;
  if (shirtNumber != null && shirtNumber > 0) {
    const byShirt = findMvpOptionBySaved(
      teamPool.map(toMvpOption),
      trimmedPlayer,
      teamName,
      shirtNumber,
    );
    if (byShirt) {
      return {
        playerName: pickStoredPlayerName(byShirt.name, predictedNames, trimmedPlayer),
        teamName,
      };
    }
  }

  const byName = findMvpOptionBySaved(
    teamPool.map(toMvpOption),
    trimmedPlayer,
    teamName,
    null,
  );
  if (byName) {
    return {
      playerName: pickStoredPlayerName(byName.name, predictedNames, trimmedPlayer),
      teamName,
    };
  }

  return {
    playerName: resolveStoredOfficialMvpPlayerName(trimmedPlayer, predictedNames),
    teamName,
  };
}

function toMvpOption(row: SquadPlayerForMvpResolve) {
  return {
    name: row.playerName,
    teamName: openFootballTeamName(row.teamName),
    shirtNumber: row.shirtNumber,
  };
}

function pickStoredPlayerName(
  squadName: string,
  predictedNames: string[],
  fallback: string,
): string {
  return resolveStoredOfficialMvpPlayerName(squadName, predictedNames) || squadName.trim() || fallback;
}

export async function loadWc2026SquadPlayersForTeams(
  admin: AdminClient,
  teamNames: string[],
): Promise<SquadPlayerForMvpResolve[]> {
  const lookupNames = [...new Set(teamNames.flatMap((team) => squadLookupNames(team)))];
  if (!lookupNames.length) return [];

  const { data: squads, error: squadsError } = await admin
    .from("team_squads")
    .select("id, team_name")
    .eq("year", WC2026_SQUAD_YEAR)
    .eq("source_code", WC2026_FEED_SOURCE)
    .in("team_name", lookupNames);

  if (squadsError) throw new Error(`team_squads mvp resolve: ${squadsError.message}`);
  if (!squads?.length) return [];

  const squadIds = squads.map((row) => row.id);
  const teamBySquadId = new Map(squads.map((row) => [row.id, row.team_name as string]));

  const { data: players, error: playersError } = await admin
    .from("team_squad_players")
    .select("squad_id, player_name, shirt_number, external_player_key")
    .in("squad_id", squadIds);

  if (playersError) throw new Error(`team_squad_players mvp resolve: ${playersError.message}`);

  return (players ?? []).flatMap((row) => {
    const team = teamBySquadId.get(row.squad_id);
    if (!team) return [];
    return [
      {
        playerName: row.player_name as string,
        teamName: openFootballTeamName(team),
        shirtNumber: (row.shirt_number as number | null) ?? null,
        externalPlayerKey: (row.external_player_key as string | null) ?? null,
      },
    ];
  });
}

export async function resolveOfficialMvpToSquad(
  admin: AdminClient,
  official: OfficialMvpSourceCandidate,
  predictedNames: string[] = [],
): Promise<{ playerName: string; teamName: string }> {
  const teamName = openFootballTeamName(official.teamName);
  const squadPlayers = await loadWc2026SquadPlayersForTeams(admin, [teamName]);
  return resolveOfficialMvpAgainstSquadPlayers(squadPlayers, { ...official, teamName }, predictedNames);
}
