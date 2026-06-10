import { dedupeBenchAgainstStarters } from "@/lib/lineup/bench-dedupe";
import {
  fallbackSlotKeyForRole,
  normalizeFormationTemplate,
} from "@/lib/lineup/formation-templates";
import {
  loadOfficialSquad,
  loadOfficialSquadFromClient,
  type OfficialSquadPlayer,
} from "@/lib/lineup/lineup-queries";
import type { SupabaseClient } from "@supabase/supabase-js";
import { layoutPredictedStarters } from "@/lib/lineup/predicted-slot-layout";
import {
  refinePredictedSlotKey,
  swapMirroredDefenderSlots,
  swapMirroredForwardSlots,
  tacticalSlotLabelEs,
} from "@/lib/lineup/tactical-profile";
import {
  findSquadPlayer,
  reserveSquadPlayerIdentity,
} from "@/lib/lineup/sources/bsd-squad-match";
import type {
  BsdConfirmedPlayer,
  BsdConfirmedTeamLineup,
  BsdPredictedPlayer,
  BsdPredictedTeamLineup,
} from "@/lib/lineup/sources/bsd-client";
import { BSD_SOURCE_CODE } from "@/lib/lineup/sources/bsd-constants";
import { normalizePositionRole, positionLabelEs } from "@/lib/lineup/position-map";
import type {
  LineupBenchPlayer,
  LineupPlayerInput,
  LineupSlot,
  PositionRole,
  ResolvedLineup,
} from "@/lib/lineup/types";

function normalizeFormationLabel(raw: string | null | undefined): string {
  const value = (raw ?? "").trim();
  return value.length > 0 ? value : "4-3-3";
}

function toFormationId(label: string) {
  return normalizeFormationTemplate(label);
}

function roleFromPosition(position: string | null | undefined): PositionRole {
  const raw = (position ?? "").trim().toUpperCase();
  if (raw === "G" || raw === "GK") return "GK";
  if (raw === "D" || raw === "DF") return "DF";
  if (raw === "F" || raw === "FW") return "FW";
  return "MF";
}

function toBenchPlayer(
  player: BsdConfirmedPlayer | BsdPredictedPlayer,
  squadPlayer: LineupPlayerInput | null,
  index: number,
  useOfficialShirtsOnly: boolean
): LineupBenchPlayer | null {
  const name = squadPlayer?.player_name ?? player.name;
  if (!name) return null;
  return {
    key: `${name}-${squadPlayer?.shirt_number ?? player.jersey_number ?? index}`,
    name,
    shirtNumber: useOfficialShirtsOnly
      ? (squadPlayer?.shirt_number ?? null)
      : (squadPlayer?.shirt_number ?? player.jersey_number ?? null),
    position: squadPlayer?.position ?? player.position ?? null,
  };
}

function resolvePredictedStarter(
  starter: BsdPredictedPlayer,
  index: number,
  players: LineupPlayerInput[],
  officialSquad: OfficialSquadPlayer[],
  usedShirtNumbers: Set<number>,
  usedSquadIdentities: Set<string>
) {
  const squadPlayer = findSquadPlayer(
    {
      name: starter.name ?? "",
      shirtNumber: starter.jersey_number ?? 0,
    },
    players,
    officialSquad,
    usedShirtNumbers,
    { excludeIdentities: usedSquadIdentities }
  );

  if (squadPlayer?.shirt_number) {
    usedShirtNumbers.add(squadPlayer.shirt_number);
    reserveSquadPlayerIdentity(squadPlayer, usedSquadIdentities);
  }

  const bsdName = starter.name?.trim() ?? "";
  const isPlaceholder = !bsdName;
  const name = squadPlayer?.player_name ?? (bsdName || "Por confirmar");
  const rawSlot = (starter.predicted_slot ?? starter.position ?? "CM").toUpperCase();

  return {
    name,
    slotKey: rawSlot,
    squadPosition: squadPlayer?.position ?? starter.position ?? null,
    index,
    starter,
    squadPlayer,
    isPlaceholder,
  };
}

