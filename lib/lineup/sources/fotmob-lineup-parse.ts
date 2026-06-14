import { dedupeBenchAgainstStarters } from "@/lib/lineup/bench-dedupe";
import { normalizeFormationTemplate } from "@/lib/lineup/formation-templates";
import {
  loadOfficialSquadFromClient,
  type OfficialSquadPlayer,
} from "@/lib/lineup/lineup-queries";
import { positionLabelEs } from "@/lib/lineup/position-map";
import { tacticalSlotLabelEs } from "@/lib/lineup/tactical-profile";
import { FOTMOB_SOURCE_CODE, type FotMobLineupPlayer, type FotMobLineupTeam } from "@/lib/lineup/sources/fotmob-client";
import { fotmobPlayerToFieldCoord } from "@/lib/lineup/sources/fotmob-layout-coords";
import {
  roleFromSlotKey,
  slotKeyFromFotmobPositionId,
} from "@/lib/lineup/sources/fotmob-position-id";
import { findSquadPlayer, reserveSquadPlayerIdentity } from "@/lib/lineup/sources/bsd-squad-match";
import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  LineupBenchPlayer,
  LineupPlayerInput,
  LineupSlot,
  ResolvedLineup,
} from "@/lib/lineup/types";

function normalizeFormationLabel(raw: string | null | undefined): string {
  const value = (raw ?? "").trim();
  return value.length > 0 ? value : "4-3-3";
}

function parseShirtNumber(raw: string | number | null | undefined): number | null {
  if (raw == null) return null;
  const parsed = typeof raw === "number" ? raw : Number(String(raw).trim());
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function toBenchPlayer(
  player: FotMobLineupPlayer,
  squadPlayer: LineupPlayerInput | null,
  index: number
): LineupBenchPlayer | null {
  const name = squadPlayer?.player_name ?? player.name?.trim();
  if (!name) return null;

  const shirtNumber = squadPlayer?.shirt_number ?? parseShirtNumber(player.shirtNumber);

  return {
    key: `${name}-${shirtNumber ?? index}`,
    name,
    shirtNumber,
    position: squadPlayer?.position ?? null,
  };
}

function starterSlotFromFotmob(
  starter: FotMobLineupPlayer,
  squadPlayer: LineupPlayerInput | null,
  index: number
): LineupSlot | null {
  const coord = fotmobPlayerToFieldCoord(starter);
  if (!coord) return null;

  const slotKey = slotKeyFromFotmobPositionId(starter.positionId) ?? "CM";
  const role = roleFromSlotKey(slotKey);
  const shirtNumber = squadPlayer?.shirt_number ?? parseShirtNumber(starter.shirtNumber);
  const name = squadPlayer?.player_name ?? starter.name?.trim() ?? "Por confirmar";
  const tacticalLabel = tacticalSlotLabelEs(slotKey);

  return {
    key: `${name}-${shirtNumber ?? index}`,
    name,
    shirtNumber,
    positionLabel:
      tacticalLabel ?? positionLabelEs(role, squadPlayer?.position ?? null),
    role,
    isPlaceholder: !name || name === "Por confirmar",
    slotKey,
    x: coord.x,
    y: coord.y,
  };
}

export function parseFotmobConfirmedTeamLineup(
  payload: FotMobLineupTeam,
  players: LineupPlayerInput[],
  fetchedAt: string,
  officialSquad: OfficialSquadPlayer[] = []
): ResolvedLineup | null {
  const starters = (payload.starters ?? []).filter((player) => player.name?.trim());
  if (starters.length < 11) return null;

  const formationLabel = normalizeFormationLabel(payload.formation);
  const formation = normalizeFormationTemplate(formationLabel);
  const usedSquadIdentities = new Set<string>();
  const usedShirtNumbers = new Set<number>();

  const slots: LineupSlot[] = starters
    .slice(0, 11)
    .map((starter, index) => {
      const shirtNumber = parseShirtNumber(starter.shirtNumber);
      const squadPlayer = findSquadPlayer(
        { name: starter.name ?? "", shirtNumber: shirtNumber ?? 0 },
        players,
        officialSquad,
        usedShirtNumbers,
        { excludeIdentities: usedSquadIdentities }
      );
      if (squadPlayer?.shirt_number) {
        usedShirtNumbers.add(squadPlayer.shirt_number);
        reserveSquadPlayerIdentity(squadPlayer, usedSquadIdentities);
      }

      return starterSlotFromFotmob(starter, squadPlayer, index);
    })
    .filter((slot): slot is LineupSlot => slot != null);

  if (slots.length < 11) return null;

  const rawBench = (payload.subs ?? [])
    .map((player, index) => {
      const squadPlayer = findSquadPlayer(
        {
          name: player.name ?? "",
          shirtNumber: parseShirtNumber(player.shirtNumber) ?? 0,
        },
        players,
        officialSquad,
        usedShirtNumbers
      );
      return toBenchPlayer(player, squadPlayer, index);
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
    dataSourceCode: FOTMOB_SOURCE_CODE,
    fetchedAt,
  };
}

export async function parseFotmobConfirmedTeamLineupWithOfficialSquad(
  payload: FotMobLineupTeam,
  players: LineupPlayerInput[],
  fetchedAt: string,
  options?: { supabase?: SupabaseClient; teamName?: string }
): Promise<ResolvedLineup | null> {
  const teamName = options?.teamName?.trim() ?? payload.name?.trim() ?? "";
  let officialSquad: OfficialSquadPlayer[] = [];

  if (teamName && options?.supabase) {
    officialSquad = await loadOfficialSquadFromClient(options.supabase, teamName);
  }

  return parseFotmobConfirmedTeamLineup(payload, players, fetchedAt, officialSquad);
}