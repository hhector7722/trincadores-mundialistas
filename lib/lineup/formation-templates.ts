import { clampToPlayable } from "@/lib/lineup/field-layout";
import {
  FORMATION_SLOT_ANCHORS,
  getFormationCoordinates,
  getFormationSlotAnchors,
  isFormationId,
  type FormationSlotAnchor,
} from "@/lib/lineup/formation-coordinates";
import type { FieldCoordinate, FormationId, PositionRole } from "@/lib/lineup/types";

export type { FormationSlotAnchor };
export { getFormationCoordinates, getFormationSlotAnchors, isFormationId };

const SLOT_KEY_ALIASES: Record<string, string> = {
  G: "GK",
  GOALKEEPER: "GK",
  D: "CB",
  DF: "CB",
  DFC: "CB",
  CDM: "DM",
  CAM: "AM",
  LWB: "LB",
  RWB: "RB",
  CF: "ST",
  LCM: "CM",
  RCM: "CM",
  MCD: "DM",
  MC: "CM",
  MI: "LM",
  MD: "RM",
  MP: "AM",
  EI: "LW",
  ED: "RW",
  DC: "ST",
  LI: "LB",
  LD: "RB",
  POR: "GK",
};

export function normalizeFormationTemplate(label: string | null | undefined): FormationId {
  const value = (label ?? "").trim();
  if (isFormationId(value)) return value;
  return "4-3-3";
}

/** Alias semántico para normalizar etiquetas de formación. */
export const normalizeFormationId = normalizeFormationTemplate;

export function normalizeSlotKey(raw: string | null | undefined): string {
  const key = (raw ?? "CM").trim().toUpperCase();
  return SLOT_KEY_ALIASES[key] ?? key;
}

export function getFormationTemplate(formation: FormationId): FormationSlotAnchor[] {
  return getFormationSlotAnchors(formation);
}

export function getFormationTemplateCoordinates(formation: FormationId): FieldCoordinate[] {
  return getFormationCoordinates(formation).map(clampToPlayable);
}

function roleForFormationSlot(formation: FormationId, slotKey: string): PositionRole {
  if (slotKey === "GK") return "GK";
  if (["LST", "RST", "ST"].includes(slotKey)) return "FW";
  if (["LW", "RW"].includes(slotKey)) return "FW";
  if (formation === "3-5-2" && (slotKey === "LWB" || slotKey === "RWB")) return "MF";
  if (["LB", "RB", "LCB", "RCB", "CB", "LWB", "RWB"].includes(slotKey)) return "DF";
  return "MF";
}

/** Agrupa coords de plantilla por rol (orden de anclas) para el fallback dorsal+posición. */
export function getRoleCoordinatesFromTemplate(
  formation: FormationId
): Record<PositionRole, FieldCoordinate[]> {
  const templateId = normalizeFormationTemplate(formation);
  const anchors = FORMATION_SLOT_ANCHORS[templateId];
  const buckets: Record<PositionRole, FieldCoordinate[]> = {
    GK: [],
    DF: [],
    MF: [],
    FW: [],
  };

  for (const anchor of anchors) {
    const role = roleForFormationSlot(templateId, anchor.key);
    buckets[role].push(clampToPlayable(anchor.coord));
  }

  return buckets;
}