export function parseBsdPredictedTeamLineupWithOfficialSquad(
  payload: BsdPredictedTeamLineup,
  players: LineupPlayerInput[],
  fetchedAt: string,
  officialSquad: OfficialSquadPlayer[]
): ResolvedLineup | null {
  const starters = (payload.starters ?? []).filter(
    (player) => (player.availability ?? "available") === "available"
  );
  if (starters.length < 11) return null;

  const formationLabel = normalizeFormationLabel(payload.predicted_formation);
  const formation = toFormationId(formationLabel);
  const useOfficial = officialSquad.length > 0;
  const usedShirtNumbers = new Set<number>();
  const usedSquadIdentities = new Set<string>();

  const rawStarterInputs = starters
    .slice(0, 11)
    .map((starter, index) =>
      resolvePredictedStarter(
        starter,
        index,
        players,
        officialSquad,
        usedShirtNumbers,
        usedSquadIdentities
      )
    );

  const refinedSlots = swapMirroredForwardSlots(
    swapMirroredDefenderSlots(
      rawStarterInputs.map((row) => ({
        name: row.name,
        slotKey: refinePredictedSlotKey(row.name, row.slotKey, row.squadPosition),
        squadPosition: row.squadPosition,
      }))
    )
  );

  const starterInputs = rawStarterInputs.map((row, index) => {
    const slotKey = refinedSlots[index]!.slotKey;
    const role = roleFromPosition(row.squadPlayer?.position ?? row.starter.position);
    const tacticalLabel = tacticalSlotLabelEs(slotKey);

    return {
      slotKey,
      role,
      key: `${slotKey}-${row.index}`,
      name: row.name,
      shirtNumber: useOfficial
        ? (row.squadPlayer?.shirt_number ?? null)
        : (row.squadPlayer?.shirt_number ?? row.starter.jersey_number ?? null),
      positionLabel:
        tacticalLabel ??
        positionLabelEs(role, row.squadPlayer?.position ?? row.starter.position ?? null),
      isPlaceholder: row.isPlaceholder,
    };
  });

  const slots: LineupSlot[] = layoutPredictedStarters(starterInputs, formationLabel);

  const rawBench = (payload.substitutes ?? [])
    .map((player, index) => {
      const squadPlayer = findSquadPlayer(
        { name: player.name ?? "", shirtNumber: player.jersey_number ?? 0 },
        players,
        officialSquad,
        usedShirtNumbers,
        { excludeIdentities: usedSquadIdentities }
      );
      if (squadPlayer?.shirt_number) {
        usedShirtNumbers.add(squadPlayer.shirt_number);
        reserveSquadPlayerIdentity(squadPlayer, usedSquadIdentities);
      }
      return toBenchPlayer(player, squadPlayer, index, useOfficial);
    })
    .filter((player): player is LineupBenchPlayer => player != null);

  const bench = dedupeBenchAgainstStarters(rawBench, slots);

  return {
    formation,
    formationLabel,
    slots,
    bench,
    benchCount: bench.length,
    isProbable: true,
    sourceKind: "predicted",
    dataSourceCode: BSD_SOURCE_CODE,
    fetchedAt: payload.updated_at ?? fetchedAt,
  };
}

export async function parseBsdPredictedTeamLineup(
  payload: BsdPredictedTeamLineup,
  players: LineupPlayerInput[],
  fetchedAt: string,
  options?: { supabase?: SupabaseClient }
): Promise<ResolvedLineup | null> {
  const teamName = payload.team?.trim() ?? "";
  let officialSquad: OfficialSquadPlayer[] = [];
  if (teamName) {
    officialSquad = options?.supabase
      ? await loadOfficialSquadFromClient(options.supabase, teamName)
      : await loadOfficialSquad(teamName);
  }
  return parseBsdPredictedTeamLineupWithOfficialSquad(
    payload,
    players,
    fetchedAt,
    officialSquad
  );
}

export function parseBsdConfirmedTeamLineup(
  payload: BsdConfirmedTeamLineup,
  players: LineupPlayerInput[],
  fetchedAt: string
): ResolvedLineup | null {
  const starters = payload.players ?? [];
  if (starters.length < 11) return null;

  const formationLabel = normalizeFormationLabel(payload.formation);
  const formation = toFormationId(formationLabel);

  const usedSquadIdentities = new Set<string>();
  const roleGroups: Record<PositionRole, number> = { GK: 0, DF: 0, MF: 0, FW: 0 };

  const starterInputs = starters.slice(0, 11).map((starter, index) => {
    const squadPlayer = findSquadPlayer(
      { name: starter.name ?? "", shirtNumber: starter.jersey_number ?? 0 },
      players,
      [],
      new Set<number>(),
      { excludeIdentities: usedSquadIdentities }
    );
    reserveSquadPlayerIdentity(squadPlayer, usedSquadIdentities);
    const role = roleFromPosition(squadPlayer?.position ?? starter.position);
    const roleIndex = roleGroups[role];
    roleGroups[role] += 1;
    const templateId = normalizeFormationTemplate(formationLabel);
    const slotKey = fallbackSlotKeyForRole(templateId, role, roleIndex);
    const name = squadPlayer?.player_name ?? starter.name ?? "Por confirmar";

    return {
      slotKey,
      role,
      key: `${name}-${starter.jersey_number ?? index}`,
      name,
      shirtNumber: squadPlayer?.shirt_number ?? starter.jersey_number ?? null,
      positionLabel: positionLabelEs(role, squadPlayer?.position ?? starter.position ?? null),
      isPlaceholder: !name,
    };
  });

  const slots: LineupSlot[] = layoutPredictedStarters(starterInputs, formationLabel);

  const rawBench = (payload.substitutes ?? [])
    .map((player, index) => {
      const squadPlayer = findSquadPlayer(
        { name: player.name ?? "", shirtNumber: player.jersey_number ?? 0 },
        players,
        [],
        new Set<number>()
      );
      return toBenchPlayer(player, squadPlayer, index, false);
    })
    .filter((player): player is LineupBenchPlayer => player != null);

  const bench = dedupeBenchAgainstStarters(rawBench, slots);

  return {
    formation,
    formationLabel,
    slots,
    bench,
    benchCount: bench.length,
    isProbable: false,
    sourceKind: "confirmed",
    dataSourceCode: BSD_SOURCE_CODE,
    fetchedAt,
  };
}
