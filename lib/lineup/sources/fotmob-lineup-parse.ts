import { dedupeBenchAgainstStarters } from "@/lib/lineup/bench-dedupe";
import {
  fallbackSlotKeyForRole,
  normalizeFormationTemplate,
} from "@/lib/lineup/formation-templates";
import { layoutPredictedStarters } from "@/lib/lineup/predicted-slot-layout";
import { positionLabelEs } from "@/lib/lineup/position-map";
import { findSquadPlayer, reserveSquadPlayerIdentity } from "@/lib/lineup/sources/bsd-squad-match";
import { FOTMOB_SOURCE_CODE, type FotMobLineupPlayer, type FotMobLineupTeam } from "@/lib/lineup/sources/fotmob-client";
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

function roleFromFotmobPlayer(player: FotMobLineupPlayer): PositionRole {
  const usual = player.usualPlayingPositionId;
  if (usual === 0) return "GK";
  if (usual === 1) return "DF";
  if (usual === 3) return "FW";
  return "MF";
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

export function parseFotmobConfirmedTeamLineup(
  payload: FotMobLineupTeam,
  players: LineupPlayerInput[],
  fetchedAt: string
): ResolvedLineup | null {
  const starters = (payload.starters ?? []).filter((player) => player.name?.trim());
  if (starters.length < 11) return null;

  const formationLabel = normalizeFormationLabel(payload.formation);
  const formation = toFormationId(formationLabel);
  const usedSquadIdentities = new Set<string>();
  const roleGroups: Record<PositionRole, number> = { GK: 0, DF: 0, MF: 0, FW: 0 };

  const starterInputs = starters.slice(0, 11).map((starter, index) => {
    const shirtNumber = parseShirtNumber(starter.shirtNumber);
    const squadPlayer = findSquadPlayer(
      { name: starter.name ?? "", shirtNumber: shirtNumber ?? 0 },
      players,
      [],
      new Set<number>(),
      { excludeIdentities: usedSquadIdentities }
    );
    reserveSquadPlayerIdentity(squadPlayer, usedSquadIdentities);

    const role = roleFromFotmobPlayer(starter);
    const roleIndex = roleGroups[role];
    roleGroups[role] += 1;

    const templateId = normalizeFormationTemplate(formationLabel);
    const slotKey = fallbackSlotKeyForRole(templateId, role, roleIndex);
    const name = squadPlayer?.player_name ?? starter.name ?? "Por confirmar";

    return {
      slotKey,
      role,
      key: `${name}-${shirtNumber ?? index}`,
      name,
      shirtNumber: squadPlayer?.shirt_number ?? shirtNumber,
      positionLabel: positionLabelEs(role, squadPlayer?.position ?? null),
      isPlaceholder: !name || name === "Por confirmar",
    };
  });

  const slots: LineupSlot[] = layoutPredictedStarters(starterInputs, formationLabel);

  const rawBench = (payload.subs ?? [])
    .map((player, index) => {
      const squadPlayer = findSquadPlayer(
        {
          name: player.name ?? "",
          shirtNumber: parseShirtNumber(player.shirtNumber) ?? 0,
        },
        players,
        [],
        new Set<number>()
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
