import { clampToPlayable } from "@/lib/lineup/field-layout";
import type { FieldCoordinate, FormationId, PositionRole } from "@/lib/lineup/types";

/** Formaciones con plantilla visual fija (misma disposición siempre). */
export type FormationTemplateId = "4-3-3" | "4-4-2" | "4-2-3-1";

type TemplateAnchor = {
  accept: readonly string[];
  coord: FieldCoordinate;
};

const TEMPLATES: Record<FormationTemplateId, TemplateAnchor[]> = {
  "4-3-3": [
    { accept: ["GK"], coord: { x: 50, y: 78 } },
    { accept: ["LB", "LWB"], coord: { x: 20, y: 66 } },
    { accept: ["CB"], coord: { x: 40, y: 66 } },
    { accept: ["CB"], coord: { x: 60, y: 66 } },
    { accept: ["RB", "RWB"], coord: { x: 80, y: 66 } },
    { accept: ["LM", "LCM", "CM"], coord: { x: 26, y: 44 } },
    { accept: ["CM"], coord: { x: 50, y: 44 } },
    { accept: ["RM", "RCM", "CM"], coord: { x: 74, y: 44 } },
    { accept: ["LW"], coord: { x: 22, y: 18 } },
    { accept: ["ST", "CF"], coord: { x: 50, y: 18 } },
    { accept: ["RW"], coord: { x: 80, y: 18 } },
  ],
  "4-4-2": [
    { accept: ["GK"], coord: { x: 50, y: 78 } },
    { accept: ["LB", "LWB"], coord: { x: 20, y: 66 } },
    { accept: ["CB"], coord: { x: 40, y: 66 } },
    { accept: ["CB"], coord: { x: 60, y: 66 } },
    { accept: ["RB", "RWB"], coord: { x: 80, y: 66 } },
    { accept: ["LM", "LW"], coord: { x: 20, y: 44 } },
    { accept: ["CM", "DM"], coord: { x: 40, y: 44 } },
    { accept: ["CM", "DM"], coord: { x: 60, y: 44 } },
    { accept: ["RM", "RW"], coord: { x: 80, y: 44 } },
    { accept: ["ST", "CF"], coord: { x: 38, y: 18 } },
    { accept: ["ST", "CF", "SS"], coord: { x: 62, y: 18 } },
  ],
  "4-2-3-1": [
    { accept: ["GK"], coord: { x: 50, y: 78 } },
    { accept: ["LB", "LWB"], coord: { x: 20, y: 66 } },
    { accept: ["CB"], coord: { x: 40, y: 66 } },
    { accept: ["CB"], coord: { x: 60, y: 66 } },
    { accept: ["RB", "RWB"], coord: { x: 80, y: 66 } },
    { accept: ["DM", "CDM"], coord: { x: 36, y: 54 } },
    { accept: ["DM", "CDM"], coord: { x: 64, y: 54 } },
    { accept: ["LW"], coord: { x: 22, y: 34 } },
    { accept: ["AM", "CAM", "SS"], coord: { x: 50, y: 34 } },
    { accept: ["RW"], coord: { x: 80, y: 34 } },
    { accept: ["ST", "CF"], coord: { x: 50, y: 18 } },
  ],
};

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
};

export function normalizeFormationTemplate(label: string | null | undefined): FormationTemplateId {
  const value = (label ?? "").trim();
  if (value === "4-4-2") return "4-4-2";
  if (value === "4-2-3-1") return "4-2-3-1";
  return "4-3-3";
}

export function normalizeSlotKey(raw: string | null | undefined): string {
  const key = (raw ?? "CM").trim().toUpperCase();
  return SLOT_KEY_ALIASES[key] ?? key;
}

export function getFormationTemplate(formation: FormationTemplateId): TemplateAnchor[] {
  return TEMPLATES[formation];
}

export function getFormationTemplateCoordinates(
  formation: FormationTemplateId
): FieldCoordinate[] {
  return TEMPLATES[formation].map((anchor) => anchor.coord);
}

/** Agrupa coords de plantilla por rol (orden de anclas) para el fallback dorsal+posición. */
export function getRoleCoordinatesFromTemplate(
  formation: FormationId
): Record<PositionRole, FieldCoordinate[]> {
  const templateId = normalizeFormationTemplate(formation);
  const anchors = TEMPLATES[templateId];
  const buckets: Record<PositionRole, FieldCoordinate[]> = {
    GK: [],
    DF: [],
    MF: [],
    FW: [],
  };

  for (const anchor of anchors) {
    const key = anchor.accept[0] ?? "CM";
    if (key === "GK") buckets.GK.push(anchor.coord);
    else if (["LB", "CB", "RB", "LWB", "RWB"].includes(key)) buckets.DF.push(anchor.coord);
    else if (["ST", "CF", "SS", "LW", "RW"].includes(key)) buckets.FW.push(anchor.coord);
    else buckets.MF.push(anchor.coord);
  }

  return buckets;
}

/** Slot sintético cuando la fuente solo aporta rol + índice (fallback / confirmada). */
export function fallbackSlotKeyForRole(
  formation: FormationTemplateId,
  role: PositionRole,
  index: number
): string {
  if (role === "GK") return "GK";

  if (role === "DF") {
    return (["LB", "CB", "CB", "RB"] as const)[index] ?? "CB";
  }

  if (formation === "4-4-2") {
    if (role === "MF") return (["LM", "CM", "CM", "RM"] as const)[index] ?? "CM";
    return index === 0 ? "ST" : "ST";
  }

  if (formation === "4-2-3-1") {
    if (role === "MF") return (["DM", "DM", "AM"] as const)[index] ?? "CM";
    if (role === "FW") return (["LW", "ST", "RW"] as const)[index] ?? "ST";
    return "CM";
  }

  // 4-3-3
  if (role === "MF") return (["LM", "CM", "RM"] as const)[index] ?? "CM";
  if (role === "FW") return (["LW", "ST", "RW"] as const)[index] ?? "ST";
  return "CM";
}

type LayoutInput = {
  slotKey: string;
  role: PositionRole;
};

function starterMatchesAnchor(starter: LayoutInput, accept: readonly string[]): boolean {
  const key = normalizeSlotKey(starter.slotKey);
  if (accept.includes(key)) return true;

  if (accept.includes("CB") && starter.role === "DF" && key === "CB") return true;
  if (accept.includes("CM") && starter.role === "MF" && key === "CM") return true;
  if (accept.includes("ST") && starter.role === "FW" && (key === "ST" || key === "CF")) return true;

  return false;
}

/**
 * Asigna coordenadas fijas de plantilla según slot táctico y formación.
 * Todos los equipos con la misma formación comparten la misma geometría.
 */
export function assignFormationTemplateCoordinates<T extends LayoutInput>(
  starters: T[],
  formationLabel: string | null | undefined
): Array<T & FieldCoordinate> {
  const formation = normalizeFormationTemplate(formationLabel);
  const anchors = TEMPLATES[formation];
  const pool = starters.map((starter, index) => ({ starter, index }));
  const positioned: Array<T & FieldCoordinate> = [];

  for (const anchor of anchors) {
    const matchIndex = pool.findIndex(({ starter }) =>
      starterMatchesAnchor(starter, anchor.accept)
    );

    if (matchIndex === -1) continue;

    const [{ starter }] = pool.splice(matchIndex, 1);
    positioned.push({
      ...starter,
      ...clampToPlayable(anchor.coord),
    });
  }

  for (const { starter } of pool) {
    positioned.push({
      ...starter,
      ...clampToPlayable({ x: 50, y: 50 }),
    });
  }

  return positioned;
}
