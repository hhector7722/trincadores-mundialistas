import { buildProbableXI } from "@/lib/lineup/build-probable-xi";
import { clampToPlayable } from "@/lib/lineup/field-layout";
import { getFormationSlotAnchors } from "@/lib/lineup/formation-coordinates";
import {
  normalizeFormationTemplate,
  starterMatchesAnchor,
} from "@/lib/lineup/formation-templates";
import type {
  FormationId,
  LineupPlayerInput,
  LineupSlot,
  PositionRole,
  ResolvedLineup,
} from "@/lib/lineup/types";

export type FormationStarterInput = {
  key: string;
  name: string;
  shirtNumber: number | null;
  positionLabel: string;
  role: PositionRole;
  isPlaceholder: boolean;
  slotKey: string;
};

function slotRoleForAnchorKey(slotKey: string): PositionRole {
  if (slotKey === "GK") return "GK";
  if (["LST", "RST", "ST", "LW", "RW"].includes(slotKey)) return "FW";
  if (["LB", "RB", "LCB", "RCB", "CB", "LWB", "RWB"].includes(slotKey)) return "DF";
  return "MF";
}

function placeholderForAnchor(anchorKey: string, coord: { x: number; y: number }): LineupSlot {
  const clamped = clampToPlayable(coord);
  return {
    key: `placeholder-${anchorKey}`,
    name: "Por confirmar",
    shirtNumber: null,
    positionLabel: anchorKey,
    role: slotRoleForAnchorKey(anchorKey),
    isPlaceholder: true,
    slotKey: anchorKey,
    x: clamped.x,
    y: clamped.y,
  };
}

/**
 * Asigna jugadores a anclas fijas en orden de plantilla.
 * Siempre fuerza coordenadas del anchor; sin `pool.shift()` ni coords de caché.
 */
export function resolveFormationSlotsFromStarters<T extends FormationStarterInput>(
  starters: T[],
  formationId: FormationId
): Array<T & { slotKey: string; x: number; y: number }> {
  const formation = normalizeFormationTemplate(formationId);
  const anchors = getFormationSlotAnchors(formation);
  const pool = starters.map((starter) => ({ ...starter }));

  return anchors.map((anchor) => {
    const coord = clampToPlayable(anchor.coord);
    const matchIndex = pool.findIndex((starter) =>
      starterMatchesAnchor(starter, formation, anchor.accept)
    );

    if (matchIndex === -1) {
      return placeholderForAnchor(anchor.key, coord) as T & {
        slotKey: string;
        x: number;
        y: number;
      };
    }

    const [matched] = pool.splice(matchIndex, 1);
    return {
      ...matched!,
      slotKey: anchor.key,
      x: coord.x,
      y: coord.y,
    };
  });
}

/** Resuelve 11 titulares desde convocatoria (infiere slotKey por dorsal+posición). */
export function resolveFormationSlots(
  players: LineupPlayerInput[],
  formationId: FormationId
): LineupSlot[] {
  const probable = buildProbableXI(players, formationId);
  return resolveFormationSlotsFromStarters(
    probable.slots.map((slot) => ({
      key: slot.key,
      name: slot.name,
      shirtNumber: slot.shirtNumber,
      positionLabel: slot.positionLabel,
      role: slot.role,
      isPlaceholder: slot.isPlaceholder,
      slotKey: slot.slotKey ?? "CM",
    })),
    formationId
  );
}

/** Normaliza titulares de una alineación resuelta (fuente BSD/API/caché). */
export function resolveFormationSlotsFromLineup(lineup: ResolvedLineup): LineupSlot[] {
  const formationId = normalizeFormationTemplate(lineup.formationLabel);
  return resolveFormationSlotsFromStarters(
    lineup.slots.slice(0, 11).map((slot) => ({
      key: slot.key,
      name: slot.name,
      shirtNumber: slot.shirtNumber,
      positionLabel: slot.positionLabel,
      role: slot.role,
      isPlaceholder: slot.isPlaceholder,
      slotKey: slot.slotKey?.trim() || "CM",
    })),
    formationId
  );
}