/** Slot sintético cuando la fuente solo aporta rol + índice (fallback / confirmada). */
export function fallbackSlotKeyForRole(
  formation: FormationId,
  role: PositionRole,
  index: number
): string {
  if (role === "GK") return "GK";

  if (formation === "3-5-2") {
    if (role === "DF") return (["LCB", "CB", "RCB"] as const)[index] ?? "CB";
    if (role === "MF") return (["LWB", "LCM", "CM", "RCM", "RWB"] as const)[index] ?? "CM";
    return index === 0 ? "LST" : "RST";
  }

  if (formation === "5-3-2") {
    if (role === "DF") return (["LWB", "LCB", "CB", "RCB", "RWB"] as const)[index] ?? "CB";
    if (role === "MF") return (["LCM", "CM", "RCM"] as const)[index] ?? "CM";
    return index === 0 ? "LST" : "RST";
  }

  if (role === "DF") {
    return (["LB", "LCB", "RCB", "RB"] as const)[index] ?? "CB";
  }

  if (formation === "4-4-2") {
    if (role === "MF") return (["LM", "LCM", "RCM", "RM"] as const)[index] ?? "CM";
    return index === 0 ? "LST" : "RST";
  }

  if (formation === "4-2-3-1") {
    if (role === "MF") return (["LDM", "RDM", "AM"] as const)[index] ?? "CM";
    if (role === "FW") return (["LW", "ST", "RW"] as const)[index] ?? "ST";
    return "CM";
  }

  if (formation === "4-1-4-1") {
    if (role === "MF") return (["DM", "LM", "LCM", "RCM", "RM"] as const)[index] ?? "CM";
    if (role === "FW") return "ST";
    return "CM";
  }

  // 4-3-3
  if (role === "MF") return (["DM", "LCM", "RCM"] as const)[index] ?? "CM";
  if (role === "FW") return (["LW", "ST", "RW"] as const)[index] ?? "ST";
  return "CM";
}

type LayoutInput = {
  slotKey: string;
  role: PositionRole;
};

function expandedAccept(
  formation: FormationId,
  accept: readonly string[]
): string[] {
  const keys = new Set(accept.map((key) => normalizeSlotKey(key)));

  if (formation === "4-3-3") {
    const midfieldLine = ["LCM", "RCM", "CM", "LM", "RM"];
    if ([...keys].some((key) => midfieldLine.includes(key))) {
      keys.add("DM");
      keys.add("AM");
    }
    if (keys.has("DM")) {
      keys.add("CM");
    }
  }

  if (formation === "4-2-3-1") {
    if (keys.has("AM")) {
      keys.add("CM");
    }
    if (keys.has("LW") || keys.has("RW")) {
      keys.add("LM");
      keys.add("RM");
    }
  }

  if (formation === "4-1-4-1") {
    if (keys.has("LM")) keys.add("LW");
    if (keys.has("RM")) keys.add("RW");
    if (keys.has("DM")) keys.add("CM");
  }

  if (formation === "3-5-2") {
    if (keys.has("LWB")) keys.add("LB");
    if (keys.has("RWB")) keys.add("RB");
  }

  if (formation === "5-3-2") {
    if (keys.has("LWB")) keys.add("LB");
    if (keys.has("RWB")) keys.add("RB");
  }

  return [...keys];
}

/** Matching slot táctico ↔ ancla de plantilla (usado por `resolveFormationSlots`). */
export function starterMatchesAnchor(
  starter: LayoutInput,
  formation: FormationId,
  accept: readonly string[]
): boolean {
  const key = normalizeSlotKey(starter.slotKey);
  const keys = expandedAccept(formation, accept);
  if (keys.includes(key)) return true;

  if (keys.includes("CB") && starter.role === "DF" && key === "CB") return true;
  if (keys.includes("CM") && starter.role === "MF" && key === "CM") return true;
  if (keys.includes("ST") && starter.role === "FW" && (key === "ST" || key === "CF")) return true;
  if (keys.includes("DM") && starter.role === "MF" && key === "DM") return true;

  return false;
}

/**
 * Asigna coordenadas de plantilla. Delega en `resolveFormationSlotsFromStarters`.
 * No invocar desde componentes visuales; usar `resolveFormationSlots` / `resolveFormationSlotsFromLineup`.
 */
export function assignFormationTemplateCoordinates<T extends LayoutInput>(
  starters: T[],
  formationLabel: string | null | undefined
): Array<T & FieldCoordinate & { slotKey: string }> {
  // Import dinámico para evitar ciclo formation-templates ↔ resolve-formation-slots.
  const { resolveFormationSlotsFromStarters } = require("./resolve-formation-slots") as typeof import("./resolve-formation-slots");
  return resolveFormationSlotsFromStarters(
    starters,
    normalizeFormationTemplate(formationLabel)
  ) as Array<T & FieldCoordinate & { slotKey: string }>;
}
